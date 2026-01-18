/**
 * storage-prisma.ts - Prisma-based Database Storage Implementation
 * 
 * Location: apps/api/ → Database & Prisma → storage-prisma.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Prisma-based database storage adapter. Provides:
 * - Database operations abstraction
 * - CRUD operations for all entities
 * - Query helpers and utilities
 * 
 * Related Files:
 * - apps/api/prismaClient.ts - Prisma client
 * - apps/api/storage-prisma-simple.ts - Simplified storage variant
 * - Used by all route handlers for database operations
 */

/**
 * storage-prisma-simple.ts - Simplified Prisma-based Database Storage Implementation
 * 
 * This file provides a simplified Prisma-based implementation that only includes
 * the essential functionality needed for the admin dashboard to work.
 */

import { prisma, basePrisma } from './prismaClient';

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

  /**
   * Get properties with SQL-level pagination and filtering
   */
  async getPropertiesPaginated(options: {
    page?: number;
    pageSize?: number;
    fetchAll?: boolean;
    q?: string;
    city?: string;
    propertyType?: string;
    propertyCategory?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    minBathrooms?: number;
    status?: string;
    ids?: string[];
    sort?: string;
  }): Promise<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    try {
      const {
        page = 1,
        pageSize = 20,
        fetchAll = false,
        q,
        city,
        propertyType,
        propertyCategory,
        listingType,
        minPrice,
        maxPrice,
        minBedrooms,
        minBathrooms,
        status,
        ids,
        sort = 'newest',
      } = options;

      // Build where clause for SQL-level filtering
      const where: any = {};

      if (ids && ids.length > 0) {
        where.id = { in: ids };
      }

      if (status) {
        where.status = status;
      }

      if (city) {
        where.city = city;
      }

      if (propertyType) {
        where.type = propertyType;
      }

      if (propertyCategory) {
        where.category = propertyCategory;
      }

      if (listingType) {
        where.listings = {
          some: {
            listingType: listingType,
          },
        };
      }

      if (minPrice !== undefined) {
        where.price = { ...where.price, gte: minPrice };
      }

      if (maxPrice !== undefined) {
        where.price = { ...where.price, lte: maxPrice };
      }

      if (minBedrooms !== undefined) {
        where.bedrooms = { ...where.bedrooms, gte: minBedrooms };
      }

      if (minBathrooms !== undefined) {
        where.bathrooms = { ...where.bathrooms, gte: minBathrooms };
      }

      // Text search - use Prisma's contains for SQL-level search
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Build orderBy clause
      let orderBy: any = { createdAt: 'desc' };
      switch (sort) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'area_asc':
          orderBy = { areaSqm: 'asc' };
          break;
        case 'area_desc':
          orderBy = { areaSqm: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }

      // Calculate pagination
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      // If fetchAll is true or pageSize is very large (>= 10000), fetch all records
      const shouldFetchAll = fetchAll || pageSize >= 10000;

      // Get total count and items in parallel
      const [total, items] = await Promise.all([
        prisma.properties.count({ where }),
        prisma.properties.findMany({
          where,
          include: {
            listings: true,
          },
          orderBy,
          ...(shouldFetchAll ? {} : { skip, take }),
        }),
      ]);

      const totalPages = shouldFetchAll ? 1 : Math.ceil(total / pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching paginated properties:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      };
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
      // Don't include relationships to avoid BigInt serialization issues
      return await prisma.districts.findMany({
        where: { cityId },
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
        regionId 
      } : {};
      // Don't include relationships to avoid BigInt serialization issues
      return await prisma.districts.findMany({
        where,
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

  // Real estate request methods
  async createRealEstateRequest(data: any): Promise<any> {
    try {
      // Use basePrisma directly to access properties_seeker model
      const created = await basePrisma.properties_seeker.create({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          mobile_number: data.mobileNumber,
          email: data.email,
          nationality: data.nationality,
          age: data.age,
          monthly_income: data.monthlyIncome,
          gender: data.gender,
          type_of_property: data.typeOfProperty,
          type_of_contract: data.typeOfContract,
          number_of_rooms: data.numberOfRooms,
          number_of_bathrooms: data.numberOfBathrooms,
          number_of_living_rooms: data.numberOfLivingRooms,
          house_direction: data.houseDirection || null,
          budget_size: data.budgetSize,
          has_maid_room: data.hasMaidRoom ?? false,
          has_driver_room: data.hasDriverRoom ?? false,
          kitchen_installed: data.kitchenInstalled ?? false,
          has_elevator: data.hasElevator ?? false,
          parking_available: data.parkingAvailable ?? false,
          city: data.city || null,
          district: data.district || null,
          region: data.region || null,
          Sqm: data.sqm ? BigInt(Math.floor(data.sqm)) : null,
          other_comments: data.notes || null,
        },
      });
      
      // Map back to camelCase for API response
      return {
        id: created.seeker_id || String(created.seeker_num),
        seekerId: created.seeker_id || `S-${String(created.seeker_num).padStart(11, '0')}`,
        seekerNum: String(created.seeker_num),
        firstName: created.first_name,
        lastName: created.last_name,
        mobileNumber: created.mobile_number,
        email: created.email,
        nationality: created.nationality,
        age: created.age,
        monthlyIncome: Number(created.monthly_income),
        gender: created.gender,
        typeOfProperty: created.type_of_property,
        typeOfContract: created.type_of_contract,
        numberOfRooms: created.number_of_rooms,
        numberOfBathrooms: created.number_of_bathrooms,
        numberOfLivingRooms: created.number_of_living_rooms,
        houseDirection: created.house_direction,
        budgetSize: Number(created.budget_size),
        hasMaidRoom: created.has_maid_room,
        hasDriverRoom: created.has_driver_room,
        kitchenInstalled: created.kitchen_installed,
        hasElevator: created.has_elevator,
        parkingAvailable: created.parking_available,
        city: created.city,
        district: created.district,
        region: created.region,
        sqm: created.Sqm ? Number(created.Sqm) : null,
        notes: created.other_comments,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      };
    } catch (error) {
      console.error('Error creating real estate request:', error);
      throw error;
    }
  }

  async getAllRealEstateRequests(): Promise<any[]> {
    try {
      const requests = await basePrisma.properties_seeker.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });
      
      // Map to camelCase for API response
      return requests.map((req) => ({
        id: req.seeker_id || String(req.seeker_num),
        seekerId: req.seeker_id || `S-${String(req.seeker_num).padStart(11, '0')}`,
        seekerNum: String(req.seeker_num),
        firstName: req.first_name,
        lastName: req.last_name,
        mobileNumber: req.mobile_number,
        email: req.email,
        nationality: req.nationality,
        age: req.age,
        monthlyIncome: Number(req.monthly_income),
        gender: req.gender,
        typeOfProperty: req.type_of_property,
        typeOfContract: req.type_of_contract,
        numberOfRooms: req.number_of_rooms,
        numberOfBathrooms: req.number_of_bathrooms,
        numberOfLivingRooms: req.number_of_living_rooms,
        houseDirection: req.house_direction,
        budgetSize: Number(req.budget_size),
        hasMaidRoom: req.has_maid_room,
        hasDriverRoom: req.has_driver_room,
        kitchenInstalled: req.kitchen_installed,
        hasElevator: req.has_elevator,
        parkingAvailable: req.parking_available,
        city: req.city,
        district: req.district,
        region: req.region,
        sqm: req.Sqm ? Number(req.Sqm) : null,
        notes: req.other_comments,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching real estate requests:', error);
      return [];
    }
  }

  async updateRealEstateRequest(id: string, data: any): Promise<any> {
    try {
      // Try to find by seeker_id first, then by seeker_num
      const where = id.startsWith('S-') 
        ? { seeker_id: id }
        : { seeker_num: BigInt(id) };
      
      const updateData: any = {};
      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.mobileNumber !== undefined) updateData.mobile_number = data.mobileNumber;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.nationality !== undefined) updateData.nationality = data.nationality;
      if (data.age !== undefined) updateData.age = data.age;
      if (data.monthlyIncome !== undefined) updateData.monthly_income = data.monthlyIncome;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.typeOfProperty !== undefined) updateData.type_of_property = data.typeOfProperty;
      if (data.typeOfContract !== undefined) updateData.type_of_contract = data.typeOfContract;
      if (data.numberOfRooms !== undefined) updateData.number_of_rooms = data.numberOfRooms;
      if (data.numberOfBathrooms !== undefined) updateData.number_of_bathrooms = data.numberOfBathrooms;
      if (data.numberOfLivingRooms !== undefined) updateData.number_of_living_rooms = data.numberOfLivingRooms;
      if (data.houseDirection !== undefined) updateData.house_direction = data.houseDirection || null;
      if (data.budgetSize !== undefined) updateData.budget_size = data.budgetSize;
      if (data.hasMaidRoom !== undefined) updateData.has_maid_room = data.hasMaidRoom;
      if (data.hasDriverRoom !== undefined) updateData.has_driver_room = data.hasDriverRoom;
      if (data.kitchenInstalled !== undefined) updateData.kitchen_installed = data.kitchenInstalled;
      if (data.hasElevator !== undefined) updateData.has_elevator = data.hasElevator;
      if (data.parkingAvailable !== undefined) updateData.parking_available = data.parkingAvailable;
      if (data.city !== undefined) updateData.city = data.city || null;
      if (data.district !== undefined) updateData.district = data.district || null;
      if (data.region !== undefined) updateData.region = data.region || null;
      if (data.sqm !== undefined) updateData.Sqm = data.sqm ? BigInt(Math.floor(data.sqm)) : null;
      if (data.notes !== undefined) updateData.other_comments = data.notes || null;
      updateData.updated_at = new Date();
      
      const updated = await basePrisma.properties_seeker.update({
        where,
        data: updateData,
      });
      
      // Map back to camelCase
      return {
        id: updated.seeker_id || String(updated.seeker_num),
        seekerId: updated.seeker_id || `S-${String(updated.seeker_num).padStart(11, '0')}`,
        seekerNum: String(updated.seeker_num),
        firstName: updated.first_name,
        lastName: updated.last_name,
        mobileNumber: updated.mobile_number,
        email: updated.email,
        nationality: updated.nationality,
        age: updated.age,
        monthlyIncome: Number(updated.monthly_income),
        gender: updated.gender,
        typeOfProperty: updated.type_of_property,
        typeOfContract: updated.type_of_contract,
        numberOfRooms: updated.number_of_rooms,
        numberOfBathrooms: updated.number_of_bathrooms,
        numberOfLivingRooms: updated.number_of_living_rooms,
        houseDirection: updated.house_direction,
        budgetSize: Number(updated.budget_size),
        hasMaidRoom: updated.has_maid_room,
        hasDriverRoom: updated.has_driver_room,
        kitchenInstalled: updated.kitchen_installed,
        hasElevator: updated.has_elevator,
        parkingAvailable: updated.parking_available,
        city: updated.city,
        district: updated.district,
        region: updated.region,
        sqm: updated.Sqm ? Number(updated.Sqm) : null,
        notes: updated.other_comments,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    } catch (error) {
      console.error('Error updating real estate request:', error);
      throw error;
    }
  }

  async createPropertyListing(data: any): Promise<any> {
    try {
      // Generate property_id using the database sequence
      // Format: P-0000000001 (where the number comes from property_id_seq)
      const sequenceResult = await basePrisma.$queryRaw<Array<{ nextval: bigint }>>`
        SELECT nextval('property_id_seq') as nextval
      `;
      const sequenceNumber = sequenceResult[0]?.nextval ?? BigInt(1);
      const propertyId = `P-${String(sequenceNumber).padStart(10, '0')}`;

      const created = await basePrisma.property_listings.create({
        data: {
          property_id: propertyId,
          title: data.title,
          description: data.description || null,
          property_type: data.propertyType || data.property_type,
          listing_type: data.listingType || data.listing_type,
          country: data.country || "Saudi Arabia",
          region: data.region || null,
          city: data.city || null,
          district: data.district || null,
          street_address: data.streetAddress || data.address || null,
          latitude: data.latitude ? String(data.latitude) : null,
          longitude: data.longitude ? String(data.longitude) : null,
          bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
          bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
          living_rooms: data.livingRooms || data.living_rooms ? Number(data.livingRooms || data.living_rooms) : null,
          kitchens: data.kitchens ? Number(data.kitchens) : null,
          floor_number: data.floorNumber || data.floor_number ? Number(data.floorNumber || data.floor_number) : null,
          total_floors: data.totalFloors || data.total_floors ? Number(data.totalFloors || data.total_floors) : null,
          area_sq_m: data.areaSqm || data.area_sq_m ? String(data.areaSqm || data.area_sq_m) : null,
          building_year: data.buildingYear || data.building_year ? Number(data.buildingYear || data.building_year) : null,
          has_parking: data.hasParking ?? data.has_parking ?? false,
          has_elevator: data.hasElevator ?? data.has_elevator ?? false,
          has_maids_room: data.hasMaidsRoom ?? data.has_maids_room ?? false,
          has_driver_room: data.hasDriverRoom ?? data.has_driver_room ?? false,
          furnished: data.furnished ?? false,
          balcony: data.balcony ?? false,
          swimming_pool: data.swimmingPool ?? data.swimming_pool ?? false,
          central_ac: data.centralAc ?? data.central_ac ?? false,
          price: String(data.price),
          currency: data.currency || "SAR",
          payment_frequency: data.paymentFrequency || data.payment_frequency || null,
          main_image_url: data.mainImageUrl || data.main_image_url || null,
          image_gallery: Array.isArray(data.imageGallery || data.image_gallery || data.images) 
            ? (data.imageGallery || data.image_gallery || data.images) 
            : [],
          video_clip_url: data.videoClipUrl || data.video_clip_url || null,
          contact_name: data.contactName || data.contact_name || null,
          mobile_number: data.mobileNumber || data.mobile_number,
          is_verified: data.isVerified ?? data.is_verified ?? false,
          is_active: data.isActive ?? data.is_active ?? true,
          status: data.status || "Pending",
        },
      });
      return {
        id: created.id.toString(),
        propertyId: created.property_id,
        title: created.title,
        description: created.description,
        propertyType: created.property_type,
        listingType: created.listing_type,
        country: created.country,
        region: created.region,
        city: created.city,
        district: created.district,
        streetAddress: created.street_address,
        latitude: created.latitude ? Number(created.latitude) : null,
        longitude: created.longitude ? Number(created.longitude) : null,
        bedrooms: created.bedrooms,
        bathrooms: created.bathrooms,
        livingRooms: created.living_rooms,
        kitchens: created.kitchens,
        floorNumber: created.floor_number,
        totalFloors: created.total_floors,
        areaSqm: created.area_sq_m ? Number(created.area_sq_m) : null,
        buildingYear: created.building_year,
        hasParking: created.has_parking,
        hasElevator: created.has_elevator,
        hasMaidsRoom: created.has_maids_room,
        hasDriverRoom: created.has_driver_room,
        furnished: created.furnished,
        balcony: created.balcony,
        swimmingPool: created.swimming_pool,
        centralAc: created.central_ac,
        price: Number(created.price),
        currency: created.currency,
        paymentFrequency: created.payment_frequency,
        mainImageUrl: created.main_image_url,
        imageGallery: created.image_gallery,
        videoClipUrl: created.video_clip_url,
        contactName: created.contact_name,
        mobileNumber: created.mobile_number,
        isVerified: created.is_verified,
        isActive: created.is_active,
        status: created.status,
        viewsCount: created.views_count,
        favoritesCount: created.favorites_count,
        listedDate: created.listed_date,
        updatedAt: created.updated_at,
      };
    } catch (error) {
      console.error('Error creating property listing:', error);
      throw error;
    }
  }

  /**
   * Get all property listings filtered by status
   */
  async getAllPropertyListings(status?: string): Promise<any[]> {
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      }
      
      const listings = await basePrisma.property_listings.findMany({
        where,
        orderBy: { listed_date: 'desc' },
      });
      
      return listings.map(listing => ({
        id: listing.id.toString(),
        propertyId: listing.property_id,
        title: listing.title,
        description: listing.description,
        propertyType: listing.property_type,
        listingType: listing.listing_type,
        country: listing.country,
        region: listing.region,
        city: listing.city,
        district: listing.district,
        streetAddress: listing.street_address,
        latitude: listing.latitude ? Number(listing.latitude) : null,
        longitude: listing.longitude ? Number(listing.longitude) : null,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        livingRooms: listing.living_rooms,
        kitchens: listing.kitchens,
        floorNumber: listing.floor_number,
        totalFloors: listing.total_floors,
        areaSqm: listing.area_sq_m ? Number(listing.area_sq_m) : null,
        buildingYear: listing.building_year,
        hasParking: listing.has_parking,
        hasElevator: listing.has_elevator,
        hasMaidsRoom: listing.has_maids_room,
        hasDriverRoom: listing.has_driver_room,
        furnished: listing.furnished,
        balcony: listing.balcony,
        swimmingPool: listing.swimming_pool,
        centralAc: listing.central_ac,
        price: Number(listing.price),
        currency: listing.currency,
        paymentFrequency: listing.payment_frequency,
        mainImageUrl: listing.main_image_url,
        imageGallery: listing.image_gallery,
        videoClipUrl: listing.video_clip_url,
        contactName: listing.contact_name,
        mobileNumber: listing.mobile_number,
        isVerified: listing.is_verified,
        isActive: listing.is_active,
        status: listing.status,
        viewsCount: listing.views_count,
        favoritesCount: listing.favorites_count,
        listedDate: listing.listed_date,
        updatedAt: listing.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching property listings:', error);
      return [];
    }
  }

  /**
   * Get property listing by ID
   */
  async getPropertyListingById(id: string): Promise<any | null> {
    try {
      const listing = await basePrisma.property_listings.findUnique({
        where: { id: BigInt(id) },
      });
      
      if (!listing) return null;
      
      return {
        id: listing.id.toString(),
        propertyId: listing.property_id,
        title: listing.title,
        description: listing.description,
        propertyType: listing.property_type,
        listingType: listing.listing_type,
        country: listing.country,
        region: listing.region,
        city: listing.city,
        district: listing.district,
        streetAddress: listing.street_address,
        latitude: listing.latitude ? Number(listing.latitude) : null,
        longitude: listing.longitude ? Number(listing.longitude) : null,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        livingRooms: listing.living_rooms,
        kitchens: listing.kitchens,
        floorNumber: listing.floor_number,
        totalFloors: listing.total_floors,
        areaSqm: listing.area_sq_m ? Number(listing.area_sq_m) : null,
        buildingYear: listing.building_year,
        hasParking: listing.has_parking,
        hasElevator: listing.has_elevator,
        hasMaidsRoom: listing.has_maids_room,
        hasDriverRoom: listing.has_driver_room,
        furnished: listing.furnished,
        balcony: listing.balcony,
        swimmingPool: listing.swimming_pool,
        centralAc: listing.central_ac,
        price: Number(listing.price),
        currency: listing.currency,
        paymentFrequency: listing.payment_frequency,
        mainImageUrl: listing.main_image_url,
        imageGallery: listing.image_gallery,
        videoClipUrl: listing.video_clip_url,
        contactName: listing.contact_name,
        mobileNumber: listing.mobile_number,
        isVerified: listing.is_verified,
        isActive: listing.is_active,
        status: listing.status,
        viewsCount: listing.views_count,
        favoritesCount: listing.favorites_count,
        listedDate: listing.listed_date,
        updatedAt: listing.updated_at,
      };
    } catch (error) {
      console.error('Error fetching property listing:', error);
      return null;
    }
  }

  /**
   * Update property listing
   */
  async updatePropertyListing(id: string, data: any): Promise<any> {
    try {
      const updateData: any = {};
      
      if (data.is_verified !== undefined) updateData.is_verified = data.is_verified;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = String(data.price);
      if (data.city !== undefined) updateData.city = data.city;
      if (data.region !== undefined) updateData.region = data.region;
      if (data.district !== undefined) updateData.district = data.district;
      
      const updated = await basePrisma.property_listings.update({
        where: { id: BigInt(id) },
        data: updateData,
      });
      
      return {
        id: updated.id.toString(),
        propertyId: updated.property_id,
        title: updated.title,
        description: updated.description,
        propertyType: updated.property_type,
        listingType: updated.listing_type,
        country: updated.country,
        region: updated.region,
        city: updated.city,
        district: updated.district,
        price: Number(updated.price),
        currency: updated.currency,
        isVerified: updated.is_verified,
        isActive: updated.is_active,
        status: updated.status,
        listedDate: updated.listed_date,
        updatedAt: updated.updated_at,
      };
    } catch (error) {
      console.error('Error updating property listing:', error);
      throw error;
    }
  }

  /**
   * Get all active property categories
   */
  async getAllPropertyCategories(): Promise<any[]> {
    try {
      const categories = await basePrisma.property_category.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      });
      
      return categories.map(cat => ({
        id: cat.id,
        code: cat.code,
        nameAr: cat.name_ar,
        nameEn: cat.name_en,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.display_order,
        isActive: cat.is_active,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching property categories:', error);
      throw error;
    }
  }

  /**
   * Get property category by ID
   */
  async getPropertyCategoryById(id: number): Promise<any | null> {
    try {
      const category = await basePrisma.property_category.findUnique({
        where: { id },
      });
      
      if (!category) {
        return null;
      }
      
      return {
        id: category.id,
        code: category.code,
        nameAr: category.name_ar,
        nameEn: category.name_en,
        description: category.description,
        icon: category.icon,
        displayOrder: category.display_order,
        isActive: category.is_active,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
    } catch (error) {
      console.error('Error fetching property category by ID:', error);
      throw error;
    }
  }

  /**
   * Get all active property types (optionally filtered by category)
   */
  async getAllPropertyTypes(categoryId?: number): Promise<any[]> {
    try {
      const where: any = { is_active: true };
      if (categoryId) {
        where.category_id = categoryId;
      }
      
      const types = await basePrisma.property_type.findMany({
        where,
        orderBy: { display_order: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              code: true,
              name_ar: true,
              name_en: true,
            },
          },
        },
      });
      
      return types.map(type => ({
        id: type.id,
        categoryId: type.category_id,
        code: type.code,
        nameAr: type.name_ar,
        nameEn: type.name_en,
        description: type.description,
        icon: type.icon,
        displayOrder: type.display_order,
        isActive: type.is_active,
        createdAt: type.created_at,
        updatedAt: type.updated_at,
        category: {
          id: type.category.id,
          code: type.category.code,
          nameAr: type.category.name_ar,
          nameEn: type.category.name_en,
        },
      }));
    } catch (error) {
      console.error('Error fetching property types:', error);
      throw error;
    }
  }

  /**
   * Get property types by category code
   */
  async getPropertyTypesByCategoryCode(categoryCode: string): Promise<any[]> {
    try {
      const category = await basePrisma.property_category.findUnique({
        where: { code: categoryCode },
      });
      
      if (!category) {
        return [];
      }
      
      return this.getAllPropertyTypes(category.id);
    } catch (error) {
      console.error('Error fetching property types by category code:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const storage = new PrismaStorageSimple();
















