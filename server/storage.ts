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
  users, 
  userPermissions,
  leads, 
  properties, 
  deals, 
  activities, 
  messages,
  saudiRegions
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private properties: Map<string, Property>;
  private messages: Map<string, Message>;
  private deals: Map<string, Deal>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.properties = new Map();
    this.deals = new Map();
    this.activities = new Map();
    this.messages = new Map();
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
  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
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
  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
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
  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
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
  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
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

  async getTodaysActivities(): Promise<Activity[]> {
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
  async getMessagesByLead(leadId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.leadId === leadId
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
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

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Notification methods (basic implementation)
  async getNotifications(): Promise<any[]> {
    // For now, return empty array - this will be enhanced later
    return [];
  }

  // Saudi Regions methods (basic implementation for MemStorage)
  async getAllSaudiRegions(): Promise<SaudiRegion[]> {
    // Return empty array for MemStorage - this will not be used in production
    return [];
  }

  async seedSaudiRegions(): Promise<SaudiRegion[]> {
    // Return empty array for MemStorage - this will not be used in production
    return [];
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
}

export const storage = new DatabaseStorage();
