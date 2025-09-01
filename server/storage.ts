import {
  type User,
  type UserPermissions,
  type InsertUser,
  type UpsertUser,
  type InsertUserPermissions,
  type Lead,
  type InsertLead,
  type Property,
  type InsertProperty,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity,
  type Message,
  type InsertMessage,
  type SaudiRegion,
  type SaudiCity,
  users,
  userPermissions,
  leads,
  properties,
  deals,
  activities,
  messages,
  saudiRegions,
  saudiCities
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, ilike, or, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // User Permissions methods
  getUserPermissions(userId: string): Promise<UserPermissions | undefined>;
  createUserPermissions(permissions: InsertUserPermissions): Promise<UserPermissions>;
  updateUserPermissions(userId: string, permissions: Partial<InsertUserPermissions>): Promise<UserPermissions | undefined>;

  // Multi-tenant Lead methods
  getAllLeads(tenantId?: string): Promise<Lead[]>;
  getLead(id: string, tenantId?: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead, userId: string, tenantId: string): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>, tenantId?: string): Promise<Lead | undefined>;
  deleteLead(id: string, tenantId?: string): Promise<boolean>;
  searchLeads(query: string, tenantId?: string): Promise<Lead[]>;

  // Multi-tenant Property methods
  getAllProperties(tenantId?: string): Promise<Property[]>;
  getProperty(id: string, tenantId?: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty, userId: string, tenantId: string): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>, tenantId?: string): Promise<Property | undefined>;
  deleteProperty(id: string, tenantId?: string): Promise<boolean>;
  searchProperties(query: string, tenantId?: string): Promise<Property[]>;

  // Multi-tenant Deal methods
  getAllDeals(tenantId?: string): Promise<Deal[]>;
  getDeal(id: string, tenantId?: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal, tenantId: string): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>, tenantId?: string): Promise<Deal | undefined>;
  deleteDeal(id: string, tenantId?: string): Promise<boolean>;
  getDealsByStage(stage: string, tenantId?: string): Promise<Deal[]>;

  // Multi-tenant Activity methods
  getActivitiesByLead(leadId: string, tenantId?: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity, tenantId: string): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>, tenantId?: string): Promise<Activity | undefined>;
  deleteActivity(id: string, tenantId?: string): Promise<boolean>;
  getTodaysActivities(tenantId?: string): Promise<Activity[]>;

  // Multi-tenant Message methods
  getMessagesByLead(leadId: string, tenantId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage, tenantId: string): Promise<Message>;
  updateMessageStatus(id: string, status: string, tenantId?: string): Promise<Message | undefined>;
  getAllMessages(tenantId?: string): Promise<Message[]>;

  // Notification methods (basic implementation for now)
  getNotifications(): Promise<any[]>;

  // Saudi Regions methods
  getAllSaudiRegions(): Promise<SaudiRegion[]>;
  seedSaudiRegions(): Promise<SaudiRegion[]>;

  // Saudi Cities methods
  getAllSaudiCities(): Promise<SaudiCity[]>;
  getCitiesByRegion(regionCode: string): Promise<SaudiCity[]>;
  seedSaudiCities(): Promise<SaudiCity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private properties: Map<string, Property>;
  private messages: Map<string, Message>;
  private deals: Map<string, Deal>;
  private activities: Map<string, Activity>;
  private saudiRegions: SaudiRegion[];
  private saudiCities: SaudiCity[];

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.properties = new Map();
    this.deals = new Map();
    this.activities = new Map();
    this.messages = new Map();
    this.saudiRegions = [];
    this.saudiCities = [];

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample Saudi regions
    this.saudiRegions = [
      { nameArabic: "الرياض", nameEnglish: "Riyadh", code: "SA-01" },
      { nameArabic: "مكة المكرمة", nameEnglish: "Makkah", code: "SA-02" },
      { nameArabic: "المدينة المنورة", nameEnglish: "Madinah", code: "SA-03" },
      { nameArabic: "المنطقة الشرقية", nameEnglish: "Eastern Province", code: "SA-04" },
      { nameArabic: "القصيم", nameEnglish: "Al-Qassim", code: "SA-05" }
    ];

    // Add sample Saudi cities
    this.saudiCities = [
      { nameArabic: "الرياض", nameEnglish: "Riyadh", regionCode: "SA-01", isCapital: true, population: 7676655 },
      { nameArabic: "جدة", nameEnglish: "Jeddah", regionCode: "SA-02", isCapital: false, population: 4697000 },
      { nameArabic: "مكة المكرمة", nameEnglish: "Makkah", regionCode: "SA-02", isCapital: true, population: 2042000 },
      { nameArabic: "المدينة المنورة", nameEnglish: "Madinah", regionCode: "SA-03", isCapital: true, population: 1512724 },
      { nameArabic: "الدمام", nameEnglish: "Dammam", regionCode: "SA-04", isCapital: true, population: 1532300 }
    ];

    // Add sample user
    const sampleUser: User = {
      id: "sample-user-1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(sampleUser.id, sampleUser);

    // Add sample leads
    const sampleLeads: Lead[] = [
      {
        id: "lead-1",
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmed@example.com",
        phone: "966501234567",
        city: "الرياض",
        age: 35,
        maritalStatus: "married",
        numberOfDependents: 2,
        leadSource: "website",
        interestType: "buying",
        budgetRange: "500000-1000000",
        status: "new",
        notes: "مهتم بشقة في شمال الرياض",
        ownerId: "sample-user-1",
        createdBy: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "lead-2",
        firstName: "فاطمة",
        lastName: "علي",
        email: "fatima@example.com",
        phone: "966502345678",
        city: "جدة",
        age: 28,
        maritalStatus: "single",
        numberOfDependents: 0,
        leadSource: "referral",
        interestType: "renting",
        budgetRange: "50000-100000",
        status: "qualified",
        notes: "تبحث عن شقة للإيجار في جدة",
        ownerId: "sample-user-1",
        createdBy: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleLeads.forEach(lead => this.leads.set(lead.id, lead));

    // Add sample properties
    const sampleProperties: Property[] = [
      {
        id: "property-1",
        title: "شقة فاخرة في الرياض",
        address: "حي النرجس، الرياض",
        city: "الرياض",
        price: "750000",
        propertyCategory: "residential",
        propertyType: "apartment",
        description: "شقة من 3 غرف نوم مع صالة واسعة",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1200,
        latitude: 24.7136,
        longitude: 46.6753,
        photoUrls: null,
        features: null,
        status: "active",
        ownerId: "sample-user-1",
        createdBy: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleProperties.forEach(property => this.properties.set(property.id, property));

    // Add sample deals
    const sampleDeals: Deal[] = [
      {
        id: "deal-1",
        leadId: "lead-1",
        propertyId: "property-1",
        stage: "qualified",
        dealValue: "750000",
        commission: "37500",
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        actualCloseDate: null,
        notes: "صفقة واعدة مع أحمد محمد",
        ownerId: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "deal-2",
        leadId: "lead-2",
        propertyId: null,
        stage: "lead",
        dealValue: null,
        commission: null,
        expectedCloseDate: null,
        actualCloseDate: null,
        notes: "عميلة جديدة تبحث عن إيجار",
        ownerId: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleDeals.forEach(deal => this.deals.set(deal.id, deal));

    // Add sample activities
    const sampleActivities: Activity[] = [
      {
        id: "activity-1",
        leadId: "lead-1",
        activityType: "call",
        description: "اتصال متابعة مع العميل",
        scheduledDate: new Date(),
        completed: false,
        ownerId: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date()
      }
    ];

    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));

    // Add sample messages
    const sampleMessages: Message[] = [
      {
        id: "message-1",
        leadId: "lead-1",
        messageType: "whatsapp",
        phoneNumber: "966501234567",
        message: "مرحباً أحمد، نود متابعة اهتمامك بالشقة في الرياض",
        status: "sent",
        sentAt: new Date(),
        ownerId: "sample-user-1",
        tenantId: "tenant-1",
        createdAt: new Date()
      }
    ];

    sampleMessages.forEach(message => this.messages.set(message.id, message));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // For now, return undefined since we don't have username field in User type
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }

    const existingUser = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Lead methods
  async getAllLeads(tenantId?: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead, userId: string = "default-user", tenantId: string = "default-tenant"): Promise<Lead> {
    const id = randomUUID();
    const now = new Date();
    const lead: Lead = {
      ...insertLead,
      id,
      phone: insertLead.phone || null,
      city: insertLead.city || null,
      age: insertLead.age || null,
      maritalStatus: insertLead.maritalStatus || null,
      numberOfDependents: insertLead.numberOfDependents || 0,
      leadSource: insertLead.leadSource || null,
      interestType: insertLead.interestType || null,
      budgetRange: insertLead.budgetRange || null,
      status: insertLead.status || "new",
      notes: insertLead.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, leadUpdate: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = {
      ...lead,
      ...leadUpdate,
      updatedAt: new Date()
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  async searchLeads(query: string): Promise<Lead[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.leads.values()).filter(lead =>
      lead.firstName.toLowerCase().includes(searchTerm) ||
      lead.lastName.toLowerCase().includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm) ||
      (lead.phone && lead.phone.includes(searchTerm))
    );
  }

  // Property methods
  async getAllProperties(tenantId?: string): Promise<Property[]> {
    return Array.from(this.properties.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty, userId: string = "default-user", tenantId: string = "default-tenant"): Promise<Property> {
    const id = randomUUID();
    const now = new Date();
    const property: Property = {
      ...insertProperty,
      id,
      description: insertProperty.description || null,
      bedrooms: insertProperty.bedrooms || null,
      bathrooms: insertProperty.bathrooms || null,
      squareFeet: insertProperty.squareFeet || null,
      latitude: insertProperty.latitude || null,
      longitude: insertProperty.longitude || null,
      photoUrls: insertProperty.photoUrls || null,
      features: insertProperty.features || null,
      status: insertProperty.status || "active",
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: string, propertyUpdate: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty: Property = {
      ...property,
      ...propertyUpdate,
      updatedAt: new Date()
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  async searchProperties(query: string): Promise<Property[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.properties.values()).filter(property =>
      property.title.toLowerCase().includes(searchTerm) ||
      property.address.toLowerCase().includes(searchTerm) ||
      property.city.toLowerCase().includes(searchTerm)
    );
  }

  // Deal methods
  async getAllDeals(tenantId?: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal, tenantId: string = "default-tenant"): Promise<Deal> {
    const id = randomUUID();
    const now = new Date();
    const deal: Deal = {
      ...insertDeal,
      id,
      propertyId: insertDeal.propertyId || null,
      stage: insertDeal.stage || "lead",
      dealValue: insertDeal.dealValue || null,
      commission: insertDeal.commission || null,
      expectedCloseDate: insertDeal.expectedCloseDate || null,
      actualCloseDate: insertDeal.actualCloseDate || null,
      notes: insertDeal.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: string, dealUpdate: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;

    const updatedDeal: Deal = {
      ...deal,
      ...dealUpdate,
      updatedAt: new Date()
    };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.deals.delete(id);
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.stage === stage);
  }

  // Activity methods
  async getActivitiesByLead(leadId: string, tenantId?: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(insertActivity: InsertActivity, tenantId: string = "default-tenant"): Promise<Activity> {
    const id = randomUUID();
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      id,
      description: insertActivity.description || null,
      scheduledDate: insertActivity.scheduledDate || null,
      completed: insertActivity.completed || false,
      createdAt: now
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, activityUpdate: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;

    const updatedActivity: Activity = {
      ...activity,
      ...activityUpdate
    };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }

  async getTodaysActivities(tenantId?: string): Promise<Activity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.activities.values()).filter(activity => {
      if (!activity.scheduledDate) return false;
      const activityDate = new Date(activity.scheduledDate);
      return activityDate >= today && activityDate < tomorrow;
    });
  }

  // Message methods
  async getMessagesByLead(leadId: string, tenantId?: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.leadId === leadId
    ).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage, tenantId: string = "default-tenant"): Promise<Message> {
    const id = randomUUID();
    const now = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      status: insertMessage.status || "pending",
      sentAt: null,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageStatus(id: string, status: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const updatedMessage: Message = {
      ...message,
      status,
      sentAt: status === 'sent' ? new Date() : message.sentAt
    };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getAllMessages(tenantId?: string): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Notification methods (basic implementation)
  async getNotifications(): Promise<any[]> {
    // For now, return empty array - this will be enhanced later
    return [];
  }

  // Saudi Regions methods
  async getAllSaudiRegions(): Promise<SaudiRegion[]> {
    return this.saudiRegions;
  }

  async seedSaudiRegions(): Promise<SaudiRegion[]> {
    return this.saudiRegions;
  }

  // Saudi Cities methods
  async getAllSaudiCities(): Promise<SaudiCity[]> {
    return this.saudiCities;
  }

  async getCitiesByRegion(regionCode: string): Promise<SaudiCity[]> {
    return this.saudiCities.filter(city => city.regionCode === regionCode);
  }

  async seedSaudiCities(): Promise<SaudiCity[]> {
    return this.saudiCities;
  }

  // User Permissions methods
  async getUserPermissions(userId: string): Promise<UserPermissions | undefined> {
    // Return undefined for MemStorage - basic implementation
    return undefined;
  }

  async createUserPermissions(permissions: InsertUserPermissions): Promise<UserPermissions> {
    // Basic implementation for MemStorage
    const userPermissions: UserPermissions = {
      id: randomUUID(),
      userId: permissions.userId,
      canManageCompanySettings: permissions.canManageCompanySettings || false,
      canManageBilling: permissions.canManageBilling || false,
      canManageUsers: permissions.canManageUsers || false,
      canViewAllLeads: permissions.canViewAllLeads || false,
      canEditAllLeads: permissions.canEditAllLeads || false,
      canDeleteLeads: permissions.canDeleteLeads || false,
      canViewAllProperties: permissions.canViewAllProperties || false,
      canEditAllProperties: permissions.canEditAllProperties || false,
      canDeleteProperties: permissions.canDeleteProperties || false,
      canManageCampaigns: permissions.canManageCampaigns || false,
      canManageIntegrations: permissions.canManageIntegrations || false,
      canManageApiKeys: permissions.canManageApiKeys || false,
      canViewReports: permissions.canViewReports || false,
      canManageSystemSettings: permissions.canManageSystemSettings || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return userPermissions;
  }

  async updateUserPermissions(userId: string, permissions: Partial<InsertUserPermissions>): Promise<UserPermissions | undefined> {
    // Basic implementation for MemStorage
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // For now, return undefined since we don't have username field in User type
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert");
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          userLevel: userData.userLevel,
          accountOwnerId: userData.accountOwnerId,
          companyName: userData.companyName,
          isActive: userData.isActive,
          subscriptionStatus: userData.subscriptionStatus,
          subscriptionTier: userData.subscriptionTier,
          maxSeats: userData.maxSeats,
          usedSeats: userData.usedSeats,
          tenantId: userData.tenantId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User Permissions methods
  async getUserPermissions(userId: string): Promise<UserPermissions | undefined> {
    const [permissions] = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
    return permissions || undefined;
  }

  async createUserPermissions(insertPermissions: InsertUserPermissions): Promise<UserPermissions> {
    const [permissions] = await db
      .insert(userPermissions)
      .values(insertPermissions)
      .returning();
    return permissions;
  }

  async updateUserPermissions(userId: string, permissionsUpdate: Partial<InsertUserPermissions>): Promise<UserPermissions | undefined> {
    const [permissions] = await db
      .update(userPermissions)
      .set({ ...permissionsUpdate, updatedAt: new Date() })
      .where(eq(userPermissions.userId, userId))
      .returning();
    return permissions || undefined;
  }

  // Multi-tenant Lead methods
  async getAllLeads(tenantId?: string): Promise<Lead[]> {
    if (tenantId) {
      return await db.select().from(leads).where(eq(leads.tenantId, tenantId)).orderBy(leads.createdAt);
    }
    // Platform admin can see all leads
    return await db.select().from(leads).orderBy(leads.createdAt);
  }

  async getLead(id: string, tenantId?: string): Promise<Lead | undefined> {
    let query = db.select().from(leads).where(eq(leads.id, id));
    if (tenantId) {
      query = query.where(eq(leads.tenantId, tenantId));
    }
    const [lead] = await query;
    return lead || undefined;
  }

  async createLead(insertLead: InsertLead, userId: string, tenantId: string): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        tenantId,
        createdBy: userId,
      })
      .returning();
    return lead;
  }

  async updateLead(id: string, leadUpdate: Partial<InsertLead>, tenantId?: string): Promise<Lead | undefined> {
    let query = db
      .update(leads)
      .set({ ...leadUpdate, updatedAt: new Date() })
      .where(eq(leads.id, id));

    if (tenantId) {
      query = query.where(eq(leads.tenantId, tenantId));
    }

    const [lead] = await query.returning();
    return lead || undefined;
  }

  async deleteLead(id: string, tenantId?: string): Promise<boolean> {
    let query = db.delete(leads).where(eq(leads.id, id));

    if (tenantId) {
      query = query.where(eq(leads.tenantId, tenantId));
    }

    const result = await query;
    return (result.rowCount ?? 0) > 0;
  }

  async searchLeads(query: string, tenantId?: string): Promise<Lead[]> {
    let whereCondition = or(
      ilike(leads.firstName, `%${query}%`),
      ilike(leads.lastName, `%${query}%`),
      ilike(leads.email, `%${query}%`),
      ilike(leads.phone, `%${query}%`)
    );

    if (tenantId) {
      whereCondition = and(whereCondition, eq(leads.tenantId, tenantId));
    }

    return await db.select().from(leads).where(whereCondition);
  }

  // Multi-tenant Property methods
  async getAllProperties(tenantId?: string): Promise<Property[]> {
    if (tenantId) {
      return await db.select().from(properties).where(eq(properties.tenantId, tenantId)).orderBy(properties.createdAt);
    }
    return await db.select().from(properties).orderBy(properties.createdAt);
  }

  async getProperty(id: string, tenantId?: string): Promise<Property | undefined> {
    let query = db.select().from(properties).where(eq(properties.id, id));
    if (tenantId) {
      query = query.where(eq(properties.tenantId, tenantId));
    }
    const [property] = await query;
    return property || undefined;
  }

  async createProperty(insertProperty: InsertProperty, userId: string, tenantId: string): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values({
        ...insertProperty,
        tenantId,
        createdBy: userId,
      })
      .returning();
    return property;
  }

  async updateProperty(id: string, propertyUpdate: Partial<InsertProperty>, tenantId?: string): Promise<Property | undefined> {
    let query = db
      .update(properties)
      .set({ ...propertyUpdate, updatedAt: new Date() })
      .where(eq(properties.id, id));

    if (tenantId) {
      query = query.where(eq(properties.tenantId, tenantId));
    }

    const [property] = await query.returning();
    return property || undefined;
  }

  async deleteProperty(id: string, tenantId?: string): Promise<boolean> {
    let query = db.delete(properties).where(eq(properties.id, id));

    if (tenantId) {
      query = query.where(eq(properties.tenantId, tenantId));
    }

    const result = await query;
    return (result.rowCount ?? 0) > 0;
  }

  async searchProperties(query: string, tenantId?: string): Promise<Property[]> {
    let whereCondition = or(
      ilike(properties.title, `%${query}%`),
      ilike(properties.address, `%${query}%`),
      ilike(properties.city, `%${query}%`)
    );

    if (tenantId) {
      whereCondition = and(whereCondition, eq(properties.tenantId, tenantId));
    }

    return await db.select().from(properties).where(whereCondition);
  }

  // Multi-tenant Deal methods
  async getAllDeals(tenantId?: string): Promise<Deal[]> {
    if (tenantId) {
      return await db.select().from(deals).where(eq(deals.tenantId, tenantId)).orderBy(deals.createdAt);
    }
    return await db.select().from(deals).orderBy(deals.createdAt);
  }

  async getDeal(id: string, tenantId?: string): Promise<Deal | undefined> {
    let query = db.select().from(deals).where(eq(deals.id, id));
    if (tenantId) {
      query = query.where(eq(deals.tenantId, tenantId));
    }
    const [deal] = await query;
    return deal || undefined;
  }

  async createDeal(insertDeal: InsertDeal, tenantId: string): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values({
        ...insertDeal,
        tenantId,
      })
      .returning();
    return deal;
  }

  async updateDeal(id: string, dealUpdate: Partial<InsertDeal>, tenantId?: string): Promise<Deal | undefined> {
    let query = db
      .update(deals)
      .set({ ...dealUpdate, updatedAt: new Date() })
      .where(eq(deals.id, id));

    if (tenantId) {
      query = query.where(eq(deals.tenantId, tenantId));
    }

    const [deal] = await query.returning();
    return deal || undefined;
  }

  async deleteDeal(id: string, tenantId?: string): Promise<boolean> {
    let query = db.delete(deals).where(eq(deals.id, id));

    if (tenantId) {
      query = query.where(eq(deals.tenantId, tenantId));
    }

    const result = await query;
    return (result.rowCount ?? 0) > 0;
  }

  async getDealsByStage(stage: string, tenantId?: string): Promise<Deal[]> {
    if (tenantId) {
      return await db.select().from(deals).where(and(eq(deals.stage, stage), eq(deals.tenantId, tenantId)));
    }
    return await db.select().from(deals).where(eq(deals.stage, stage));
  }

  // Multi-tenant Activity methods
  async getActivitiesByLead(leadId: string, tenantId?: string): Promise<Activity[]> {
    let query = db.select().from(activities).where(eq(activities.leadId, leadId));
    if (tenantId) {
      query = query.where(eq(activities.tenantId, tenantId));
    }
    return await query.orderBy(activities.createdAt);
  }

  async createActivity(insertActivity: InsertActivity, tenantId: string): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        tenantId,
      })
      .returning();
    return activity;
  }

  async updateActivity(id: string, activityUpdate: Partial<InsertActivity>, tenantId?: string): Promise<Activity | undefined> {
    let query = db
      .update(activities)
      .set(activityUpdate)
      .where(eq(activities.id, id));

    if (tenantId) {
      query = query.where(eq(activities.tenantId, tenantId));
    }

    const [activity] = await query.returning();
    return activity || undefined;
  }

  async deleteActivity(id: string, tenantId?: string): Promise<boolean> {
    let query = db.delete(activities).where(eq(activities.id, id));

    if (tenantId) {
      query = query.where(eq(activities.tenantId, tenantId));
    }

    const result = await query;
    return (result.rowCount ?? 0) > 0;
  }

  async getTodaysActivities(tenantId?: string): Promise<Activity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereCondition = and(
      gte(activities.scheduledDate, today),
      lt(activities.scheduledDate, tomorrow)
    );

    if (tenantId) {
      whereCondition = and(whereCondition, eq(activities.tenantId, tenantId));
    }

    return await db.select().from(activities).where(whereCondition);
  }

  // Multi-tenant Message methods
  async getMessagesByLead(leadId: string, tenantId?: string): Promise<Message[]> {
    let query = db.select().from(messages).where(eq(messages.leadId, leadId));
    if (tenantId) {
      query = query.where(eq(messages.tenantId, tenantId));
    }
    return await query.orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage, tenantId: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        tenantId,
      })
      .returning();
    return message;
  }

  async updateMessageStatus(id: string, status: string, tenantId?: string): Promise<Message | undefined> {
    let query = db
      .update(messages)
      .set({
        status,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(messages.id, id));

    if (tenantId) {
      query = query.where(eq(messages.tenantId, tenantId));
    }

    const [message] = await query.returning();
    return message || undefined;
  }

  async getAllMessages(tenantId?: string): Promise<Message[]> {
    if (tenantId) {
      return await db.select().from(messages).where(eq(messages.tenantId, tenantId)).orderBy(messages.createdAt);
    }
    return await db.select().from(messages).orderBy(messages.createdAt);
  }

  // Notification methods (basic implementation)
  async getNotifications(): Promise<any[]> {
    // For now, return empty array - this will be enhanced later
    return [];
  }

  // Saudi Regions methods
  async getAllSaudiRegions(): Promise<SaudiRegion[]> {
    return await db.select().from(saudiRegions).orderBy(saudiRegions.nameArabic);
  }

  async seedSaudiRegions(): Promise<SaudiRegion[]> {
    // Check if regions already exist
    const existingRegions = await db.select().from(saudiRegions);

    if (existingRegions.length > 0) {
      return existingRegions; // Return existing regions if already seeded
    }

    // Saudi Arabia's 13 official administrative regions
    const regions = [
      {
        nameArabic: "الرياض",
        nameEnglish: "Riyadh",
        code: "SA-01"
      },
      {
        nameArabic: "مكة المكرمة",
        nameEnglish: "Makkah",
        code: "SA-02"
      },
      {
        nameArabic: "المدينة المنورة",
        nameEnglish: "Madinah",
        code: "SA-03"
      },
      {
        nameArabic: "القصيم",
        nameEnglish: "Al-Qassim",
        code: "SA-05"
      },
      {
        nameArabic: "المنطقة الشرقية",
        nameEnglish: "Eastern Province",
        code: "SA-04"
      },
      {
        nameArabic: "عسير",
        nameEnglish: "Asir",
        code: "SA-11"
      },
      {
        nameArabic: "تبوك",
        nameEnglish: "Tabuk",
        code: "SA-07"
      },
      {
        nameArabic: "حائل",
        nameEnglish: "Hail",
        code: "SA-06"
      },
      {
        nameArabic: "الحدود الشمالية",
        nameEnglish: "Northern Borders",
        code: "SA-08"
      },
      {
        nameArabic: "جازان",
        nameEnglish: "Jazan",
        code: "SA-09"
      },
      {
        nameArabic: "نجران",
        nameEnglish: "Najran",
        code: "SA-10"
      },
      {
        nameArabic: "الباحة",
        nameEnglish: "Al Bahah",
        code: "SA-12"
      },
      {
        nameArabic: "الجوف",
        nameEnglish: "Al Jawf",
        code: "SA-13"
      }
    ];

    // Insert all regions
    const insertedRegions = await db.insert(saudiRegions)
      .values(regions)
      .returning();

    return insertedRegions;
  }

  // Saudi Cities methods
  async getAllSaudiCities(): Promise<SaudiCity[]> {
    return await db.select().from(saudiCities).orderBy(saudiCities.nameArabic);
  }

  async getCitiesByRegion(regionCode: string): Promise<SaudiCity[]> {
    return await db.select().from(saudiCities)
      .where(eq(saudiCities.regionCode, regionCode))
      .orderBy(saudiCities.nameArabic);
  }

  async seedSaudiCities(): Promise<SaudiCity[]> {
    // Check if cities already exist
    const existingCities = await db.select().from(saudiCities);

    if (existingCities.length > 0) {
      return existingCities; // Return existing cities if already seeded
    }

    // Major Saudi cities with their regional codes
    const cities = [
      // Riyadh Region (SA-01)
      { nameArabic: "الرياض", nameEnglish: "Riyadh", regionCode: "SA-01", isCapital: true, population: 7676655 },
      { nameArabic: "الدرعية", nameEnglish: "Diriyah", regionCode: "SA-01", isCapital: false, population: 75000 },
      { nameArabic: "الخرج", nameEnglish: "Al-Kharj", regionCode: "SA-01", isCapital: false, population: 425300 },
      { nameArabic: "المجمعة", nameEnglish: "Al-Majmaah", regionCode: "SA-01", isCapital: false, population: 120000 },
      { nameArabic: "الزلفي", nameEnglish: "Az-Zulfi", regionCode: "SA-01", isCapital: false, population: 65000 },

      // Makkah Region (SA-02)
      { nameArabic: "مكة المكرمة", nameEnglish: "Makkah", regionCode: "SA-02", isCapital: true, population: 2385509 },
      { nameArabic: "جدة", nameEnglish: "Jeddah", regionCode: "SA-02", isCapital: false, population: 4697000 },
      { nameArabic: "الطائف", nameEnglish: "Taif", regionCode: "SA-02", isCapital: false, population: 688693 },
      { nameArabic: "المدينة الاقتصادية الملك عبد الله", nameEnglish: "KAEC", regionCode: "SA-02", isCapital: false, population: 50000 },
      { nameArabic: "رابغ", nameEnglish: "Rabigh", regionCode: "SA-02", isCapital: false, population: 180000 },

      // Madinah Region (SA-03)
      { nameArabic: "المدينة المنورة", nameEnglish: "Madinah", regionCode: "SA-03", isCapital: true, population: 1488782 },
      { nameArabic: "ينبع", nameEnglish: "Yanbu", regionCode: "SA-03", isCapital: false, population: 267000 },
      { nameArabic: "العلا", nameEnglish: "AlUla", regionCode: "SA-03", isCapital: false, population: 24500 },
      { nameArabic: "بدر", nameEnglish: "Badr", regionCode: "SA-03", isCapital: false, population: 60000 },

      // Eastern Province (SA-04)
      { nameArabic: "الدمام", nameEnglish: "Dammam", regionCode: "SA-04", isCapital: true, population: 1532300 },
      { nameArabic: "الخبر", nameEnglish: "Khobar", regionCode: "SA-04", isCapital: false, population: 658550 },
      { nameArabic: "الظهران", nameEnglish: "Dhahran", regionCode: "SA-04", isCapital: false, population: 143936 },
      { nameArabic: "الجبيل", nameEnglish: "Jubail", regionCode: "SA-04", isCapital: false, population: 684531 },
      { nameArabic: "الأحساء", nameEnglish: "Al-Ahsa", regionCode: "SA-04", isCapital: false, population: 1220655 },
      { nameArabic: "القطيف", nameEnglish: "Qatif", regionCode: "SA-04", isCapital: false, population: 524182 },
      { nameArabic: "رأس تنورة", nameEnglish: "Ras Tanura", regionCode: "SA-04", isCapital: false, population: 73933 },

      // Al-Qassim Region (SA-05)
      { nameArabic: "بريدة", nameEnglish: "Buraydah", regionCode: "SA-05", isCapital: true, population: 692986 },
      { nameArabic: "عنيزة", nameEnglish: "Unayzah", regionCode: "SA-05", isCapital: false, population: 201928 },
      { nameArabic: "الرس", nameEnglish: "Ar-Rass", regionCode: "SA-05", isCapital: false, population: 146845 },
      { nameArabic: "المذنب", nameEnglish: "Al-Mithnab", regionCode: "SA-05", isCapital: false, population: 52000 },

      // Hail Region (SA-06)
      { nameArabic: "حائل", nameEnglish: "Hail", regionCode: "SA-06", isCapital: true, population: 605930 },
      { nameArabic: "سكاكا", nameEnglish: "Sakakah", regionCode: "SA-13", isCapital: true, population: 128332 },

      // Tabuk Region (SA-07)
      { nameArabic: "تبوك", nameEnglish: "Tabuk", regionCode: "SA-07", isCapital: true, population: 594350 },
      { nameArabic: "الوجه", nameEnglish: "Al-Wajh", regionCode: "SA-07", isCapital: false, population: 60000 },
      { nameArabic: "ضباء", nameEnglish: "Duba", regionCode: "SA-07", isCapital: false, population: 65000 },
      { nameArabic: "نيوم", nameEnglish: "NEOM", regionCode: "SA-07", isCapital: false, population: 1000 },

      // Northern Borders Region (SA-08)
      { nameArabic: "عرعر", nameEnglish: "Arar", regionCode: "SA-08", isCapital: true, population: 217571 },
      { nameArabic: "رفحاء", nameEnglish: "Rafha", regionCode: "SA-08", isCapital: false, population: 92966 },
      { nameArabic: "طريف", nameEnglish: "Turaif", regionCode: "SA-08", isCapital: false, population: 52000 },

      // Jazan Region (SA-09)
      { nameArabic: "جازان", nameEnglish: "Jazan", regionCode: "SA-09", isCapital: true, population: 173919 },
      { nameArabic: "صبيا", nameEnglish: "Sabya", regionCode: "SA-09", isCapital: false, population: 125000 },
      { nameArabic: "أبو عريش", nameEnglish: "Abu Arish", regionCode: "SA-09", isCapital: false, population: 95000 },

      // Najran Region (SA-10)
      { nameArabic: "نجران", nameEnglish: "Najran", regionCode: "SA-10", isCapital: true, population: 505652 },
      { nameArabic: "شرورة", nameEnglish: "Sharurah", regionCode: "SA-10", isCapital: false, population: 100000 },

      // Asir Region (SA-11)
      { nameArabic: "أبها", nameEnglish: "Abha", regionCode: "SA-11", isCapital: true, population: 1093705 },
      { nameArabic: "خميس مشيط", nameEnglish: "Khamis Mushait", regionCode: "SA-11", isCapital: false, population: 743550 },
      { nameArabic: "النماص", nameEnglish: "An-Namas", regionCode: "SA-11", isCapital: false, population: 45000 },
      { nameArabic: "بيشة", nameEnglish: "Bisha", regionCode: "SA-11", isCapital: false, population: 205346 },

      // Al Bahah Region (SA-12)
      { nameArabic: "الباحة", nameEnglish: "Al Bahah", regionCode: "SA-12", isCapital: true, population: 411888 },
      { nameArabic: "بلجرشي", nameEnglish: "Baljurashi", regionCode: "SA-12", isCapital: false, population: 55000 },

      // Al Jawf Region (SA-13)
      { nameArabic: "دومة الجندل", nameEnglish: "Dumat al-Jandal", regionCode: "SA-13", isCapital: false, population: 50000 },
      { nameArabic: "القريات", nameEnglish: "Al-Qurayyat", regionCode: "SA-13", isCapital: false, population: 147550 }
    ];

    // Insert all cities
    const insertedCities = await db.insert(saudiCities)
      .values(cities)
      .returning();

    return insertedCities;
  }
}

