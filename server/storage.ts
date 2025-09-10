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
  type Report,
  type InsertReport,
  type RealEstateRequest,
  type InsertRealEstateRequest,
  type SaudiRegion,
  type SaudiCity,
  type SavedProperty,
  type InsertSavedProperty,
  type PropertyInquiry,
  type InsertPropertyInquiry,
  type PropertyAlert,
  type InsertPropertyAlert,
  users,
  userPermissions,
  leads,
  properties,
  deals,
  activities,
  messages,
  reports,
  saudiRegions,
  saudiCities,
  savedProperties,
  propertyInquiries,
  propertyAlerts,
  realEstateRequests
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, ilike, or, and, gte, lt, inArray } from "drizzle-orm";

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

  // Favorites (Saved Properties)
  addFavorite(customerId: string, propertyId: string): Promise<SavedProperty>;
  removeFavorite(customerId: string, propertyId: string): Promise<boolean>;
  getFavoriteProperties(customerId: string): Promise<Property[]>;

  // Property Inquiries
  createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry>;

  // Saved Searches (Property Alerts)
  getSavedSearches(customerId: string): Promise<PropertyAlert[]>;
  createSavedSearch(alert: InsertPropertyAlert): Promise<PropertyAlert>;
  deleteSavedSearch(id: string, customerId: string): Promise<boolean>;

  // Real Estate Requests (public submissions)
  createRealEstateRequest(req: InsertRealEstateRequest): Promise<RealEstateRequest>;
  listRealEstateRequests(): Promise<RealEstateRequest[]>;
  updateRealEstateRequestStatus(id: string, status: string): Promise<RealEstateRequest | undefined>;

  // Reports
  createReport(report: InsertReport, reporterId?: string | null): Promise<Report>;
  listReports(status?: string): Promise<Report[]>;
  resolveReport(id: string, resolutionNote?: string): Promise<Report | undefined>;

  // Agencies & Agents
  listAgencies(): Promise<User[]>;
  getAgency(id: string): Promise<User | undefined>;
  listAgencyAgents(agencyId: string): Promise<User[]>;
  getAgencyListings(agencyId: string): Promise<Property[]>;
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
  private favorites: Map<string, Set<string>>; // customerId -> propertyIds
  private inquiries: PropertyInquiry[];
  private alerts: PropertyAlert[];
  private memReports: Report[];
  private realEstateRequests: RealEstateRequest[];

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.properties = new Map();
    this.deals = new Map();
    this.activities = new Map();
    this.messages = new Map();
    this.saudiRegions = [];
    this.saudiCities = [];
    this.favorites = new Map();
    this.inquiries = [];
    this.alerts = [];
    this.memReports = [];
    this.realEstateRequests = [];

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
    ] as any;

    // Add sample Saudi cities
    this.saudiCities = [
      { nameArabic: "الرياض", nameEnglish: "Riyadh", regionCode: "SA-01", isCapital: true, population: 7676655 },
      { nameArabic: "جدة", nameEnglish: "Jeddah", regionCode: "SA-02", isCapital: false, population: 4697000 },
      { nameArabic: "مكة المكرمة", nameEnglish: "Makkah", regionCode: "SA-02", isCapital: true, population: 2042000 },
      { nameArabic: "المدينة المنورة", nameEnglish: "Madinah", regionCode: "SA-03", isCapital: true, population: 1512724 },
      { nameArabic: "الدمام", nameEnglish: "Dammam", regionCode: "SA-04", isCapital: true, population: 1532300 }
    ] as any;

    // Add sample user
    const sampleUser: User = {
      id: "sample-user-1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;
    this.users.set(sampleUser.id, sampleUser);

    // Add sample agency (corporate company) and agent
    const sampleAgency: User = {
      id: "agency-1",
      email: "agency@example.com",
      firstName: "Agency",
      lastName: "Company",
      companyName: "شركة عقارية",
      accountType: "corporate_company" as any,
      isVerified: true as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.users.set(sampleAgency.id, sampleAgency);

    const sampleAgent: User = {
      id: "agent-1",
      email: "agent@example.com",
      firstName: "Khalid",
      lastName: "Saleh",
      accountType: "individual_broker" as any,
      parentCompanyId: sampleAgency.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.users.set(sampleAgent.id, sampleAgent);

    const sampleAgency2: User = {
      id: "agency-2",
      email: "agency2@example.com",
      firstName: "United",
      lastName: "Realty",
      companyName: "شركة المتحدة للعقار",
      accountType: "corporate_company" as any,
      isVerified: false as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.users.set(sampleAgency2.id, sampleAgency2);

    const sampleAgent2: User = {
      id: "agent-2",
      email: "agent2@example.com",
      firstName: "Fahad",
      lastName: "Ali",
      accountType: "individual_broker" as any,
      parentCompanyId: sampleAgency2.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.users.set(sampleAgent2.id, sampleAgent2);

    // Add sample leads
    const sampleLeads: any[] = [
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

    sampleLeads.forEach(lead => this.leads.set(lead.id, lead as Lead));

    // Add sample properties (multiple cities with geo spread and photos)
    const cities = [
      { name: "الرياض", lat: 24.7136, lng: 46.6753 },
      { name: "جدة", lat: 21.4894, lng: 39.2460 },
      { name: "الدمام", lat: 26.4207, lng: 50.0888 },
      { name: "مكة", lat: 21.3891, lng: 39.8579 },
      { name: "الخبر", lat: 26.2172, lng: 50.1971 }
    ];
    const types = ["شقة", "فيلا", "دوبلكس", "تاون هاوس", "استوديو"];
    const photos: string[][] = [
      [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        "https://images.unsplash.com/photo-1615873968403-89e068629265"
      ],
      [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "https://images.unsplash.com/photo-1594736797933-d0f06b755b8f",
        "https://images.unsplash.com/photo-1574362848149-11496d93a7c7"
      ],
      [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1593696140826-c58b021acf8b"
      ]
    ];

    let pid = 1;
    for (let i = 0; i < 24; i++) {
      const city = cities[i % cities.length];
      const t = types[i % types.length];
      const photoSet = photos[i % photos.length];
      const jitterLat = city.lat + (Math.random() - 0.5) * 0.1;
      const jitterLng = city.lng + (Math.random() - 0.5) * 0.1;
      const price = (200000 + Math.round(Math.random() * 1800000)).toString();
      const bedrooms = t === "شقة" || t === "دوبلكس" ? 2 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 4);
      const bathrooms = t === "استوديو" ? 1 : 2 + Math.floor(Math.random() * 2);
      const squareFeet = 120 + Math.floor(Math.random() * 380);

      const useSecond = Math.random() > 0.5;
      const p: any = {
        id: `property-${pid++}`,
        title: `${t} مميزة في ${city.name}`,
        address: `شارع ${Math.floor(Math.random() * 100)}، ${city.name}`,
        city: city.name,
        state: city.name,
        zipCode: "12345",
        price,
        propertyCategory: "سكني" as any,
        propertyType: t as any,
        description: "عقار بموقع مميز وتشطيبات راقية",
        bedrooms,
        bathrooms: bathrooms as any,
        squareFeet,
        latitude: jitterLat as any,
        longitude: jitterLng as any,
        photoUrls: photoSet as any,
        features: ["موقف سيارات", "مصعد", "تكييف"] as any,
        status: "active" as any,
        isPubliclyVisible: true as any,
        isFeatured: Math.random() > 0.7 as any,
        listingType: "sale" as any,
        availableFrom: new Date() as any,
        ownerType: "broker" as any,
        ownerId: useSecond ? "agent-2" : "agent-1",
        companyId: (useSecond ? "agency-2" : "agency-1") as any,
        tenantId: "tenant-1",
        createdBy: "agent-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.properties.set(p.id, p as Property);
    }

    // Add sample deals
    const sampleDeals: any[] = [
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
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleDeals.forEach(deal => this.deals.set(deal.id, deal as Deal));

    // Add sample activities
    const sampleActivities: any[] = [
      {
        id: "activity-1",
        leadId: "lead-1",
        activityType: "call",
        description: "اتصال متابعة مع العميل",
        scheduledDate: new Date(),
        completed: false,
        tenantId: "tenant-1",
        createdAt: new Date()
      }
    ];

    sampleActivities.forEach(activity => this.activities.set(activity.id, activity as Activity));

    // Add sample messages
    const sampleMessages: any[] = [
      {
        id: "message-1",
        leadId: "lead-1",
        messageType: "whatsapp",
        phoneNumber: "966501234567",
        message: "مرحباً أحمد، نود متابعة اهتمامك بالشقة في الرياض",
        status: "sent",
        sentAt: new Date(),
        tenantId: "tenant-1",
        createdAt: new Date()
      }
    ];

    sampleMessages.forEach(message => this.messages.set(message.id, message as Message));
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
    } as any;
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
    } as any;
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
    const lead: any = {
      ...insertLead,
      id,
      tenantId,
      ownerId: (insertLead as any).ownerId ?? userId,
      createdBy: (insertLead as any).createdBy ?? userId,
      phone: insertLead.phone ?? null,
      city: insertLead.city ?? null,
      age: insertLead.age ?? null,
      maritalStatus: insertLead.maritalStatus ?? null,
      numberOfDependents: insertLead.numberOfDependents ?? 0,
      leadSource: insertLead.leadSource ?? 'website',
      interestType: insertLead.interestType ?? 'buying',
      budgetRange: insertLead.budgetRange ?? null,
      preferredPropertyTypes: (insertLead as any).preferredPropertyTypes ?? null,
      preferredLocations: (insertLead as any).preferredLocations ?? null,
      status: insertLead.status ?? "new",
      notes: insertLead.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(id, lead as Lead);
    return lead as Lead;
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
    const property: any = {
      ...insertProperty,
      id,
      tenantId,
      title: insertProperty.title,
      address: insertProperty.address,
      city: insertProperty.city,
      state: (insertProperty as any).state ?? insertProperty.city ?? 'الرياض',
      zipCode: (insertProperty as any).zipCode ?? '00000',
      description: insertProperty.description ?? null,
      propertyCategory: (insertProperty as any).propertyCategory ?? 'سكني',
      propertyType: insertProperty.propertyType ?? 'شقة',
      bedrooms: insertProperty.bedrooms ?? null,
      bathrooms: insertProperty.bathrooms ?? null,
      livingRooms: (insertProperty as any).livingRooms ?? null,
      squareFeet: insertProperty.squareFeet ?? null,
      latitude: insertProperty.latitude ?? null,
      longitude: insertProperty.longitude ?? null,
      photoUrls: insertProperty.photoUrls ?? null,
      features: insertProperty.features ?? null,
      status: insertProperty.status ?? "active",
      isPubliclyVisible: (insertProperty as any).isPubliclyVisible ?? true,
      isFeatured: (insertProperty as any).isFeatured ?? false,
      listingType: (insertProperty as any).listingType ?? 'sale',
      ownerType: (insertProperty as any).ownerType ?? 'broker',
      ownerId: (insertProperty as any).ownerId ?? userId,
      companyId: (insertProperty as any).companyId ?? null,
      viewCount: (insertProperty as any).viewCount ?? 0,
      inquiryCount: (insertProperty as any).inquiryCount ?? 0,
      createdBy: (insertProperty as any).createdBy ?? userId,
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(id, property as Property);
    return property as Property;
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
      tenantId,
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
      tenantId,
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
      tenantId,
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

  // Favorites (Saved Properties)
  async addFavorite(customerId: string, propertyId: string): Promise<SavedProperty> {
    const s = this.favorites.get(customerId) || new Set<string>();
    s.add(propertyId);
    this.favorites.set(customerId, s);
    return {
      id: randomUUID(),
      customerId,
      propertyId,
      notes: null,
      createdAt: new Date(),
    } as SavedProperty;
  }

  async removeFavorite(customerId: string, propertyId: string): Promise<boolean> {
    const s = this.favorites.get(customerId);
    if (!s) return false;
    const existed = s.delete(propertyId);
    if (s.size === 0) this.favorites.delete(customerId);
    return existed;
  }

  async getFavoriteProperties(customerId: string): Promise<Property[]> {
    const set = this.favorites.get(customerId) || new Set<string>();
    const ids = new Set(set);
    return Array.from(this.properties.values()).filter(p => ids.has(p.id));
  }

  // Property Inquiries
  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const rec: PropertyInquiry = {
      ...(inquiry as any),
      id: randomUUID(),
      respondedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PropertyInquiry;
    this.inquiries.push(rec);
    return rec;
  }

  // Saved Searches (Property Alerts)
  async getSavedSearches(customerId: string): Promise<PropertyAlert[]> {
    return this.alerts.filter(a => a.customerId === customerId);
  }

  async createSavedSearch(alert: InsertPropertyAlert): Promise<PropertyAlert> {
    const rec: PropertyAlert = {
      ...(alert as any),
      id: randomUUID(),
      isActive: alert.isActive ?? true,
      lastSent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PropertyAlert;
    this.alerts.push(rec);
    return rec;
  }

  async deleteSavedSearch(id: string, customerId: string): Promise<boolean> {
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(a => !(a.id === id && a.customerId === customerId));
    return this.alerts.length !== before;
  }

  // Reports
  async createReport(report: InsertReport, reporterId?: string | null): Promise<Report> {
    const rec: Report = {
      ...(report as any),
      id: randomUUID(),
      reporterId: reporterId || report.reporterId || null,
      status: 'open',
      createdAt: new Date(),
      resolvedAt: null,
    } as Report;
    this.memReports.push(rec);
    return rec;
  }

  async listReports(status?: string): Promise<Report[]> {
    return this.memReports.filter(r => (status ? r.status === status : true));
  }

  async resolveReport(id: string, resolutionNote?: string): Promise<Report | undefined> {
    const r = this.memReports.find(x => x.id === id);
    if (!r) return undefined;
    (r as any).status = 'resolved';
    (r as any).resolutionNote = resolutionNote || null;
    (r as any).resolvedAt = new Date();
    return r;
  }

  // Real Estate Requests
  async createRealEstateRequest(req: InsertRealEstateRequest): Promise<RealEstateRequest> {
    const rec: RealEstateRequest = {
      ...(req as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RealEstateRequest;
    this.realEstateRequests.push(rec);
    return rec;
  }

  async listRealEstateRequests(): Promise<RealEstateRequest[]> {
    return this.realEstateRequests.slice().sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }

  async updateRealEstateRequestStatus(id: string, status: string): Promise<RealEstateRequest | undefined> {
    const idx = this.realEstateRequests.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...(this.realEstateRequests[idx] as any), status, updatedAt: new Date() } as RealEstateRequest;
    this.realEstateRequests[idx] = updated;
    return updated;
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
      canManageRoles: permissions.canManageRoles || false,
      canViewLeads: permissions.canViewLeads || true,
      canCreateEditDeleteLeads: permissions.canCreateEditDeleteLeads || true,
      canExportData: permissions.canExportData || false,
      canManageCampaigns: permissions.canManageCampaigns || false,
      canManageIntegrations: permissions.canManageIntegrations || false,
      canManageApiKeys: permissions.canManageApiKeys || false,
      canViewReports: permissions.canViewReports || false,
      canViewAuditLogs: permissions.canViewAuditLogs || false,
      canCreateSupportTickets: permissions.canCreateSupportTickets || true,
      canImpersonateUsers: permissions.canImpersonateUsers || false,
      canWipeCompanyData: permissions.canWipeCompanyData || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return userPermissions;
  }

  async updateUserPermissions(userId: string, permissions: Partial<InsertUserPermissions>): Promise<UserPermissions | undefined> {
    // Basic implementation for MemStorage
    return undefined;
  }

  // Agencies & Agents
  async listAgencies(): Promise<User[]> {
    return Array.from(this.users.values()).filter((u: any) => u.accountType === 'corporate_company');
  }
  async getAgency(id: string): Promise<User | undefined> {
    const u = this.users.get(id);
    return u && (u as any).accountType === 'corporate_company' ? u : undefined;
  }
  async listAgencyAgents(agencyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((u: any) => u.parentCompanyId === agencyId);
    
  }
  async getAgencyListings(agencyId: string): Promise<Property[]> {
    return Array.from(this.properties.values()).filter((p: any) => p.companyId === agencyId);
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
          ...userData,
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
    const whereExpr = tenantId
      ? and(eq(leads.id, id), eq(leads.tenantId, tenantId))
      : eq(leads.id, id);
    const [lead] = await db.select().from(leads).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(leads.id, id), eq(leads.tenantId, tenantId))
      : eq(leads.id, id);
    const [lead] = await db
      .update(leads)
      .set({ ...leadUpdate, updatedAt: new Date() })
      .where(whereExpr)
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: string, tenantId?: string): Promise<boolean> {
    const whereExpr = tenantId
      ? and(eq(leads.id, id), eq(leads.tenantId, tenantId))
      : eq(leads.id, id);
    const result = await db.delete(leads).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(properties.id, id), eq(properties.tenantId, tenantId))
      : eq(properties.id, id);
    const [property] = await db.select().from(properties).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(properties.id, id), eq(properties.tenantId, tenantId))
      : eq(properties.id, id);
    const [property] = await db
      .update(properties)
      .set({ ...propertyUpdate, updatedAt: new Date() })
      .where(whereExpr)
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: string, tenantId?: string): Promise<boolean> {
    const whereExpr = tenantId
      ? and(eq(properties.id, id), eq(properties.tenantId, tenantId))
      : eq(properties.id, id);
    const result = await db.delete(properties).where(whereExpr);
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

  // Favorites (Saved Properties)
  async addFavorite(customerId: string, propertyId: string): Promise<SavedProperty> {
    const [row] = await db
      .insert(savedProperties)
      .values({ customerId, propertyId })
      .returning();
    return row;
  }

  async removeFavorite(customerId: string, propertyId: string): Promise<boolean> {
    const result = await db
      .delete(savedProperties)
      .where(and(eq(savedProperties.customerId, customerId), eq(savedProperties.propertyId, propertyId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getFavoriteProperties(customerId: string): Promise<Property[]> {
    const favs = await db.select().from(savedProperties).where(eq(savedProperties.customerId, customerId));
    const ids = favs.map(f => f.propertyId);
    if (ids.length === 0) return [];
    return await db.select().from(properties).where(inArray(properties.id, ids));
  }

  // Property Inquiries
  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const [row] = await db.insert(propertyInquiries).values(inquiry).returning();
    return row;
  }

  // Saved Searches (Property Alerts)
  async getSavedSearches(customerId: string): Promise<PropertyAlert[]> {
    return await db.select().from(propertyAlerts).where(eq(propertyAlerts.customerId, customerId));
  }

  async createSavedSearch(alert: InsertPropertyAlert): Promise<PropertyAlert> {
    const [row] = await db.insert(propertyAlerts).values(alert).returning();
    return row;
  }

  async deleteSavedSearch(id: string, customerId: string): Promise<boolean> {
    const result = await db
      .delete(propertyAlerts)
      .where(and(eq(propertyAlerts.id, id), eq(propertyAlerts.customerId, customerId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Reports
  async createReport(report: InsertReport, reporterId?: string | null): Promise<Report> {
    const [row] = await db
      .insert(reports)
      .values({ ...report, reporterId: reporterId ?? report.reporterId })
      .returning();
    return row;
  }

  async listReports(status?: string): Promise<Report[]> {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status));
    }
    return await db.select().from(reports);
  }

  async resolveReport(id: string, resolutionNote?: string): Promise<Report | undefined> {
    const [row] = await db
      .update(reports)
      .set({ status: 'resolved', resolutionNote: resolutionNote ?? null, resolvedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return row || undefined;
  }

  // Real Estate Requests
  async createRealEstateRequest(req: InsertRealEstateRequest): Promise<RealEstateRequest> {
    const [row] = await db
      .insert(realEstateRequests)
      .values(req)
      .returning();
    return row;
  }

  async listRealEstateRequests(): Promise<RealEstateRequest[]> {
    return await db.select().from(realEstateRequests).orderBy(realEstateRequests.createdAt);
  }

  async updateRealEstateRequestStatus(id: string, status: string): Promise<RealEstateRequest | undefined> {
    const [row] = await db
      .update(realEstateRequests)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(realEstateRequests.id, id))
      .returning();
    return row || undefined;
  }

  // Agencies & Agents
  async listAgencies(): Promise<User[]> {
    // @ts-ignore accountType field exists in schema
    return await db.select().from(users).where(eq((users as any).accountType, 'corporate_company'));
  }
  async getAgency(id: string): Promise<User | undefined> {
    // @ts-ignore accountType field exists in schema
    const [row] = await db.select().from(users).where(and(eq(users.id, id), eq((users as any).accountType, 'corporate_company')));
    return row || undefined;
  }
  async listAgencyAgents(agencyId: string): Promise<User[]> {
    // @ts-ignore parentCompanyId field exists in schema
    return await db.select().from(users).where(eq((users as any).parentCompanyId, agencyId));
  }
  async getAgencyListings(agencyId: string): Promise<Property[]> {
    // @ts-ignore companyId field exists in schema
    return await db.select().from(properties).where(eq((properties as any).companyId, agencyId));
  }

  // Multi-tenant Deal methods
  async getAllDeals(tenantId?: string): Promise<Deal[]> {
    if (tenantId) {
      return await db.select().from(deals).where(eq(deals.tenantId, tenantId)).orderBy(deals.createdAt);
    }
    return await db.select().from(deals).orderBy(deals.createdAt);
  }

  async getDeal(id: string, tenantId?: string): Promise<Deal | undefined> {
    const whereExpr = tenantId
      ? and(eq(deals.id, id), eq(deals.tenantId, tenantId))
      : eq(deals.id, id);
    const [deal] = await db.select().from(deals).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(deals.id, id), eq(deals.tenantId, tenantId))
      : eq(deals.id, id);
    const [deal] = await db
      .update(deals)
      .set({ ...dealUpdate, updatedAt: new Date() })
      .where(whereExpr)
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: string, tenantId?: string): Promise<boolean> {
    const whereExpr = tenantId
      ? and(eq(deals.id, id), eq(deals.tenantId, tenantId))
      : eq(deals.id, id);
    const result = await db.delete(deals).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(activities.leadId, leadId), eq(activities.tenantId, tenantId))
      : eq(activities.leadId, leadId);
    return await db.select().from(activities).where(whereExpr).orderBy(activities.createdAt);
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
    const whereExpr = tenantId
      ? and(eq(activities.id, id), eq(activities.tenantId, tenantId))
      : eq(activities.id, id);
    const [activity] = await db
      .update(activities)
      .set(activityUpdate)
      .where(whereExpr)
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string, tenantId?: string): Promise<boolean> {
    const whereExpr = tenantId
      ? and(eq(activities.id, id), eq(activities.tenantId, tenantId))
      : eq(activities.id, id);
    const result = await db.delete(activities).where(whereExpr);
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
    const whereExpr = tenantId
      ? and(eq(messages.leadId, leadId), eq(messages.tenantId, tenantId))
      : eq(messages.leadId, leadId);
    return await db.select().from(messages).where(whereExpr).orderBy(messages.createdAt);
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
    const whereExpr = tenantId
      ? and(eq(messages.id, id), eq(messages.tenantId, tenantId))
      : eq(messages.id, id);
    const [message] = await db
      .update(messages)
      .set({
        status,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(whereExpr)
      .returning();
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
    for (const key of Array.from(this.cache.keys())) {
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

  // Favorites (Saved Properties)
  async addFavorite(customerId: string, propertyId: string): Promise<SavedProperty> {
    const result = await this.dbStorage.addFavorite(customerId, propertyId);
    this.invalidateCache('getFavoriteProperties');
    return result;
  }

  async removeFavorite(customerId: string, propertyId: string): Promise<boolean> {
    const result = await this.dbStorage.removeFavorite(customerId, propertyId);
    this.invalidateCache('getFavoriteProperties');
    return result;
  }

  async getFavoriteProperties(customerId: string): Promise<Property[]> {
    const cacheKey = this.getCacheKey('getFavoriteProperties', customerId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getFavoriteProperties(customerId));
  }

  // Property Inquiries
  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const result = await this.dbStorage.createPropertyInquiry(inquiry);
    return result;
  }

  // Saved Searches (Property Alerts)
  async getSavedSearches(customerId: string): Promise<PropertyAlert[]> {
    const cacheKey = this.getCacheKey('getSavedSearches', customerId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getSavedSearches(customerId));
  }

  async createSavedSearch(alert: InsertPropertyAlert): Promise<PropertyAlert> {
    const result = await this.dbStorage.createSavedSearch(alert);
    this.invalidateCache('getSavedSearches');
    return result;
  }

  async deleteSavedSearch(id: string, customerId: string): Promise<boolean> {
    const result = await this.dbStorage.deleteSavedSearch(id, customerId);
    this.invalidateCache('getSavedSearches');
    return result;
  }

  // Reports
  async createReport(report: InsertReport, reporterId?: string | null): Promise<Report> {
    const result = await this.dbStorage.createReport(report, reporterId ?? null);
    this.invalidateCache('listReports');
    return result;
  }

  async listReports(status?: string): Promise<Report[]> {
    const cacheKey = this.getCacheKey('listReports', status ?? 'all');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.listReports(status));
  }

  async resolveReport(id: string, resolutionNote?: string): Promise<Report | undefined> {
    const result = await this.dbStorage.resolveReport(id, resolutionNote);
    this.invalidateCache('listReports');
    return result;
  }

  // Agencies & Agents
  async listAgencies(): Promise<User[]> {
    const cacheKey = this.getCacheKey('listAgencies');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.listAgencies());
  }

  // Real Estate Requests (cached)
  async createRealEstateRequest(req: InsertRealEstateRequest): Promise<RealEstateRequest> {
    const result = await this.dbStorage.createRealEstateRequest(req);
    this.invalidateCache('listRealEstateRequests');
    return result;
  }

  async listRealEstateRequests(): Promise<RealEstateRequest[]> {
    const cacheKey = this.getCacheKey('listRealEstateRequests');
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.listRealEstateRequests());
  }

  async updateRealEstateRequestStatus(id: string, status: string): Promise<RealEstateRequest | undefined> {
    const result = await this.dbStorage.updateRealEstateRequestStatus(id, status);
    this.invalidateCache('listRealEstateRequests');
    return result;
  }

  async getAgency(id: string): Promise<User | undefined> {
    const cacheKey = this.getCacheKey('getAgency', id);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAgency(id));
  }

  async listAgencyAgents(agencyId: string): Promise<User[]> {
    const cacheKey = this.getCacheKey('listAgencyAgents', agencyId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.listAgencyAgents(agencyId));
  }

  async getAgencyListings(agencyId: string): Promise<Property[]> {
    const cacheKey = this.getCacheKey('getAgencyListings', agencyId);
    return this.getFromCacheOrDb(cacheKey, () => this.dbStorage.getAgencyListings(agencyId));
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
    // For development with placeholder DB, fall back to in-memory storage so the app is functional
    try {
      console.log("🧠 Falling back to in-memory storage (MemStorage) for development");
      return new MemStorage();
    } catch (error) {
      throw new Error("Failed to initialize in-memory storage.");
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
  async seedSaudiCities() { return (await getStorage()).seedSaudiCities(); },
  // Favorites
  async addFavorite(customerId: string, propertyId: string) { return (await getStorage()).addFavorite(customerId, propertyId); },
  async removeFavorite(customerId: string, propertyId: string) { return (await getStorage()).removeFavorite(customerId, propertyId); },
  async getFavoriteProperties(customerId: string) { return (await getStorage()).getFavoriteProperties(customerId); },
  // Inquiries
  async createPropertyInquiry(inquiry: InsertPropertyInquiry) { return (await getStorage()).createPropertyInquiry(inquiry); },
  // Saved Searches
  async getSavedSearches(customerId: string) { return (await getStorage()).getSavedSearches(customerId); },
  async createSavedSearch(alert: InsertPropertyAlert) { return (await getStorage()).createSavedSearch(alert); },
  async deleteSavedSearch(id: string, customerId: string) { return (await getStorage()).deleteSavedSearch(id, customerId); },
  // Reports
  async createReport(report: InsertReport, reporterId?: string | null) { return (await getStorage()).createReport(report, reporterId); },
  async listReports(status?: string) { return (await getStorage()).listReports(status); },
  async resolveReport(id: string, note?: string) { return (await getStorage()).resolveReport(id, note); },
  // Real Estate Requests
  async createRealEstateRequest(req: InsertRealEstateRequest) { return (await getStorage()).createRealEstateRequest(req); },
  async listRealEstateRequests() { return (await getStorage()).listRealEstateRequests(); },
  async updateRealEstateRequestStatus(id: string, status: string) { return (await getStorage()).updateRealEstateRequestStatus(id, status); },
  // Agencies
  async listAgencies() { return (await getStorage()).listAgencies(); },
  async getAgency(id: string) { return (await getStorage()).getAgency(id); },
  async listAgencyAgents(agencyId: string) { return (await getStorage()).listAgencyAgents(agencyId); },
  async getAgencyListings(agencyId: string) { return (await getStorage()).getAgencyListings(agencyId); },
};
