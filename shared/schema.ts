import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, index, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with comprehensive account hierarchy
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),

  // Account Type System
  accountType: varchar("account_type").notNull().default("customer"), // customer, individual_broker, corporate_company, platform_admin

  // For Individual Brokers and Corporate Companies
  licenseNumber: varchar("license_number"), // Real estate license number
  companyName: varchar("company_name"), // Company name for corporate accounts
  companyAddress: text("company_address"),

  // Corporate Company Hierarchy
  parentCompanyId: varchar("parent_company_id"), // Reference to parent company for employees
  isCompanyOwner: boolean("is_company_owner").default(false), // True for company owners

  // Account Limits and Status
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false), // Email/phone verification

  // Subscription and Billing (for brokers and companies)
  subscriptionStatus: varchar("subscription_status").default("trial"), // trial, active, suspended, cancelled
  subscriptionTier: varchar("subscription_tier").default("basic"), // basic, premium, enterprise

  // Limits for Individual Brokers
  maxActiveListings: integer("max_active_listings").default(30), // Max 30 for individual brokers
  currentActiveListings: integer("current_active_listings").default(0),
  maxCustomers: integer("max_customers").default(100), // Max 100 for individual brokers
  currentCustomers: integer("current_customers").default(0),

  // Limits for Corporate Companies
  maxEmployees: integer("max_employees").default(0), // For corporate companies
  currentEmployees: integer("current_employees").default(0),
  maxListingsPerEmployee: integer("max_listings_per_employee").default(100), // Max 100 per employee
  maxCustomersPerEmployee: integer("max_customers_per_employee").default(500), // Max 500 per employee

  // Tenant isolation
  tenantId: varchar("tenant_id").default(sql`gen_random_uuid()`), // For data isolation

  // Customer-specific fields
  preferredContactMethod: varchar("preferred_contact_method").default("email"), // email, phone, whatsapp
  interestedPropertyTypes: text("interested_property_types").array(), // For customers
  budgetRange: varchar("budget_range"), // For customers
  preferredLocations: text("preferred_locations").array(), // For customers

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Permissions Table - Fine-grained permissions per user
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  // Company Settings & Branding
  canManageCompanySettings: boolean("can_manage_company_settings").default(false),
  canManageBilling: boolean("can_manage_billing").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  // Role & Permission Management
  canManageRoles: boolean("can_manage_roles").default(false),
  // Data Access
  canViewLeads: boolean("can_view_leads").default(true),
  canCreateEditDeleteLeads: boolean("can_create_edit_delete_leads").default(true),
  canExportData: boolean("can_export_data").default(false),
  // Campaigns
  canManageCampaigns: boolean("can_manage_campaigns").default(true),
  // Integrations
  canManageIntegrations: boolean("can_manage_integrations").default(false),
  // API Keys
  canManageApiKeys: boolean("can_manage_api_keys").default(false),
  // Reports & Dashboards
  canViewReports: boolean("can_view_reports").default(true),
  canViewAuditLogs: boolean("can_view_audit_logs").default(false),
  // Support
  canCreateSupportTickets: boolean("can_create_support_tickets").default(true),
  // Impersonation (platform admin only)
  canImpersonateUsers: boolean("can_impersonate_users").default(false),
  // Data Wipe (platform admin only)
  canWipeCompanyData: boolean("can_wipe_company_data").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Customer Information
  customerId: varchar("customer_id").references(() => users.id), // Link to registered customer (optional)
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"), // Customer's city
  age: integer("age"), // Customer's age
  maritalStatus: text("marital_status"), // single, married, divorced, widowed
  numberOfDependents: integer("number_of_dependents").default(0), // Number of children/dependents

  // Lead Details
  leadSource: text("lead_source").notNull().default("website"), // website, referral, social_media, advertisement, walk_in
  sourceDetails: text("source_details"), // Specific details about the source
  interestType: text("interest_type").notNull().default("buying"), // buying, selling, renting
  budgetRange: text("budget_range"),
  preferredPropertyTypes: text("preferred_property_types").array(),
  preferredLocations: text("preferred_locations").array(),
  urgency: text("urgency").default("medium"), // low, medium, high

  // Lead Status and Management
  status: text("status").notNull().default("new"), // new, contacted, qualified, showing, negotiation, closed, lost
  priority: text("priority").default("medium"), // low, medium, high
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),

  // Assignment and Ownership
  ownerId: varchar("owner_id").notNull().references(() => users.id), // Broker/employee who owns this lead
  assignedTo: varchar("assigned_to").references(() => users.id), // Can be assigned to different employee
  companyId: varchar("company_id").references(() => users.id), // For corporate company leads

  // Conversion Tracking
  convertedToCustomer: boolean("converted_to_customer").default(false),
  conversionDate: timestamp("conversion_date"),

  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdBy: varchar("created_by").notNull().references(() => users.id), // Track who created this lead
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // Added for Google Maps integration
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // Added for Google Maps integration
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),

  // Arabic Property Categorization System
  propertyCategory: text("property_category").notNull().default("سكني"), // سكني, ترفيهي/استجمام, تجاري/مكاتب, مستودعات/أراضٍ, عام
  propertyType: text("property_type").notNull().default("شقة"), // شقة, شقة مفروشة, بيت, فيلا, دور, استراحة, شاليه, مخيم, مكتب, محل, عمارة, مستودع, أرض, غرفة, الكل
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),

  // Property Status and Visibility
  status: text("status").notNull().default("active"), // active, pending, sold, withdrawn, draft
  isPubliclyVisible: boolean("is_publicly_visible").notNull().default(true), // Visible to customers on website
  isFeatured: boolean("is_featured").notNull().default(false), // Featured listing

  // Listing Details
  listingType: text("listing_type").notNull().default("sale"), // sale, rent, both
  availableFrom: timestamp("available_from").defaultNow(),

  // Media and Features
  photoUrls: text("photo_urls").array(), // Support up to 10 photos per property
  virtualTourUrl: text("virtual_tour_url"), // 360 tour or video link
  features: text("features").array(),

  // Contact and Ownership
  ownerType: text("owner_type").notNull().default("broker"), // broker, individual_broker, corporate_employee
  ownerId: varchar("owner_id").notNull().references(() => users.id), // Property owner/listing agent
  companyId: varchar("company_id").references(() => users.id), // For corporate employees

  // Analytics
  viewCount: integer("view_count").default(0),
  inquiryCount: integer("inquiry_count").default(0),

  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdBy: varchar("created_by").notNull().references(() => users.id), // Track who created this property
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  propertyId: varchar("property_id").references(() => properties.id),
  stage: text("stage").notNull().default("lead"), // lead, qualified, showing, negotiation, closed
  dealValue: decimal("deal_value", { precision: 12, scale: 2 }),
  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  commission: decimal("commission", { precision: 8, scale: 2 }),
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  activityType: text("activity_type").notNull(), // call, email, meeting, note, showing
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date"),
  completed: boolean("completed").notNull().default(false),
  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  messageType: text("message_type").notNull(), // whatsapp, sms, email
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Property Inquiries - When customers contact brokers about properties
export const propertyInquiries = pgTable("property_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  customerId: varchar("customer_id").references(() => users.id), // Registered customer (optional)

  // Customer Information (for non-registered customers)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),

  // Inquiry Details
  inquiryType: text("inquiry_type").notNull().default("general"), // general, viewing_request, price_inquiry, availability
  message: text("message"),
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, whatsapp
  preferredContactTime: text("preferred_contact_time"), // morning, afternoon, evening, anytime

  // Status and Response
  status: text("status").notNull().default("new"), // new, contacted, scheduled, closed
  brokerResponse: text("broker_response"),
  respondedAt: timestamp("responded_at"),
  respondedBy: varchar("responded_by").references(() => users.id),

  // Scheduling (for viewing requests)
  requestedViewingDate: timestamp("requested_viewing_date"),
  scheduledViewingDate: timestamp("scheduled_viewing_date"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Customer Saved Properties - Wishlist/Favorites
export const savedProperties = pgTable("saved_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  notes: text("notes"), // Customer's private notes about the property
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Property Search Alerts - Customers can set up alerts for new properties
export const propertyAlerts = pgTable("property_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),

  // Search Criteria
  alertName: text("alert_name").notNull(),
  propertyTypes: text("property_types").array(), // Array of property types
  cities: text("cities").array(), // Array of cities
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  minBedrooms: integer("min_bedrooms"),
  maxBedrooms: integer("max_bedrooms"),

  // Alert Settings
  isActive: boolean("is_active").notNull().default(true),
  frequency: text("frequency").notNull().default("immediate"), // immediate, daily, weekly
  lastSent: timestamp("last_sent"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Saudi Regions - Official 13 administrative regions
export const saudiRegions = pgTable("saudi_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameArabic: text("name_arabic").notNull(),
  nameEnglish: text("name_english").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Saudi Cities - All major cities linked to regions
export const saudiCities = pgTable("saudi_cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameArabic: text("name_arabic").notNull(),
  nameEnglish: text("name_english").notNull(),
  regionCode: varchar("region_code", { length: 10 }).notNull().references(() => saudiRegions.code),
  isCapital: boolean("is_capital").notNull().default(false), // Whether it's the capital of the region
  population: integer("population"), // Approximate population
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  phone: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty phone
    // Saudi mobile format: 05XXXXXXXX (9 digits total)
    return /^05\d{7}$/.test(val);
  }, {
    message: "رقم الجوال يجب أن يكون بصيغة 05XXXXXXXX (9 أرقام فقط)"
  })
});
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertSaudiRegionSchema = createInsertSchema(saudiRegions).omit({
  id: true,
  createdAt: true,
});

export const insertSaudiCitySchema = createInsertSchema(saudiCities).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyInquirySchema = createInsertSchema(propertyInquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavedPropertySchema = createInsertSchema(savedProperties).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyAlertSchema = createInsertSchema(propertyAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  // Corporate company hierarchy
  parentCompany: one(users, {
    fields: [users.parentCompanyId],
    references: [users.id],
    relationName: "CompanyHierarchy"
  }),
  employees: many(users, {
    relationName: "CompanyHierarchy"
  }),

  // User permissions
  permissions: one(userPermissions, {
    fields: [users.id],
    references: [userPermissions.userId],
  }),

  // Owned entities
  ownedLeads: many(leads, {
    relationName: "LeadOwner"
  }),
  assignedLeads: many(leads, {
    relationName: "LeadAssignedTo"
  }),
  createdLeads: many(leads, {
    relationName: "LeadCreatedBy"
  }),
  ownedProperties: many(properties, {
    relationName: "PropertyOwner"
  }),
  createdProperties: many(properties, {
    relationName: "PropertyCreatedBy"
  }),

  // Customer relations
  customerLeads: many(leads, {
    relationName: "CustomerLeads"
  }),
  propertyInquiries: many(propertyInquiries, {
    relationName: "CustomerInquiries"
  }),
  savedProperties: many(savedProperties),
  propertyAlerts: many(propertyAlerts),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ many, one }) => ({
  deals: many(deals),
  activities: many(activities),
  messages: many(messages),

  // Customer relationship
  customer: one(users, {
    fields: [leads.customerId],
    references: [users.id],
    relationName: "CustomerLeads"
  }),

  // Ownership and assignment
  owner: one(users, {
    fields: [leads.ownerId],
    references: [users.id],
    relationName: "LeadOwner"
  }),
  assignedTo: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: "LeadAssignedTo"
  }),
  createdBy: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: "LeadCreatedBy"
  }),
  company: one(users, {
    fields: [leads.companyId],
    references: [users.id],
    relationName: "LeadCompany"
  }),
}));

