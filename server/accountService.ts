import { db } from "./db";
import { users, properties, leads, propertyInquiries, type User, type InsertUser } from "@shared/schema";
import { eq, and, count, sql } from "drizzle-orm";

export class AccountService {
  
  // Account Type Constants
  static readonly ACCOUNT_TYPES = {
    CUSTOMER: 'customer',
    INDIVIDUAL_BROKER: 'individual_broker', 
    CORPORATE_COMPANY: 'corporate_company',
    PLATFORM_ADMIN: 'platform_admin'
  } as const;

  // Limits for Individual Brokers
  static readonly INDIVIDUAL_BROKER_LIMITS = {
    MAX_ACTIVE_LISTINGS: 30,
    MAX_CUSTOMERS: 100
  };

  // Limits for Corporate Company Employees
  static readonly CORPORATE_EMPLOYEE_LIMITS = {
    MAX_LISTINGS_PER_EMPLOYEE: 100,
    MAX_CUSTOMERS_PER_EMPLOYEE: 500
  };

  /**
   * Create a new user account with proper limits and settings
   */
  async createAccount(userData: InsertUser): Promise<User> {
    const accountData = { ...userData };

    // Set limits based on account type
    switch (accountData.accountType) {
      case AccountService.ACCOUNT_TYPES.INDIVIDUAL_BROKER:
        accountData.maxActiveListings = AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_ACTIVE_LISTINGS;
        accountData.maxCustomers = AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_CUSTOMERS;
        accountData.currentActiveListings = 0;
        accountData.currentCustomers = 0;
        break;

      case AccountService.ACCOUNT_TYPES.CORPORATE_COMPANY:
        if (accountData.isCompanyOwner) {
          // Company owner settings
          accountData.maxEmployees = 50; // Default, can be upgraded
          accountData.currentEmployees = 0;
          accountData.maxListingsPerEmployee = AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_LISTINGS_PER_EMPLOYEE;
          accountData.maxCustomersPerEmployee = AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_CUSTOMERS_PER_EMPLOYEE;
        } else {
          // Employee settings
          accountData.maxActiveListings = AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_LISTINGS_PER_EMPLOYEE;
          accountData.maxCustomers = AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_CUSTOMERS_PER_EMPLOYEE;
          accountData.currentActiveListings = 0;
          accountData.currentCustomers = 0;
        }
        break;

      case AccountService.ACCOUNT_TYPES.CUSTOMER:
        // Customers don't need listing/customer limits
        accountData.maxActiveListings = 0;
        accountData.maxCustomers = 0;
        break;
    }

    const [newUser] = await db.insert(users).values(accountData).returning();
    return newUser;
  }

  /**
   * Check if user can create a new property listing
   */
  async canCreateListing(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      return { canCreate: false, reason: "User not found" };
    }

    const userData = user[0];

    // Platform admins can always create
    if (userData.accountType === AccountService.ACCOUNT_TYPES.PLATFORM_ADMIN) {
      return { canCreate: true };
    }

    // Customers cannot create listings
    if (userData.accountType === AccountService.ACCOUNT_TYPES.CUSTOMER) {
      return { canCreate: false, reason: "Customers cannot create property listings" };
    }

