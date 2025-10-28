/**
 * storage-prisma-simple.ts - Simplified Prisma-based Database Storage Implementation
 * 
 * This file provides a simplified Prisma-based implementation that only includes
 * the essential functionality needed for the admin dashboard to work.
 */

import { prisma } from './prismaClient';

/**
 * PrismaStorageSimple Class - Simplified storage implementation
 */
class PrismaStorageSimple {
  private decimalToNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }

  async getUser(id: string): Promise<any | undefined> {
    try {
      const user = await prisma.users.findUnique({
        where: { id },
        include: {
          organization: true,
          agent_profiles: true,
        },
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        include: {
          organization: true,
          agent_profiles: true,
        },
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const users = await prisma.users.findMany({
        include: {
          organization: true,
          agent_profiles: true,
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

  async getAllProperties(): Promise<any[]> {
    try {
      const properties = await prisma.properties.findMany({
        include: {
          listings: true,
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

  async getAllLeads(): Promise<any[]> {
    try {
      const leads = await prisma.leads.findMany({
        include: {
          users: true,
          buyer_requests: true,
          seller_submissions: true,
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

  async getAllClaims(): Promise<any[]> {
    try {
      const claims = await prisma.claims.findMany({
        include: {
          users: true,
          buyer_requests: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return claims;
    } catch (error) {
      console.error('Error fetching claims:', error);
      return [];
    }
  }

  async getAllOrganizations(): Promise<any[]> {
    try {
      const organizations = await prisma.organizations.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return organizations;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  async getAllSaudiRegions(): Promise<any[]> {
    try {
      const regions = await prisma.regions.findMany({
        include: {
          cities: true,
          districts: true,
          },
        orderBy: {
          nameAr: 'asc',
        },
      });
      return regions;
    } catch (error) {
      console.error('Error fetching Saudi regions:', error);
      return [];
    }
  }


  // Lead management methods
  async searchLeads(filters: any): Promise<any[]> {
    return this.getAllLeads();
  }

  async getLead(id: string): Promise<any | undefined> {
    try {
      const lead = await prisma.leads.findUnique({
        where: { id },
        include: { users: true, buyer_requests: true, seller_submissions: true },
      });
      return lead || undefined;
    } catch (error) {
      console.error('Error fetching lead:', error);
      return undefined;
    }
  }

  async createLead(data: any, userId?: string, tenantId?: string): Promise<any> {
    const leadData = {
      ...data,
      ...(userId && { userId }),
      ...(tenantId && { tenantId })
    };
    return await prisma.leads.create({ data: leadData });
  }

  async updateLead(id: string, data: any): Promise<any> {
    return await prisma.leads.update({ where: { id }, data });
  }

  async deleteLead(id: string): Promise<void> {
    await prisma.leads.delete({ where: { id } });
  }

  // Property management methods
  async searchProperties(filters: any): Promise<any[]> {
    return this.getAllProperties();
  }

  async getProperty(id: string): Promise<any | undefined> {
    try {
      const property = await prisma.properties.findUnique({
        where: { id },
        include: { listings: true },
      });
      return property || undefined;
    } catch (error) {
      console.error('Error fetching property:', error);
      return undefined;
    }
  }

  async createProperty(data: any, userId?: string, tenantId?: string): Promise<any> {
    const propertyData = {
      ...data,
      ...(userId && { userId }),
      ...(tenantId && { tenantId })
    };
    return await prisma.properties.create({ data: propertyData });
  }

  async updateProperty(id: string, data: any): Promise<any> {
    return await prisma.properties.update({ where: { id }, data });
  }

  async deleteProperty(id: string): Promise<void> {
    await prisma.properties.delete({ where: { id } });
  }

  // Deal management methods (using claims table)
  async getAllDeals(): Promise<any[]> {
    return this.getAllClaims();
  }

  async getDealsByStage(stage: string): Promise<any[]> {
    try {
      return await prisma.claims.findMany({
        where: { status: stage as any },
        include: { users: true, buyer_requests: true },
      });
    } catch (error) {
      console.error('Error fetching deals by stage:', error);
      return [];
    }
  }

  async createDeal(data: any): Promise<any> {
    return await prisma.claims.create({ data });
  }

  async updateDeal(id: string, data: any): Promise<any> {
    return await prisma.claims.update({ where: { id }, data });
  }

  // Activity management methods (stub implementations)
  async getActivitiesByLead(leadId: string): Promise<any[]> {
    return [];
  }

  async getTodaysActivities(): Promise<any[]> {
      return [];
    }

  async createActivity(data: any, tenantId?: string): Promise<any> {
    const activityData = {
      ...data,
      ...(tenantId && { tenantId })
    };
    return { id: 'stub', ...activityData };
  }

  // Message management methods (stub implementations)
  async getAllMessages(): Promise<any[]> {
    return [];
  }

  async getMessagesByLead(leadId: string): Promise<any[]> {
    return [];
  }

  async createMessage(data: any, tenantId?: string): Promise<any> {
    const messageData = {
      ...data,
      ...(tenantId && { tenantId })
    };
    return { id: 'stub', ...messageData };
  }

  // Notification methods (stub implementation)
  async getNotifications(userId: string): Promise<any[]> {
    return [];
  }

  // Seeding methods
  async seedSaudiRegions(data: any[]): Promise<any[]> {
    // Stub implementation
    console.log('Seeding regions:', data.length);
    return data;
  }

  async getCitiesByRegion(regionId: number): Promise<any[]> {
    try {
      return await prisma.cities.findMany({
        where: { regionId },
        include: { regions: true, districts: true },
      });
    } catch (error) {
      console.error('Error fetching cities by region:', error);
      return [];
    }
  }

  async seedSaudiCities(data: any[]): Promise<any[]> {
    // Stub implementation
    console.log('Seeding cities:', data.length);
    return data;
  }

  // User permission methods
  async getUserPermissions(userId: string): Promise<any[]> {
    try {
      return await prisma.user_roles.findMany({
        where: { userId },
        include: { role: true }
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  async createUserPermissions(permissions: any[]): Promise<any> {
    try {
      return await prisma.user_roles.createMany({
        data: permissions
      });
    } catch (error) {
      console.error('Error creating user permissions:', error);
      return { count: 0 };
    }
  }

  // User management methods
  async upsertUser(userData: any): Promise<any> {
    try {
      return await prisma.users.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Favorites methods (stub implementations)
  async getFavoriteProperties(userId: string): Promise<any[]> {
      return [];
  }

  async addFavorite(userId: string, propertyId: string): Promise<any> {
    return { id: 'stub', userId, propertyId };
  }

  async removeFavorite(userId: string, propertyId: string): Promise<boolean> {
    return true;
  }

  // Property inquiry methods
  async createPropertyInquiry(data: any): Promise<any> {
    try {
      return await prisma.inquiries.create({
        data
      });
    } catch (error) {
      console.error('Error creating property inquiry:', error);
      throw error;
    }
  }

  // Location methods
  async getAllSaudiCities(regionId?: number): Promise<any[]> {
    try {
      const where = regionId ? { regionId } : {};
      return await prisma.cities.findMany({
        where,
        orderBy: { nameAr: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching Saudi cities:', error);
      return [];
    }
  }

  async getDistrictsByCity(cityId: number): Promise<any[]> {
    try {
      return await prisma.districts.findMany({
        where: { cityId },
        include: { cities: true, regions: true },
        orderBy: { nameAr: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching districts by city:', error);
      return [];
    }
  }

  async getAllSaudiDistricts(regionId?: number): Promise<any[]> {
    try {
      const where = regionId ? { 
        cities: { regionId } 
      } : {};
      return await prisma.districts.findMany({
        where,
        include: { cities: true, regions: true },
        orderBy: { nameAr: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching Saudi districts:', error);
      return [];
    }
  }

  // Marketing request methods (stub implementations)
  async createMarketingRequest(data: any): Promise<any> {
    return { id: 'stub', ...data };
  }

  async listMarketingRequests(filters: any): Promise<any[]> {
    return [];
  }

  async getMarketingRequest(id: string, options?: any): Promise<any> {
    return { id, ...options };
  }

  async updateMarketingRequest(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  async findMarketingProposalForAgent(requestId: string, agentId: string): Promise<any> {
    return null;
  }

  async createMarketingProposal(data: any): Promise<any> {
    return { id: 'stub', ...data };
  }

  async listMarketingProposalsByRequest(requestId: string): Promise<any[]> {
    return [];
  }

  async updateMarketingProposal(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  // Real estate request methods (stub implementations)
  async createRealEstateRequest(data: any): Promise<any> {
    return { id: 'stub', ...data };
  }

  async getAllRealEstateRequests(): Promise<any[]> {
    return [];
  }

  async updateRealEstateRequest(id: string, data: any): Promise<any> {
    return { id, ...data };
  }
}

// Export a singleton instance
export const storage = new PrismaStorageSimple();
















