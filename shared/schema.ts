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

// User storage table for Replit Auth with Role-Based Access Control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Access Level System
  userLevel: integer("user_level").notNull().default(3), // 1: Platform Admin, 2: Account Owner, 3: Sub-Account
  accountOwnerId: varchar("account_owner_id"), // Reference to account owner for sub-accounts
  companyName: varchar("company_name"), // Company/Account name for account owners
  isActive: boolean("is_active").notNull().default(true),
  // Billing and subscription (for account owners)
  subscriptionStatus: varchar("subscription_status").default("trial"), // trial, active, suspended, cancelled
  subscriptionTier: varchar("subscription_tier").default("basic"), // basic, premium, enterprise
  maxSeats: integer("max_seats").default(10), // Maximum sub-accounts allowed
  usedSeats: integer("used_seats").default(0), // Current sub-accounts count
  // Tenant isolation
  tenantId: varchar("tenant_id").default(sql`gen_random_uuid()`), // For data isolation between accounts
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
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"), // Customer's city
  age: integer("age"), // Customer's age
  maritalStatus: text("marital_status"), // single, married, divorced, widowed
  numberOfDependents: integer("number_of_dependents").default(0), // Number of children/dependents
  leadSource: text("lead_source"),
  interestType: text("interest_type"), // buying, selling
  budgetRange: text("budget_range"),
  status: text("status").notNull().default("new"), // new, qualified, showing, negotiation, closed, lost
  notes: text("notes"),
  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdBy: varchar("created_by").notNull().default(sql`gen_random_uuid()`), // Track who created this lead
  assignedTo: varchar("assigned_to").references(() => users.id), // Sub-account user assigned to this lead
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
  propertyType: text("property_type").notNull(), // house, condo, apartment, commercial
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  status: text("status").notNull().default("active"), // active, pending, sold, withdrawn
  photoUrls: text("photo_urls").array(), // Support up to 10 photos per property
  features: text("features").array(),
  // Tenant isolation for multi-tenant access
  tenantId: varchar("tenant_id").notNull().default(sql`gen_random_uuid()`), // Links to user's tenantId for data isolation
  createdBy: varchar("created_by").notNull().default(sql`gen_random_uuid()`), // Track who created this property
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

// Insert schemas  
export const insertUserSchema = createInsertSchema(users);
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  // Self-referencing relation for account owners and sub-accounts
  accountOwner: one(users, {
    fields: [users.accountOwnerId],
    references: [users.id],
    relationName: "AccountHierarchy"
  }),
  subAccounts: many(users, {
    relationName: "AccountHierarchy"
  }),
  // User permissions
  permissions: one(userPermissions, {
    fields: [users.id],
    references: [userPermissions.userId],
  }),
  // Created entities
  createdLeads: many(leads, {
    relationName: "LeadCreatedBy"
  }),
  assignedLeads: many(leads, {
    relationName: "LeadAssignedTo"
  }),
  createdProperties: many(properties, {
    relationName: "PropertyCreatedBy"
  }),
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
  createdBy: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: "LeadCreatedBy"
  }),
  assignedTo: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: "LeadAssignedTo"
  }),
}));

export const propertiesRelations = relations(properties, ({ many, one }) => ({
  deals: many(deals),
  createdBy: one(users, {
    fields: [properties.createdBy],
    references: [users.id],
    relationName: "PropertyCreatedBy"
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