    // Check current active listings count
    const [currentCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          eq(properties.ownerId, userId),
          eq(properties.status, 'active')
        )
      );

    const currentActiveListings = currentCount.count;

    // Individual brokers: max 30 active listings
    if (userData.accountType === AccountService.ACCOUNT_TYPES.INDIVIDUAL_BROKER) {
      if (currentActiveListings >= AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_ACTIVE_LISTINGS) {
        return { 
          canCreate: false, 
          reason: `Individual brokers can have maximum ${AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_ACTIVE_LISTINGS} active listings. You currently have ${currentActiveListings}.`
        };
      }
    }

    // Corporate employees: max 100 active listings
    if (userData.accountType === AccountService.ACCOUNT_TYPES.CORPORATE_COMPANY && !userData.isCompanyOwner) {
      if (currentActiveListings >= AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_LISTINGS_PER_EMPLOYEE) {
        return { 
          canCreate: false, 
          reason: `Corporate employees can have maximum ${AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_LISTINGS_PER_EMPLOYEE} active listings. You currently have ${currentActiveListings}.`
        };
      }
    }

    return { canCreate: true };
  }

  /**
   * Check if user can add a new customer/lead
   */
  async canAddCustomer(userId: string): Promise<{ canAdd: boolean; reason?: string }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      return { canAdd: false, reason: "User not found" };
    }

    const userData = user[0];

    // Platform admins can always add
    if (userData.accountType === AccountService.ACCOUNT_TYPES.PLATFORM_ADMIN) {
      return { canAdd: true };
    }

    // Customers cannot add other customers
    if (userData.accountType === AccountService.ACCOUNT_TYPES.CUSTOMER) {
      return { canAdd: false, reason: "Customers cannot add other customers" };
    }

    // Check current customer count
    const [currentCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.ownerId, userId));

    const currentCustomers = currentCount.count;

    // Individual brokers: max 100 customers
    if (userData.accountType === AccountService.ACCOUNT_TYPES.INDIVIDUAL_BROKER) {
      if (currentCustomers >= AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_CUSTOMERS) {
        return { 
          canAdd: false, 
          reason: `Individual brokers can have maximum ${AccountService.INDIVIDUAL_BROKER_LIMITS.MAX_CUSTOMERS} customers. You currently have ${currentCustomers}.`
        };
      }
    }

    // Corporate employees: max 500 customers
    if (userData.accountType === AccountService.ACCOUNT_TYPES.CORPORATE_COMPANY && !userData.isCompanyOwner) {
      if (currentCustomers >= AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_CUSTOMERS_PER_EMPLOYEE) {
        return { 
          canAdd: false, 
          reason: `Corporate employees can have maximum ${AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_CUSTOMERS_PER_EMPLOYEE} customers. You currently have ${currentCustomers}.`
        };
      }
    }

    return { canAdd: true };
  }

  /**
   * Get account statistics and limits
   */
  async getAccountStats(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error("User not found");
    }

    const userData = user[0];

    // Get current counts
    const [listingsCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          eq(properties.ownerId, userId),
          eq(properties.status, 'active')
        )
      );

    const [customersCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.ownerId, userId));

    const [inquiriesCount] = await db
      .select({ count: count() })
      .from(propertyInquiries)
      .where(eq(propertyInquiries.respondedBy, userId));

    return {
      accountType: userData.accountType,
      isCompanyOwner: userData.isCompanyOwner,
      companyName: userData.companyName,
      
      // Current usage
      currentActiveListings: listingsCount.count,
      currentCustomers: customersCount.count,
      totalInquiries: inquiriesCount.count,
      
      // Limits
      maxActiveListings: userData.maxActiveListings || 0,
      maxCustomers: userData.maxCustomers || 0,
      
      // Usage percentages
      listingsUsagePercent: userData.maxActiveListings ? 
        Math.round((listingsCount.count / userData.maxActiveListings) * 100) : 0,
      customersUsagePercent: userData.maxCustomers ? 
        Math.round((customersCount.count / userData.maxCustomers) * 100) : 0,
      
      // Account status
      isActive: userData.isActive,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionTier: userData.subscriptionTier,
    };
  }

  /**
   * Add employee to corporate company
   */
  async addEmployeeToCompany(companyOwnerId: string, employeeData: InsertUser): Promise<User> {
    const companyOwner = await db.select().from(users).where(eq(users.id, companyOwnerId)).limit(1);
    if (!companyOwner.length || !companyOwner[0].isCompanyOwner) {
      throw new Error("Only company owners can add employees");
    }

    const company = companyOwner[0];

    // Check if company can add more employees
    if ((company.currentEmployees || 0) >= (company.maxEmployees || 0)) {
      throw new Error(`Company has reached maximum employee limit of ${company.maxEmployees}`);
    }

    // Set employee data
    const newEmployeeData = {
      ...employeeData,
      accountType: AccountService.ACCOUNT_TYPES.CORPORATE_COMPANY,
      parentCompanyId: companyOwnerId,
      companyName: company.companyName,
      isCompanyOwner: false,
      tenantId: company.tenantId, // Same tenant as company
      maxActiveListings: AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_LISTINGS_PER_EMPLOYEE,
      maxCustomers: AccountService.CORPORATE_EMPLOYEE_LIMITS.MAX_CUSTOMERS_PER_EMPLOYEE,
      currentActiveListings: 0,
      currentCustomers: 0,
    };

    // Create employee
    const [newEmployee] = await db.insert(users).values(newEmployeeData).returning();

    // Update company employee count
    await db
      .update(users)
      .set({ 
        currentEmployees: sql`${users.currentEmployees} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, companyOwnerId));

    return newEmployee;
  }

  /**
   * Get company employees (for company owners)
   */
  async getCompanyEmployees(companyOwnerId: string): Promise<User[]> {
    const companyOwner = await db.select().from(users).where(eq(users.id, companyOwnerId)).limit(1);
    if (!companyOwner.length || !companyOwner[0].isCompanyOwner) {
      throw new Error("Only company owners can view employees");
    }

    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.parentCompanyId, companyOwnerId),
          eq(users.isActive, true)
        )
      );
  }

  /**
   * Get publicly visible properties for customers
   */
  async getPublicProperties(filters?: {
    city?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
  }) {
    let base = db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        address: properties.address,
        city: properties.city,
        price: properties.price,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareFeet: properties.squareFeet,
        photoUrls: properties.photoUrls,
        features: properties.features,
        isFeatured: properties.isFeatured,
        viewCount: properties.viewCount,
        createdAt: properties.createdAt,
        // Broker information
        brokerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        brokerPhone: users.phone,
        brokerEmail: users.email,
        companyName: users.companyName,
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
    ;

    const conds: any[] = [
      and(eq(properties.status, 'active'), eq(properties.isPubliclyVisible, true))
    ];

    // Apply filters
    if (filters?.city) {
      conds.push(eq(properties.city, filters.city));
    }
    if (filters?.propertyType) {
      conds.push(eq(properties.propertyType, filters.propertyType));
    }
    if (filters?.minPrice) {
      conds.push(sql`${properties.price} >= ${filters.minPrice}`);
    }
    if (filters?.maxPrice) {
      conds.push(sql`${properties.price} <= ${filters.maxPrice}`);
    }
    if (filters?.bedrooms) {
      conds.push(eq(properties.bedrooms, filters.bedrooms));
    }

    const query = base.where(and(...conds));
    return await query.orderBy(sql`${properties.isFeatured} DESC, ${properties.createdAt} DESC`);
  }

  /**
   * Create property inquiry from customer
   */
  async createPropertyInquiry(inquiryData: {
    propertyId: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    inquiryType: string;
    message?: string;
    preferredContactMethod?: string;
  }) {
    const [inquiry] = await db.insert(propertyInquiries).values({
      ...inquiryData,
      status: 'new',
    }).returning();

    // Update property inquiry count
    await db
      .update(properties)
      .set({ 
        inquiryCount: sql`${properties.inquiryCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(properties.id, inquiryData.propertyId));

    // Convert inquiry to lead for the property owner
    const property = await db.select().from(properties).where(eq(properties.id, inquiryData.propertyId)).limit(1);
    if (property.length) {
      const propertyData = property[0];
      
      // Check if broker can add more customers
      const canAdd = await this.canAddCustomer(propertyData.ownerId);
      if (canAdd.canAdd) {
        await db.insert(leads).values({
          customerId: inquiryData.customerId,
          firstName: inquiryData.customerName.split(' ')[0] || inquiryData.customerName,
          lastName: inquiryData.customerName.split(' ').slice(1).join(' ') || '',
          email: inquiryData.customerEmail,
          phone: inquiryData.customerPhone,
          leadSource: 'website',
          sourceDetails: `Property inquiry for: ${propertyData.title}`,
          interestType: 'buying',
          status: 'new',
          ownerId: propertyData.ownerId,
          companyId: propertyData.companyId,
          tenantId: propertyData.tenantId,
          createdBy: propertyData.ownerId,
          notes: inquiryData.message,
        });
      }
    }

    return inquiry;
  }
}

export const accountService = new AccountService();
