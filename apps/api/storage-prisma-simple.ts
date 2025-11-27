/**
 * storage-prisma-simple.ts - Simplified Prisma-based Database Storage Implementation
 * 
 * Location: apps/api/ → Database & Prisma → storage-prisma-simple.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Simplified Prisma-based database storage adapter. Provides:
 * - Essential database operations for admin dashboard
 * - Simplified storage interface
 * - Core CRUD operations
 * 
 * Related Files:
 * - apps/api/storage-prisma.ts - Full storage implementation
 * - apps/api/prismaClient.ts - Prisma client
 */

// @ts-nocheck
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

  async getAllSaudiCities(): Promise<any[]> {
    try {
      const cities = await prisma.cities.findMany({
        include: {
          region: true,
          districts: true,
        },
        orderBy: {
          nameAr: 'asc',
        },
      });
      return cities;
    } catch (error) {
      console.error('Error fetching Saudi cities:', error);
      return [];
    }
  }

  async getAllSaudiDistricts(): Promise<any[]> {
    try {
      const districts = await prisma.districts.findMany({
        include: {
          city: true,
          region: true,
        },
        orderBy: {
          nameAr: 'asc',
        },
      });
      return districts;
    } catch (error) {
      console.error('Error fetching Saudi districts:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const storage = new PrismaStorageSimple();