// Cache layer for database operations
class CachedDatabaseStorage implements IStorage {
  private dbStorage: DatabaseStorage;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.dbStorage = new DatabaseStorage();
    this.cache = new Map();
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${JSON.stringify(args)}`;
  }

  private isExpired(item: { timestamp: number; ttl: number }): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private async getFromCacheOrDb<T>(
    cacheKey: string,
    dbOperation: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    try {
      const data = await dbOperation();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
      return data;
    } catch (error) {
      // If database fails, return cached data even if expired
      if (cached) {
        console.log(`⚠️ Database error, using expired cache for ${cacheKey}`);
        return cached.data;
      }
      throw error;
    }
  }

  private invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const cacheKey = this.getCacheKey('getUser', id);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getUser(id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const cacheKey = this.getCacheKey('getUserByUsername', username);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getUserByUsername(username));
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.dbStorage.createUser(user);
    this.invalidateCache('getUser');
    return result;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await this.dbStorage.upsertUser(user);
    this.invalidateCache('getUser');
    return result;
  }

  // User Permissions methods
  async getUserPermissions(userId: string): Promise<UserPermissions | undefined> {
    const cacheKey = this.getCacheKey('getUserPermissions', userId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getUserPermissions(userId));
  }

  async createUserPermissions(permissions: InsertUserPermissions): Promise<UserPermissions> {
    const result = await this.dbStorage.createUserPermissions(permissions);
    this.invalidateCache('getUserPermissions');
    return result;
  }

  async updateUserPermissions(userId: string, permissions: Partial<InsertUserPermissions>): Promise<UserPermissions | undefined> {
    const result = await this.dbStorage.updateUserPermissions(userId, permissions);
    this.invalidateCache('getUserPermissions');
    return result;
  }

  // Lead methods with cache
  async getAllLeads(tenantId?: string): Promise<Lead[]> {
    const cacheKey = this.getCacheKey('getAllLeads', tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllLeads(tenantId), 2 * 60 * 1000); // 2 min cache
  }

  async getLead(id: string, tenantId?: string): Promise<Lead | undefined> {
    const cacheKey = this.getCacheKey('getLead', id, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getLead(id, tenantId));
  }

  async createLead(lead: InsertLead, userId: string, tenantId: string): Promise<Lead> {
    const result = await this.dbStorage.createLead(lead, userId, tenantId);
    this.invalidateCache('getAllLeads');
    this.invalidateCache('getLead');
    return result;
  }

  async updateLead(id: string, lead: Partial<InsertLead>, tenantId?: string): Promise<Lead | undefined> {
    const result = await this.dbStorage.updateLead(id, lead, tenantId);
    this.invalidateCache('getAllLeads');
    this.invalidateCache('getLead');
    return result;
  }

  async deleteLead(id: string, tenantId?: string): Promise<boolean> {
    const result = await this.dbStorage.deleteLead(id, tenantId);
    this.invalidateCache('getAllLeads');
    this.invalidateCache('getLead');
    return result;
  }

  async searchLeads(query: string, tenantId?: string): Promise<Lead[]> {
    // Don't cache search results as they're dynamic
    return this.dbStorage.searchLeads(query, tenantId);
  }

  // Property methods with cache
  async getAllProperties(tenantId?: string): Promise<Property[]> {
    const cacheKey = this.getCacheKey('getAllProperties', tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllProperties(tenantId), 5 * 60 * 1000); // 5 min cache
  }

  async getProperty(id: string, tenantId?: string): Promise<Property | undefined> {
    const cacheKey = this.getCacheKey('getProperty', id, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getProperty(id, tenantId));
  }

  async createProperty(property: InsertProperty, userId: string, tenantId: string): Promise<Property> {
    const result = await this.dbStorage.createProperty(property, userId, tenantId);
    this.invalidateCache('getAllProperties');
    this.invalidateCache('getProperty');
    return result;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>, tenantId?: string): Promise<Property | undefined> {
    const result = await this.dbStorage.updateProperty(id, property, tenantId);
    this.invalidateCache('getAllProperties');
    this.invalidateCache('getProperty');
    return result;
  }

  async deleteProperty(id: string, tenantId?: string): Promise<boolean> {
    const result = await this.dbStorage.deleteProperty(id, tenantId);
    this.invalidateCache('getAllProperties');
    this.invalidateCache('getProperty');
    return result;
  }

  async searchProperties(query: string, tenantId?: string): Promise<Property[]> {
    return this.dbStorage.searchProperties(query, tenantId);
  }

  // Deal methods with cache
  async getAllDeals(tenantId?: string): Promise<Deal[]> {
    const cacheKey = this.getCacheKey('getAllDeals', tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllDeals(tenantId), 2 * 60 * 1000);
  }

  async getDeal(id: string, tenantId?: string): Promise<Deal | undefined> {
    const cacheKey = this.getCacheKey('getDeal', id, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getDeal(id, tenantId));
  }

  async createDeal(deal: InsertDeal, tenantId: string): Promise<Deal> {
    const result = await this.dbStorage.createDeal(deal, tenantId);
    this.invalidateCache('getAllDeals');
    this.invalidateCache('getDeal');
    return result;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>, tenantId?: string): Promise<Deal | undefined> {
    const result = await this.dbStorage.updateDeal(id, deal, tenantId);
    this.invalidateCache('getAllDeals');
    this.invalidateCache('getDeal');
    return result;
  }

  async deleteDeal(id: string, tenantId?: string): Promise<boolean> {
    const result = await this.dbStorage.deleteDeal(id, tenantId);
    this.invalidateCache('getAllDeals');
    this.invalidateCache('getDeal');
    return result;
  }

  async getDealsByStage(stage: string, tenantId?: string): Promise<Deal[]> {
    const cacheKey = this.getCacheKey('getDealsByStage', stage, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getDealsByStage(stage, tenantId));
  }

  // Activity methods with cache
  async getActivitiesByLead(leadId: string, tenantId?: string): Promise<Activity[]> {
    const cacheKey = this.getCacheKey('getActivitiesByLead', leadId, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getActivitiesByLead(leadId, tenantId));
  }

  async createActivity(activity: InsertActivity, tenantId: string): Promise<Activity> {
    const result = await this.dbStorage.createActivity(activity, tenantId);
    this.invalidateCache('getActivitiesByLead');
    this.invalidateCache('getTodaysActivities');
    return result;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>, tenantId?: string): Promise<Activity | undefined> {
    const result = await this.dbStorage.updateActivity(id, activity, tenantId);
    this.invalidateCache('getActivitiesByLead');
    this.invalidateCache('getTodaysActivities');
    return result;
  }

  async deleteActivity(id: string, tenantId?: string): Promise<boolean> {
    const result = await this.dbStorage.deleteActivity(id, tenantId);
    this.invalidateCache('getActivitiesByLead');
    this.invalidateCache('getTodaysActivities');
    return result;
  }

  async getTodaysActivities(tenantId?: string): Promise<Activity[]> {
    const cacheKey = this.getCacheKey('getTodaysActivities', tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getTodaysActivities(tenantId), 1 * 60 * 1000); // 1 min cache
  }

  // Message methods with cache
  async getMessagesByLead(leadId: string, tenantId?: string): Promise<Message[]> {
    const cacheKey = this.getCacheKey('getMessagesByLead', leadId, tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getMessagesByLead(leadId, tenantId));
  }

  async createMessage(message: InsertMessage, tenantId: string): Promise<Message> {
    const result = await this.dbStorage.createMessage(message, tenantId);
    this.invalidateCache('getMessagesByLead');
    this.invalidateCache('getAllMessages');
    return result;
  }

  async updateMessageStatus(id: string, status: string, tenantId?: string): Promise<Message | undefined> {
    const result = await this.dbStorage.updateMessageStatus(id, status, tenantId);
    this.invalidateCache('getMessagesByLead');
    this.invalidateCache('getAllMessages');
    return result;
  }

  async getAllMessages(tenantId?: string): Promise<Message[]> {
    const cacheKey = this.getCacheKey('getAllMessages', tenantId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllMessages(tenantId));
  }

  // Notification methods
  async getNotifications(): Promise<any[]> {
    const cacheKey = this.getCacheKey('getNotifications');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getNotifications(), 30 * 1000); // 30 sec cache
  }

  // Saudi Regions methods with longer cache
  async getAllSaudiRegions(): Promise<SaudiRegion[]> {
    const cacheKey = this.getCacheKey('getAllSaudiRegions');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllSaudiRegions(), 60 * 60 * 1000); // 1 hour cache
  }

  async seedSaudiRegions(): Promise<SaudiRegion[]> {
    const result = await this.dbStorage.seedSaudiRegions();
    this.invalidateCache('getAllSaudiRegions');
    return result;
  }

  // Saudi Cities methods with longer cache
  async getAllSaudiCities(): Promise<SaudiCity[]> {
    const cacheKey = this.getCacheKey('getAllSaudiCities');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAllSaudiCities(), 60 * 60 * 1000); // 1 hour cache
  }

  async getCitiesByRegion(regionCode: string): Promise<SaudiCity[]> {
    const cacheKey = this.getCacheKey('getCitiesByRegion', regionCode);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getCitiesByRegion(regionCode), 60 * 60 * 1000);
  }

  async seedSaudiCities(): Promise<SaudiCity[]> {
    const result = await this.dbStorage.seedSaudiCities();
    this.invalidateCache('getAllSaudiCities');
    this.invalidateCache('getCitiesByRegion');
    return result;
  }
}

// Storage factory function
async function createStorage(): Promise<IStorage> {
  const databaseUrl = process.env.DATABASE_URL;

  // Check if we have a real database URL (not placeholder)
  const isRealDatabase = databaseUrl &&
    !databaseUrl.includes("placeholder") &&
    !databaseUrl.includes("localhost:5432/placeholder");

  if (isRealDatabase) {
    try {
      // Use cached database storage with real connection
      const cachedStorage = new CachedDatabaseStorage();
      // Test database connection
      await cachedStorage.getAllSaudiRegions();
      console.log("✅ Real database connection successful - using CachedDatabaseStorage");
      console.log(`📊 Connected to: ${databaseUrl.split('@')[1]?.split('/')[0] || 'database'}`);
      return cachedStorage;
    } catch (error) {
      console.log("❌ Real database connection failed:", error instanceof Error ? error.message : error);
      throw new Error("Database connection required but failed. Please check your DATABASE_URL.");
    }
  } else {
    console.log("⚠️ Using placeholder DATABASE_URL");
    console.log("💡 To use real database, set a valid DATABASE_URL environment variable");
    // For development with placeholder, still try to use cached storage but expect it to fail gracefully
    try {
      return new CachedDatabaseStorage();
    } catch (error) {
      throw new Error("Database connection required. Please provide a valid DATABASE_URL.");
    }
  }
}

// Create storage instance
let storageInstance: IStorage | null = null;

export const getStorage = async (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
};

// For backward compatibility
export const storage = {
  async getUser(id: string) { return (await getStorage()).getUser(id); },
  async getUserByUsername(username: string) { return (await getStorage()).getUserByUsername(username); },
  async createUser(user: InsertUser) { return (await getStorage()).createUser(user); },
  async upsertUser(user: UpsertUser) { return (await getStorage()).upsertUser(user); },
  async getUserPermissions(userId: string) { return (await getStorage()).getUserPermissions(userId); },
  async createUserPermissions(permissions: InsertUserPermissions) { return (await getStorage()).createUserPermissions(permissions); },
  async updateUserPermissions(userId: string, permissions: Partial<InsertUserPermissions>) { return (await getStorage()).updateUserPermissions(userId, permissions); },
  async getAllLeads(tenantId?: string) { return (await getStorage()).getAllLeads(tenantId); },
  async getLead(id: string, tenantId?: string) { return (await getStorage()).getLead(id, tenantId); },
  async createLead(lead: InsertLead, userId: string = "default-user", tenantId: string = "default-tenant") { return (await getStorage()).createLead(lead, userId, tenantId); },
  async updateLead(id: string, lead: Partial<InsertLead>, tenantId?: string) { return (await getStorage()).updateLead(id, lead, tenantId); },
  async deleteLead(id: string, tenantId?: string) { return (await getStorage()).deleteLead(id, tenantId); },
  async searchLeads(query: string, tenantId?: string) { return (await getStorage()).searchLeads(query, tenantId); },
  async getAllProperties(tenantId?: string) { return (await getStorage()).getAllProperties(tenantId); },
  async getProperty(id: string, tenantId?: string) { return (await getStorage()).getProperty(id, tenantId); },
  async createProperty(property: InsertProperty, userId: string = "default-user", tenantId: string = "default-tenant") { return (await getStorage()).createProperty(property, userId, tenantId); },
  async updateProperty(id: string, property: Partial<InsertProperty>, tenantId?: string) { return (await getStorage()).updateProperty(id, property, tenantId); },
  async deleteProperty(id: string, tenantId?: string) { return (await getStorage()).deleteProperty(id, tenantId); },
  async searchProperties(query: string, tenantId?: string) { return (await getStorage()).searchProperties(query, tenantId); },
  async getAllDeals(tenantId?: string) { return (await getStorage()).getAllDeals(tenantId); },
  async getDeal(id: string, tenantId?: string) { return (await getStorage()).getDeal(id, tenantId); },
  async createDeal(deal: InsertDeal, tenantId: string = "default-tenant") { return (await getStorage()).createDeal(deal, tenantId); },
  async updateDeal(id: string, deal: Partial<InsertDeal>, tenantId?: string) { return (await getStorage()).updateDeal(id, deal, tenantId); },
  async deleteDeal(id: string, tenantId?: string) { return (await getStorage()).deleteDeal(id, tenantId); },
  async getDealsByStage(stage: string, tenantId?: string) { return (await getStorage()).getDealsByStage(stage, tenantId); },
  async getActivitiesByLead(leadId: string, tenantId?: string) { return (await getStorage()).getActivitiesByLead(leadId, tenantId); },
  async createActivity(activity: InsertActivity, tenantId: string = "default-tenant") { return (await getStorage()).createActivity(activity, tenantId); },
  async updateActivity(id: string, activity: Partial<InsertActivity>, tenantId?: string) { return (await getStorage()).updateActivity(id, activity, tenantId); },
  async deleteActivity(id: string, tenantId?: string) { return (await getStorage()).deleteActivity(id, tenantId); },
  async getTodaysActivities(tenantId?: string) { return (await getStorage()).getTodaysActivities(tenantId); },
  async getMessagesByLead(leadId: string, tenantId?: string) { return (await getStorage()).getMessagesByLead(leadId, tenantId); },
  async createMessage(message: InsertMessage, tenantId: string = "default-tenant") { return (await getStorage()).createMessage(message, tenantId); },
  async updateMessageStatus(id: string, status: string, tenantId?: string) { return (await getStorage()).updateMessageStatus(id, status, tenantId); },
  async getAllMessages(tenantId?: string) { return (await getStorage()).getAllMessages(tenantId); },
  async getNotifications() { return (await getStorage()).getNotifications(); },
  async getAllSaudiRegions() { return (await getStorage()).getAllSaudiRegions(); },
  async seedSaudiRegions() { return (await getStorage()).seedSaudiRegions(); },
  async getAllSaudiCities() { return (await getStorage()).getAllSaudiCities(); },
  async getCitiesByRegion(regionCode: string) { return (await getStorage()).getCitiesByRegion(regionCode); },
  async seedSaudiCities() { return (await getStorage()).seedSaudiCities(); }
};
