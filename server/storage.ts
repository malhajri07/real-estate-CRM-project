import { type User, type InsertUser, type Lead, type InsertLead, type Property, type InsertProperty, type Deal, type InsertDeal, type Activity, type InsertActivity, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Lead methods
  getAllLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  searchLeads(query: string): Promise<Lead[]>;

  // Property methods
  getAllProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  searchProperties(query: string): Promise<Property[]>;

  // Deal methods
  getAllDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  getDealsByStage(stage: string): Promise<Deal[]>;

  // Activity methods
  getActivitiesByLead(leadId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
  getTodaysActivities(): Promise<Activity[]>;

  // Message methods
  getMessagesByLead(leadId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: string, status: string): Promise<Message | undefined>;
  getAllMessages(): Promise<Message[]>;
  
  // Notification methods (basic implementation for now)
  getNotifications(): Promise<any[]>;
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
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
      photoUrl: insertProperty.photoUrl || null,
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
}

export const storage = new MemStorage();