export const propertiesRelations = relations(properties, ({ many, one }) => ({
  deals: many(deals),
  inquiries: many(propertyInquiries),
  savedByCustomers: many(savedProperties),

  // Ownership
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
    relationName: "PropertyOwner"
  }),
  createdBy: one(users, {
    fields: [properties.createdBy],
    references: [users.id],
    relationName: "PropertyCreatedBy"
  }),
  company: one(users, {
    fields: [properties.companyId],
    references: [users.id],
    relationName: "PropertyCompany"
  }),
}));

export const propertyInquiriesRelations = relations(propertyInquiries, ({ one }) => ({
  property: one(properties, {
    fields: [propertyInquiries.propertyId],
    references: [properties.id],
  }),
  customer: one(users, {
    fields: [propertyInquiries.customerId],
    references: [users.id],
    relationName: "CustomerInquiries"
  }),
  respondedBy: one(users, {
    fields: [propertyInquiries.respondedBy],
    references: [users.id],
    relationName: "InquiryResponder"
  }),
}));

export const savedPropertiesRelations = relations(savedProperties, ({ one }) => ({
  customer: one(users, {
    fields: [savedProperties.customerId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [savedProperties.propertyId],
    references: [properties.id],
  }),
}));

export const propertyAlertsRelations = relations(propertyAlerts, ({ one }) => ({
  customer: one(users, {
    fields: [propertyAlerts.customerId],
    references: [users.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  lead: one(leads, {
    fields: [deals.leadId],
    references: [leads.id],
  }),
  property: one(properties, {
    fields: [deals.propertyId],
    references: [properties.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  lead: one(leads, {
    fields: [messages.leadId],
    references: [leads.id],
  }),
}));

export const saudiRegionsRelations = relations(saudiRegions, ({ many }) => ({
  cities: many(saudiCities),
}));

export const saudiCitiesRelations = relations(saudiCities, ({ one }) => ({
  region: one(saudiRegions, {
    fields: [saudiCities.regionCode],
    references: [saudiRegions.code],
  }),
}));

// Insert schemas for user permissions
export const insertUserPermissionsSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UserPermissions = typeof userPermissions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserPermissions = z.infer<typeof insertUserPermissionsSchema>;
// UpsertUser type for Replit Auth compatibility
export type UpsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SaudiRegion = typeof saudiRegions.$inferSelect;
export type InsertSaudiRegion = z.infer<typeof insertSaudiRegionSchema>;
export type SaudiCity = typeof saudiCities.$inferSelect;
export type InsertSaudiCity = z.infer<typeof insertSaudiCitySchema>;
export type PropertyInquiry = typeof propertyInquiries.$inferSelect;
export type InsertPropertyInquiry = z.infer<typeof insertPropertyInquirySchema>;
export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;
export type PropertyAlert = typeof propertyAlerts.$inferSelect;
export type InsertPropertyAlert = z.infer<typeof insertPropertyAlertSchema>;
