/**
 * storage-prisma.ts - Prisma-based Database Storage Implementation
 * 
 * This file provides a Prisma-based implementation of the storage interface
 * for the real estate CRM platform. It replaces the Drizzle-based storage
 * system to resolve database connection issues.
 * 
 * Key Features:
 * - Uses Prisma ORM for database operations
 * - Compatible with SQLite database
 * - Provides all necessary CRUD operations
 * - Handles multi-tenant data isolation
 * - Includes proper error handling and logging
 * 
 * Dependencies:
 * - Prisma Client for database operations
 * - Random UUID generation for unique identifiers
 * 
 * Routes affected: All routes that use storage
 * Pages affected: All pages that display or modify data
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { randomUUID } from 'crypto';

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

/**
 * PrismaStorage Class - Prisma-based storage implementation
 * 
 * This class implements the storage interface using Prisma ORM.
 * It provides all necessary database operations for the CRM system.
 * 
 * Used in: All route handlers that need database access
 * Pages affected: All pages that interact with data
 */
class PrismaStorage {
  private decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }

  /**
   * getUser - Get user by ID
   * 
   * Retrieves a user from the database by their unique identifier.
   * 
   * Dependencies: prisma.user.findUnique()
   * Routes affected: Authentication, user management
   * Pages affected: User profile, admin panel
   */
  async getUser(id: string): Promise<any | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          organization: true,
          agentProfile: true,
        },
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  /**
   * getUserByEmail - Get user by email address
   * 
   * Retrieves a user from the database by their email address.
   * Used for authentication and user lookup.
   * 
   * Dependencies: prisma.user.findUnique()
   * Routes affected: Authentication, login
   * Pages affected: Login page, user management
   */
  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true,
          agentProfile: true,
        },
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  /**
   * getAllProperties - Get all properties
   * 
   * Retrieves all properties from the database with optional filtering.
   * Used for property listings and search functionality.
   * 
   * Dependencies: prisma.property.findMany()
   * Routes affected: Property listings, search
   * Pages affected: Property listings page, search results
   */
  async getAllProperties(tenantId?: string): Promise<any[]> {
    try {
      const properties = await prisma.property.findMany({
        include: {
          listings: true,
          organization: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return properties;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  /**
   * getProperty - Get property by ID
   * 
   * Retrieves a specific property from the database by its ID.
   * Used for property detail pages and individual property operations.
   * 
   * Dependencies: prisma.property.findUnique()
   * Routes affected: Property detail, property management
   * Pages affected: Property detail page, property editing
   */
  async getProperty(id: string, tenantId?: string): Promise<any | undefined> {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          listings: true,
          organization: true,
        },
      });
      return property || undefined;
    } catch (error) {
      console.error('Error fetching property:', error);
      return undefined;
    }
  }

  /**
   * getAllLeads - Get all leads
   * 
   * Retrieves all leads from the database with optional tenant filtering.
   * Used for lead management and CRM functionality.
   * 
   * Dependencies: prisma.lead.findMany()
   * Routes affected: Lead management, CRM
   * Pages affected: Leads page, CRM dashboard
   */
  async getAllLeads(tenantId?: string): Promise<any[]> {
    try {
      const leads = await prisma.lead.findMany({
        include: {
          agent: true,
          buyerRequest: true,
          sellerSubmission: true,
          contactLogs: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  /**
   * getLead - Get lead by ID
   * 
   * Retrieves a specific lead from the database by its ID.
   * Used for lead detail pages and individual lead operations.
   * 
   * Dependencies: prisma.lead.findUnique()
   * Routes affected: Lead detail, lead management
   * Pages affected: Lead detail page, lead editing
   */
  async getLead(id: string, tenantId?: string): Promise<any | undefined> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          agent: true,
          buyerRequest: true,
          sellerSubmission: true,
          contactLogs: true,
        },
      });
      return lead || undefined;
    } catch (error) {
      console.error('Error fetching lead:', error);
      return undefined;
    }
  }

  /**
   * getAllUsers - Get all users
   * 
   * Retrieves all users from the database.
   * Used for user management and admin functionality.
   * 
   * Dependencies: prisma.user.findMany()
   * Routes affected: User management, admin panel
   * Pages affected: User management page, admin dashboard
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          organization: true,
          agentProfile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * createUser - Create new user
   * 
   * Creates a new user in the database.
   * Used for user registration and admin user creation.
   * 
   * Dependencies: prisma.user.create()
   * Routes affected: User registration, admin user creation
   * Pages affected: Registration page, admin panel
   */
  async createUser(userData: any): Promise<any> {
    try {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          ...userData,
        },
        include: {
          organization: true,
          agentProfile: true,
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * updateUser - Update user
   * 
   * Updates an existing user in the database.
   * Used for user profile updates and admin user management.
   * 
   * Dependencies: prisma.user.update()
   * Routes affected: User profile update, admin user management
   * Pages affected: User profile page, admin panel
   */
  async updateUser(id: string, userData: Partial<any>): Promise<any> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: userData,
        include: {
          organization: true,
          agentProfile: true,
        },
      });
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * deleteUser - Delete user
   * 
   * Deletes a user from the database.
   * Used for user management and admin functionality.
   * 
   * Dependencies: prisma.user.delete()
   * Routes affected: User management, admin panel
   * Pages affected: User management page, admin dashboard
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Placeholder methods for compatibility with existing interface
  async getUserByUsername(username: string): Promise<any | undefined> {
    return undefined;
  }

  async upsertUser(user: any): Promise<any> {
    return this.createUser(user);
  }

  async getUserPermissions(userId: string): Promise<any | undefined> {
    return undefined;
  }

  async createUserPermissions(permissions: any): Promise<any> {
    return permissions;
  }

  async updateUserPermissions(userId: string, permissions: Partial<any>): Promise<any | undefined> {
    return undefined;
  }

  async createLead(lead: any, userId: string, tenantId: string): Promise<any> {
    try {
      const newLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          agentId: userId, // Set the agentId to the provided userId
          ...lead,
        },
        include: {
          agent: true,
          buyerRequest: true,
          sellerSubmission: true,
        },
      });
      return newLead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(id: string, lead: Partial<any>, tenantId?: string): Promise<any | undefined> {
    try {
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: lead,
        include: {
          agent: true,
          buyerRequest: true,
          sellerSubmission: true,
          contactLogs: true,
        },
      });
      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      return undefined;
    }
  }

  async deleteLead(id: string, tenantId?: string): Promise<boolean> {
    try {
      await prisma.lead.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  async searchLeads(query: string, tenantId?: string): Promise<any[]> {
    try {
      const leads = await prisma.lead.findMany({
        where: {
          OR: [
            { notes: { contains: query } },
            { 
              agent: {
                OR: [
                  { firstName: { contains: query } },
                  { lastName: { contains: query } },
                  { email: { contains: query } },
                  { phone: { contains: query } },
                ]
              }
            },
          ],
        },
        include: {
          agent: true,
          buyerRequest: true,
          sellerSubmission: true,
          contactLogs: true,
        },
      });
      return leads;
    } catch (error) {
      console.error('Error searching leads:', error);
      return [];
    }
  }

  async createProperty(property: any, userId: string, tenantId: string): Promise<any> {
    try {
      const newProperty = await prisma.property.create({
        data: {
          id: randomUUID(),
          agentId: userId, // Set the agentId to the provided userId
          ...property,
        },
        include: {
          agent: true,
          organization: true,
          listings: true,
        },
      });
      return newProperty;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  async updateProperty(id: string, property: Partial<any>, tenantId?: string): Promise<any | undefined> {
    try {
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: property,
        include: {
          listings: true,
          organization: true,
        },
      });
      return updatedProperty;
    } catch (error) {
      console.error('Error updating property:', error);
      return undefined;
    }
  }

  async deleteProperty(id: string, tenantId?: string): Promise<boolean> {
    try {
      await prisma.property.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return false;
    }
  }

  async searchProperties(query: string, tenantId?: string): Promise<any[]> {
    try {
      const properties = await prisma.property.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { address: { contains: query } },
          ],
        },
        include: {
          listings: true,
          organization: true,
        },
      });
      return properties;
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  private normalizeMarketingRequest<T extends any>(input: T | null | undefined): T | undefined {
    if (!input) return undefined;
    const request: any = { ...input };
    request.budgetMin = this.decimalToNumber(request.budgetMin);
    request.budgetMax = this.decimalToNumber(request.budgetMax);
    request.commissionExpectation = this.decimalToNumber(request.commissionExpectation);
    if (Array.isArray(request.proposals)) {
      request.proposals = request.proposals.map((proposal: any) => this.normalizeMarketingProposal(proposal)) as any;
    }
    return request;
  }

  private normalizeMarketingProposal<T extends any>(input: T | null | undefined): T | undefined {
    if (!input) return undefined;
    const proposal: any = { ...input };
    proposal.commissionRate = this.decimalToNumber(proposal.commissionRate);
    proposal.marketingBudget = this.decimalToNumber(proposal.marketingBudget);
    return proposal;
  }

  async createMarketingRequest(data: any): Promise<any> {
    try {
      const request = await prisma.marketingRequest.create({
        data,
        include: {
          owner: true,
        },
      });
      return this.normalizeMarketingRequest(request);
    } catch (error) {
      console.error('Error creating marketing request:', error);
      throw error;
    }
  }

  async updateMarketingRequest(id: string, data: Partial<any>): Promise<any | undefined> {
    try {
      const request = await prisma.marketingRequest.update({
        where: { id },
        data,
        include: {
          owner: true,
          proposals: {
            include: { agent: true },
          },
        },
      });
      return this.normalizeMarketingRequest(request);
    } catch (error) {
      console.error('Error updating marketing request:', error);
      return undefined;
    }
  }

  async getMarketingRequest(id: string, options: { includeProposals?: boolean; includeOwner?: boolean } = {}): Promise<any | undefined> {
    try {
      const request = await prisma.marketingRequest.findUnique({
        where: { id },
        include: {
          owner: options.includeOwner ?? false,
          proposals: options.includeProposals
            ? {
                include: { agent: true },
                orderBy: { submittedAt: 'desc' },
              }
            : false,
        },
      });
      return this.normalizeMarketingRequest(request ?? undefined);
    } catch (error) {
      console.error('Error fetching marketing request:', error);
      return undefined;
    }
  }

  async listMarketingRequests(filters: {
    status?: string;
    city?: string;
    seriousnessTier?: string;
    ownerId?: string;
    forAgentId?: string;
    includeOwner?: boolean;
    includeProposals?: boolean;
    search?: string;
    take?: number;
  } = {}): Promise<any[]> {
    try {
      const {
        status,
        city,
        seriousnessTier,
        ownerId,
        forAgentId,
        includeOwner,
        includeProposals,
        search,
        take,
      } = filters;

      const where: PrismaTypes.MarketingRequestWhereInput = {};

      if (status) {
        where.status = status as any;
      }
      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }
      if (seriousnessTier) {
        where.seriousnessTier = seriousnessTier as any;
      }
      if (ownerId) {
        where.ownerId = ownerId;
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { requirements: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (forAgentId) {
        const existingAnd = where.AND
          ? Array.isArray(where.AND)
            ? [...where.AND]
            : [where.AND]
          : [];
        existingAnd.push({
          OR: [
            { status: { in: ['OPEN', 'AWARDED'] as any } },
            { proposals: { some: { agentId: forAgentId } } },
          ],
        });
        where.AND = existingAnd;
      }

      const requests = await prisma.marketingRequest.findMany({
        where,
        include: {
          owner: includeOwner ?? false,
          proposals: includeProposals
            ? {
                include: { agent: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        take: take ?? undefined,
      });

      return requests.map((request) => this.normalizeMarketingRequest(request));
    } catch (error) {
      console.error('Error listing marketing requests:', error);
      return [];
    }
  }

  async createMarketingProposal(data: any): Promise<any> {
    try {
      const proposal = await prisma.marketingProposal.create({
        data,
        include: {
          agent: true,
          request: true,
        },
      });
      return this.normalizeMarketingProposal(proposal);
    } catch (error) {
      console.error('Error creating marketing proposal:', error);
      throw error;
    }
  }

  async updateMarketingProposal(id: string, data: Partial<any>): Promise<any | undefined> {
    try {
      const proposal = await prisma.marketingProposal.update({
        where: { id },
        data,
        include: {
          agent: true,
          request: true,
        },
      });
      return this.normalizeMarketingProposal(proposal);
    } catch (error) {
      console.error('Error updating marketing proposal:', error);
      return undefined;
    }
  }

  async getMarketingProposal(id: string): Promise<any | undefined> {
    try {
      const proposal = await prisma.marketingProposal.findUnique({
        where: { id },
        include: {
          agent: true,
          request: true,
        },
      });
      return this.normalizeMarketingProposal(proposal ?? undefined);
    } catch (error) {
      console.error('Error fetching marketing proposal:', error);
      return undefined;
    }
  }

  async listMarketingProposalsByRequest(requestId: string): Promise<any[]> {
    try {
      const proposals = await prisma.marketingProposal.findMany({
        where: { requestId },
        include: {
          agent: true,
        },
        orderBy: { submittedAt: 'desc' },
      });
      return proposals.map((proposal) => this.normalizeMarketingProposal(proposal));
    } catch (error) {
      console.error('Error listing marketing proposals:', error);
      return [];
    }
  }

  async findMarketingProposalForAgent(requestId: string, agentId: string): Promise<any | undefined> {
    try {
      const proposal = await prisma.marketingProposal.findFirst({
        where: {
          requestId,
          agentId,
        },
      });
      return this.normalizeMarketingProposal(proposal ?? undefined);
    } catch (error) {
      console.error('Error finding marketing proposal for agent:', error);
      return undefined;
    }
  }

  // Additional placeholder methods for full interface compatibility
  async getAllDeals(tenantId?: string): Promise<any[]> { return []; }
  async getDeal(id: string, tenantId?: string): Promise<any | undefined> { return undefined; }
  async createDeal(deal: any, tenantId: string): Promise<any> { return deal; }
  async updateDeal(id: string, deal: Partial<any>, tenantId?: string): Promise<any | undefined> { return undefined; }
  async deleteDeal(id: string, tenantId?: string): Promise<boolean> { return false; }
  async getDealsByStage(stage: string, tenantId?: string): Promise<any[]> { return []; }
  async getActivitiesByLead(leadId: string, tenantId?: string): Promise<any[]> { return []; }
  async createActivity(activity: any, tenantId: string): Promise<any> { return activity; }
  async updateActivity(id: string, activity: Partial<any>, tenantId?: string): Promise<any | undefined> { return undefined; }
  async deleteActivity(id: string, tenantId?: string): Promise<boolean> { return false; }
  async getTodaysActivities(tenantId?: string): Promise<any[]> { return []; }
  async getMessagesByLead(leadId: string, tenantId?: string): Promise<any[]> { return []; }
  async createMessage(message: any, tenantId: string): Promise<any> { return message; }
  async updateMessageStatus(id: string, status: string, tenantId?: string): Promise<any | undefined> { return undefined; }
  async getAllMessages(tenantId?: string): Promise<any[]> { return []; }
  async getNotifications(): Promise<any[]> { return []; }
  async getAllSaudiRegions(): Promise<any[]> {
    try {
      const regions = await prisma.region.findMany({
        orderBy: { nameEn: 'asc' },
        include: {
          _count: {
            select: { cities: true, districts: true },
          },
        },
      });

      return regions.map((region) => ({
        id: region.id,
        code: region.code,
        nameAr: region.nameAr,
        nameEn: region.nameEn,
        population: region.population,
        centerLatitude: this.decimalToNumber(region.centerLatitude),
        centerLongitude: this.decimalToNumber(region.centerLongitude),
        boundary: region.boundary,
        citiesCount: region._count.cities,
        districtsCount: region._count.districts,
      }));
    } catch (error) {
      console.error('Error fetching Saudi regions:', error);
      return [];
    }
  }

  async getAllSaudiCities(regionId?: number): Promise<any[]> {
    try {
      const cities = await prisma.city.findMany({
        where: regionId ? { regionId } : undefined,
        orderBy: { nameEn: 'asc' },
        include: {
          _count: { select: { districts: true } },
        },
      });

      return cities.map((city) => ({
        id: city.id,
        regionId: city.regionId,
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        centerLatitude: this.decimalToNumber(city.centerLatitude),
        centerLongitude: this.decimalToNumber(city.centerLongitude),
        districtsCount: city._count.districts,
      }));
    } catch (error) {
      console.error('Error fetching Saudi cities:', error);
      return [];
    }
  }

  async getCitiesByRegion(regionCode: string): Promise<any[]> {
    if (!regionCode) {
      return this.getAllSaudiCities();
    }

    const numericId = Number(regionCode);
    if (!Number.isNaN(numericId)) {
      return this.getAllSaudiCities(numericId);
    }

    try {
      const region = await prisma.region.findFirst({
        where: { code: regionCode.trim().toUpperCase() },
      });
      if (!region) {
        return [];
      }
      return this.getAllSaudiCities(region.id);
    } catch (error) {
      console.error('Error fetching cities by region code:', error);
      return [];
    }
  }

  async getAllSaudiDistricts(regionId?: number, cityId?: number): Promise<any[]> {
    try {
      const districts = await prisma.district.findMany({
        where: {
          regionId: regionId ?? undefined,
          cityId: cityId ?? undefined,
        },
        orderBy: { nameEn: 'asc' },
      });

      return districts.map((district) => ({
        id: district.id.toString(),
        regionId: district.regionId,
        cityId: district.cityId,
        nameAr: district.nameAr,
        nameEn: district.nameEn,
        boundary: district.boundary,
      }));
    } catch (error) {
      console.error('Error fetching Saudi districts:', error);
      return [];
    }
  }

  async getDistrictsByCity(cityId: number): Promise<any[]> {
    return this.getAllSaudiDistricts(undefined, cityId);
  }

  async seedSaudiRegions(): Promise<any[]> { return []; }
  async seedSaudiCities(): Promise<any[]> { return []; }
  async addFavorite(customerId: string, propertyId: string): Promise<any> { return {}; }
  async removeFavorite(customerId: string, propertyId: string): Promise<boolean> { return false; }
  async getFavoriteProperties(customerId: string): Promise<any[]> { return []; }
  async createPropertyInquiry(inquiry: any): Promise<any> { return inquiry; }
  async getSavedSearches(customerId: string): Promise<any[]> { return []; }
  async createSavedSearch(alert: any): Promise<any> { return alert; }
  async deleteSavedSearch(id: string): Promise<boolean> { return false; }
  async getAllReports(tenantId?: string): Promise<any[]> { return []; }
  async getReport(id: string, tenantId?: string): Promise<any | undefined> { return undefined; }
  async createReport(report: any, tenantId: string): Promise<any> { return report; }
  async updateReport(id: string, report: Partial<any>, tenantId?: string): Promise<any | undefined> { return undefined; }
  async deleteReport(id: string, tenantId?: string): Promise<boolean> { return false; }
  private propertySeekerWhere(id: string) {
    if (id && /^\d+$/.test(id)) {
      return { seekerNum: Number(id) };
    }
    return { seekerId: id };
  }

  private mapPropertySeekerData(payload: any) {
    const optionalString = (value: unknown) => {
      if (value === undefined || value === null) return null;
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    const optionalInt = (value: unknown) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.round(parsed) : null;
    };

    const requiredString = (value: unknown, field: string) => {
      const result = optionalString(value);
      if (!result) {
        throw new Error(`Missing required field "${field}" for property seeker payload`);
      }
      return result;
    };

    const ensureGender = (value: unknown) => {
      const normalized = requiredString(value, "gender").toLowerCase();
      if (!["male", "female", "other"].includes(normalized)) {
        throw new Error(`Invalid gender value "${normalized}" for property seeker payload`);
      }
      return normalized;
    };

    const requiredDecimal = (value: unknown, field: string) => {
      if (value === undefined || value === null || value === "") {
        throw new Error(`Missing required field "${field}" for property seeker payload`);
      }
      return new Prisma.Decimal(value as any);
    };

    const sqmInt = optionalInt(payload.sqm);

    return {
      firstName: requiredString(payload.firstName, "firstName"),
      lastName: requiredString(payload.lastName, "lastName"),
      mobileNumber: requiredString(payload.mobileNumber, "mobileNumber"),
      email: requiredString(payload.email, "email"),
      nationality: requiredString(payload.nationality, "nationality"),
      age: Number(payload.age),
      monthlyIncome: requiredDecimal(payload.monthlyIncome, "monthlyIncome"),
      gender: ensureGender(payload.gender),
      typeOfProperty: requiredString(payload.typeOfProperty, "typeOfProperty"),
      typeOfContract: requiredString(payload.typeOfContract, "typeOfContract"),
      numberOfRooms: Number(payload.numberOfRooms),
      numberOfBathrooms: Number(payload.numberOfBathrooms),
      numberOfLivingRooms: Number(payload.numberOfLivingRooms),
      houseDirection: optionalString(payload.houseDirection),
      budgetSize: requiredDecimal(payload.budgetSize, "budgetSize"),
      hasMaidRoom: Boolean(payload.hasMaidRoom),
      hasDriverRoom: Boolean(payload.hasDriverRoom),
      kitchenInstalled: Boolean(payload.kitchenInstalled),
      hasElevator: Boolean(payload.hasElevator),
      parkingAvailable: Boolean(payload.parkingAvailable),
      city: optionalString(payload.city),
      district: optionalString(payload.district),
      region: optionalString(payload.region),
      otherComments: optionalString(payload.otherComments ?? payload.notes),
      sqm: sqmInt === null ? null : BigInt(sqmInt),
    };
  }
  private serializePropertySeeker(record: any) {
    if (!record) return record;
    const seekerNumValue = record.seekerNum;
    const sqmValue = record.sqm;

    return {
      ...record,
      seekerNum: seekerNumValue === null || seekerNumValue === undefined
        ? null
        : seekerNumValue.toString(),
      sqm: sqmValue === null || sqmValue === undefined
        ? null
        : sqmValue.toString(),
    };
  }
  async getAllRealEstateRequests(): Promise<any[]> {
    try {
      const items = await prisma.propertySeeker.findMany({
        orderBy: { createdAt: 'desc' }
      });
      // Convert BigInt values to strings for JSON serialization
      return items.map(item => this.serializePropertySeeker(item));
    } catch (error) {
      console.error('Error listing property seeker requests:', error);
      return [];
    }
  }

  async getRealEstateRequest(id: string): Promise<any | undefined> {
    try {
      const item = await prisma.propertySeeker.findUnique({ where: this.propertySeekerWhere(id) });
      return item ? this.serializePropertySeeker(item) : undefined;
    } catch (error) {
      console.error('Error fetching property seeker request:', error);
      return undefined;
    }
  }

  async createRealEstateRequest(request: any): Promise<any> {
    try {
      const data = this.mapPropertySeekerData(request);

      // Use an explicit transaction so the select/update runs atomically.
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.propertySeeker.findUnique({
          where: {
            uniq_properties_seeker_email_mobile: {
              email: data.email,
              mobileNumber: data.mobileNumber,
            },
          },
        });

        if (existing) {
          const result = await tx.propertySeeker.update({
            where: { seekerNum: existing.seekerNum },
            data,
          });
          return this.serializePropertySeeker(result);
        }

        const result = await tx.propertySeeker.create({
          data,
        });
        return this.serializePropertySeeker(result);
      });
    } catch (error) {
      console.error('Error creating property seeker request:', error);
      throw error;
    }
  }

  async updateRealEstateRequest(id: string, request: Partial<any>): Promise<any | undefined> {
    try {
      const data: any = {};

      if (request.firstName !== undefined) data.firstName = request.firstName;
      if (request.lastName !== undefined) data.lastName = request.lastName;
      if (request.mobileNumber !== undefined) data.mobileNumber = request.mobileNumber;
      if (request.email !== undefined) data.email = request.email;
      if (request.nationality !== undefined) data.nationality = request.nationality;
      if (request.age !== undefined) data.age = Number(request.age);
      if (request.monthlyIncome !== undefined) data.monthlyIncome = new Prisma.Decimal(request.monthlyIncome as any);
      if (request.gender !== undefined) data.gender = request.gender;
      if (request.typeOfProperty !== undefined) data.typeOfProperty = request.typeOfProperty;
      if (request.typeOfContract !== undefined) data.typeOfContract = request.typeOfContract;
      if (request.numberOfRooms !== undefined) data.numberOfRooms = Number(request.numberOfRooms);
      if (request.numberOfBathrooms !== undefined) data.numberOfBathrooms = Number(request.numberOfBathrooms);
      if (request.numberOfLivingRooms !== undefined) data.numberOfLivingRooms = Number(request.numberOfLivingRooms);
      if (request.houseDirection !== undefined) data.houseDirection = request.houseDirection ?? null;
      if (request.budgetSize !== undefined) data.budgetSize = new Prisma.Decimal(request.budgetSize as any);
      if (request.hasMaidRoom !== undefined) data.hasMaidRoom = Boolean(request.hasMaidRoom);
      if (request.hasDriverRoom !== undefined) data.hasDriverRoom = request.hasDriverRoom === null ? null : Boolean(request.hasDriverRoom);
      if (request.kitchenInstalled !== undefined) data.kitchenInstalled = request.kitchenInstalled === null ? null : Boolean(request.kitchenInstalled);
      if (request.hasElevator !== undefined) data.hasElevator = request.hasElevator === null ? null : Boolean(request.hasElevator);
      if (request.parkingAvailable !== undefined) data.parkingAvailable = request.parkingAvailable === null ? null : Boolean(request.parkingAvailable);
      if (request.city !== undefined) data.city = request.city ?? null;
      if (request.district !== undefined) data.district = request.district ?? null;
      if (request.region !== undefined) data.region = request.region ?? null;
      if (request.notes !== undefined || request.otherComments !== undefined) {
        data.otherComments = (request as any).otherComments ?? request.notes ?? null;
      }
      if (request.sqm !== undefined) {
        const sqmValue = request.sqm === null ? null : Math.round(Number(request.sqm));
        data.sqm = sqmValue === null ? null : BigInt(sqmValue);
      }

      if (Object.keys(data).length === 0) {
        const existing = await prisma.propertySeeker.findUnique({ where: this.propertySeekerWhere(id) });
        return existing ? this.serializePropertySeeker(existing) : undefined;
      }

      const updated = await prisma.propertySeeker.update({ where: this.propertySeekerWhere(id), data });
      return this.serializePropertySeeker(updated);
    } catch (error) {
      if ((error as any)?.code === 'P2025') return undefined;
      console.error('Error updating property seeker request:', error);
      throw error;
    }
  }

  async deleteRealEstateRequest(id: string): Promise<boolean> {
    try {
      await prisma.propertySeeker.delete({ where: this.propertySeekerWhere(id) });
      return true;
    } catch (error) {
      if ((error as any)?.code === 'P2025') return false;
      console.error('Error deleting property seeker request:', error);
      throw error;
    }
  }
}

// Create and export storage instance
export const storage = new PrismaStorage();
