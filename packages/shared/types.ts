/**
 * types.ts - Shared TypeScript Types
 * 
 * Location: packages/shared/ → types.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Shared TypeScript types for the real estate CRM platform. Provides:
 * - User and authentication types
 * - Property and listing types
 * - Lead and deal management types
 * - Prisma-compatible types (replaces Drizzle-based schema types)
 * 
 * Related Files:
 * - Used throughout both frontend and backend applications
 * - apps/api/prismaClient.ts - Prisma client uses these types
 * - apps/web/src/lib/queryClient.ts - API client uses these types
 * 
 * Key Features:
 * - User and authentication types
 * - Property and listing types
 * - Lead and deal management types
 * - Organization and agent types
 * - Activity and message types
 * 
 * Dependencies: zod for schema validation
 * Routes affected: All routes that use shared types
 * Pages affected: All pages that use shared types
 */

import { z } from "zod";

// User types
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string; // JSON string of UserRole array
  organizationId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization | null;
  agentProfile?: AgentProfile | null;
  marketingRequests?: MarketingRequest[];
  marketingProposals?: MarketingProposal[];
}

// Organization types
export interface Organization {
  id: string;
  legalName: string;
  tradeName: string;
  licenseNo: string;
  status: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Agent Profile types
export interface AgentProfile {
  id: string;
  userId: string;
  organizationId: string | null;
  licenseNo: string;
  status: string;
  specialties: string; // JSON string
  experience: number;
  languages: string; // JSON string
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Property types
export interface Property {
  id: string;
  agentId: string;
  organizationId: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  district?: string | null;
  type?: string | null;
  propertyType?: string | null;
  category?: string | null;
  propertyCategory?: string | null;
  status: string;
  visibility?: string | null;
  listingType?: string | null;
  ownerType?: string | null;
  ownerId?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | string | null;
  livingRooms?: number | null;
  squareFeet?: number | null;
  areaSqm?: number | null;
  price: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  features?: string[] | string | null;
  photoUrls?: string[] | null;
  photos?: string | null;
  isPubliclyVisible?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  agent?: User;
  organization?: Organization | null;
  listings?: Listing[];
  marketingRequests?: MarketingRequest[];
}

// Listing types
export interface Listing {
  id: string;
  propertyId: string;
  agentId: string;
  organizationId: string | null;
  type: string; // RENT or SALE
  price: number;
  status: string;
  isFeatured: boolean;
  description: string | null;
  availableFrom: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  agent?: User;
  organization?: Organization | null;
}

// Lead types
export interface Lead {
  id: string;
  agentId: string;
  organizationId: string | null;
  customerId?: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source?: string | null;
  leadSource?: string | null;
  status: string;
  city?: string | null;
  age?: number | null;
  maritalStatus?: string | null;
  numberOfDependents?: number | null;
  interestType?: string | null;
  budgetRange?: string | null;
  budget?: number | null;
  preferences?: string | null; // JSON string
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  agent?: User;
  organization?: Organization | null;
}

// Activity types
export interface Activity {
  id: string;
  leadId: string | null;
  agentId: string;
  organizationId: string | null;
  type: string;
  activityType?: string | null;
  title: string;
  description: string | null;
  notes?: string | null;
  scheduledAt: Date | string | null;
  scheduledDate?: Date | string | null;
  completedAt: Date | string | null;
  completed?: boolean | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lead?: Lead | null;
  agent?: User;
  organization?: Organization | null;
}

// Message types
export interface Message {
  id: string;
  leadId: string | null;
  agentId: string;
  organizationId: string | null;
  type: string;
  content: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: Lead | null;
  agent?: User;
  organization?: Organization | null;
}

export const insertMessageSchema = z.object({
  leadId: z.string().min(1, "المعرف مطلوب"),
  content: z.string().min(1, "نص الرسالة مطلوب"),
  direction: z.string().optional(),
  channel: z.string().optional(),
  metadata: z.any().optional(),
}).passthrough();

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const insertLeadSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  source: z.string().default("manual"),
  status: z.string().default("new"),
  city: z.string().optional(),
  age: z.coerce.number().optional(),
  maritalStatus: z.string().optional(),
  numberOfDependents: z.coerce.number().default(0),
  leadSource: z.string().optional(),
  interestType: z.string().optional(),
  budgetRange: z.string().optional(),
  budget: z.coerce.number().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export type InsertLead = z.infer<typeof insertLeadSchema>;

// Deal types
export interface Deal {
  id: string;
  leadId: string | null;
  propertyId: string | null;
  customerId?: string | null;
  agentId: string;
  organizationId: string | null;
  stage: string;
  value: number | null;
  commission: number | null;
  status: string;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: Lead | null;
  property?: Property | null;
  agent?: User;
  customer?: { firstName: string; lastName: string; email?: string; phone?: string } | null;
  organization?: Organization | null;
  dealValue?: number | string | null;
  agreedPrice?: number | string | null;
  expectedCloseDate?: Date | string | null;
  notes?: string | null;
  source?: string | null;
  wonAt?: Date | null;
  lostAt?: Date | null;
}

export type MarketingRequestStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "OPEN"
  | "AWARDED"
  | "CLOSED"
  | "REJECTED";

export type MarketingProposalStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "EXPIRED";

export type MarketingRequestTier = "STANDARD" | "SERIOUS" | "ENTERPRISE";

export interface MarketingRequest {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  requirements?: string | null;
  propertyType: string;
  listingType?: string | null;
  city: string;
  district?: string | null;
  region?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredStartDate?: Date | null;
  preferredEndDate?: Date | null;
  commissionExpectation?: number | null;
  seriousnessTier: MarketingRequestTier;
  status: MarketingRequestStatus;
  moderationNotes?: string | null;
  approvedAt?: Date | null;
  awardedProposalId?: string | null;
  closedAt?: Date | null;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  propertyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  property?: Property | null;
  proposals?: MarketingProposal[];
}

export interface MarketingProposal {
  id: string;
  requestId: string;
  agentId: string;
  message?: string | null;
  commissionRate?: number | null;
  marketingBudget?: number | null;
  estimatedTimeline?: string | null;
  status: MarketingProposalStatus;
  submittedAt: Date;
  decidedAt?: Date | null;
  attachments?: string | null;
  createdAt: Date;
  updatedAt: Date;
  request?: MarketingRequest;
  agent?: User;
}

// Buyer Request types
export interface BuyerRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  budget: number;
  preferences: string; // JSON string
  city: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Claim types
export interface Claim {
  id: string;
  buyerRequestId: string;
  agentId: string;
  organizationId: string | null;
  status: string;
  claimedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buyerRequest?: BuyerRequest;
  agent?: User;
  organization?: Organization | null;
}

// Contact Log types
export interface ContactLog {
  id: string;
  leadId: string | null;
  agentId: string;
  organizationId: string | null;
  type: string;
  content: string;
  outcome: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: Lead | null;
  agent?: User;
  organization?: Organization | null;
}

// Audit Log types
export interface AuditLog {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string; // JSON string
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: User | null;
  organization?: Organization | null;
}

// File Asset types
export interface FileAsset {
  id: string;
  userId: string | null;
  organizationId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User | null;
  organization?: Organization | null;
}

// Seller Submission types
export interface SellerSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyType: string;
  city: string;
  address: string;
  price: number;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',
  CORP_OWNER = 'CORP_OWNER',
  CORP_AGENT = 'CORP_AGENT',
  INDIV_AGENT = 'INDIV_AGENT',
  SELLER = 'SELLER',
  BUYER = 'BUYER'
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL'
}

export enum ListingType {
  RENT = 'RENT',
  SALE = 'SALE'
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL'
}

// Property creation schema & type
export const insertPropertySchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().min(1, "المدينة مطلوبة"),
  state: z.string().optional().default(""),
  zipCode: z.string().optional(),
  latitude: z.union([z.coerce.number(), z.string()]).optional(),
  longitude: z.union([z.coerce.number(), z.string()]).optional(),
  price: z.coerce.number().min(0, "السعر يجب أن يكون أكبر من 0"),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  listingType: z.string().optional(),
  status: z.string().default("active"),
  bedrooms: z.coerce.number().min(0, "عدد الغرف يجب أن يكون أكبر من أو يساوي 0").default(0),
  bathrooms: z.coerce.number().min(0, "عدد الحمامات يجب أن يكون أكبر من أو يساوي 0").default(0),
  livingRooms: z.coerce.number().min(0, "عدد صالات المعيشة يجب أن يكون أكبر من أو يساوي 0").default(0),
  squareFeet: z.coerce.number().min(0, "المساحة يجب أن تكون أكبر من أو يساوي 0").default(0),
  features: z.array(z.string()).default([]),
  photoUrls: z.array(z.string()).default([]),
  agentId: z.string().optional(),
  organizationId: z.string().optional(),
  // Location IDs for region/city/district (mapped from dropdowns)
  regionId: z.coerce.number().optional(),
  cityId: z.coerce.number().optional(),
  districtId: z.coerce.number().optional(),
  district: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
}).passthrough();

export type InsertProperty = z.infer<typeof insertPropertySchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE TYPE DEFINITIONS
// Added: API response types, full entity types, form data types,
// enum types, and utility types for the entire CRM platform.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Utility Types ────────────────────────────────────────────────────────────

/** Make all properties nullable */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/** Deep partial — all nested properties become optional */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Make specific keys required while keeping the rest */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific keys optional while keeping the rest required */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extract only string keys of an object */
export type StringKeys<T> = Extract<keyof T, string>;

/** A timestamped entity base */
export interface Timestamped {
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** An entity that can be soft-deleted */
export interface SoftDeletable extends Timestamped {
  deletedAt: Date | string | null;
  isDeleted: boolean;
}

/** A record with an ID */
export interface Identifiable {
  id: string;
}

/** Combine ID + timestamps (most common base) */
export interface BaseEntity extends Identifiable, Timestamped {}

// ─── API Response Types ───────────────────────────────────────────────────────

/** Standard API success response */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, string[]>;
  statusCode?: number;
}

/** Union type for all API responses */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Paginated request parameters */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Search request parameters */
export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, unknown>;
}

/** Bulk operation result */
export interface BulkOperationResult {
  success: true;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// ─── Full Property Type ───────────────────────────────────────────────────────

/** Complete property with all 30+ fields */
export interface PropertyFull extends BaseEntity {
  agentId: string;
  organizationId: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  region: string | null;
  district: string | null;
  regionId: number | null;
  cityId: number | null;
  districtId: number | null;
  type: string | null;
  propertyType: string | null;
  category: string | null;
  propertyCategory: string | null;
  status: PropertyStatus;
  visibility: PropertyVisibility | null;
  listingType: ListingType | null;
  ownerType: OwnerType | null;
  ownerId: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingRooms: number | null;
  squareFeet: number | null;
  areaSqm: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  parkingSpaces: number | null;
  price: number;
  pricePerSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  features: string[];
  amenities: string[];
  photoUrls: string[];
  videoUrl: string | null;
  virtualTourUrl: string | null;
  isPubliclyVisible: boolean;
  isFeatured: boolean;
  viewCount: number;
  favoriteCount: number;
  moderationStatus: ModerationStatus | null;
  moderationNotes: string | null;
  publishedAt: Date | string | null;
  expiresAt: Date | string | null;
  // Relations
  agent?: User;
  organization?: Organization | null;
  listings?: Listing[];
  marketingRequests?: MarketingRequest[];
}

// ─── Full Lead Type ───────────────────────────────────────────────────────────

/** Complete lead with customer and full relationship data */
export interface LeadFull extends BaseEntity {
  agentId: string;
  organizationId: string | null;
  customerId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: LeadSource | null;
  leadSource: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  city: string | null;
  region: string | null;
  age: number | null;
  maritalStatus: MaritalStatus | null;
  numberOfDependents: number | null;
  interestType: InterestType | null;
  budgetRange: string | null;
  budget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  preferredPropertyType: string | null;
  preferredCity: string | null;
  preferredDistrict: string | null;
  preferredBedrooms: number | null;
  preferences: string | null;
  notes: string | null;
  tags: string[];
  score: number | null;
  lastContactedAt: Date | string | null;
  nextFollowUpAt: Date | string | null;
  convertedAt: Date | string | null;
  lostAt: Date | string | null;
  lostReason: string | null;
  // Relations
  agent?: User;
  customer?: CustomerInfo | null;
  organization?: Organization | null;
  activities?: Activity[];
  deals?: Deal[];
  messages?: Message[];
}

/** Customer info embedded in lead */
export interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  nationalId: string | null;
}

// ─── Full Deal Type ───────────────────────────────────────────────────────────

/** Complete deal with stage history */
export interface DealFull extends BaseEntity {
  leadId: string | null;
  propertyId: string | null;
  customerId: string | null;
  agentId: string;
  organizationId: string | null;
  stage: DealStage;
  status: DealStatus;
  value: number | null;
  dealValue: number | null;
  agreedPrice: number | null;
  commission: number | null;
  commissionAmount: number | null;
  expectedCloseDate: Date | string | null;
  closedAt: Date | string | null;
  wonAt: Date | string | null;
  lostAt: Date | string | null;
  lostReason: string | null;
  notes: string | null;
  source: string | null;
  contractUrl: string | null;
  // Relations
  lead?: Lead | null;
  property?: Property | null;
  customer?: CustomerInfo | null;
  agent?: User;
  organization?: Organization | null;
  stageHistory?: DealStageHistoryEntry[];
}

/** Deal stage change record */
export interface DealStageHistoryEntry {
  id: string;
  dealId: string;
  fromStage: DealStage | null;
  toStage: DealStage;
  changedBy: string;
  changedAt: Date | string;
  notes: string | null;
  durationDays: number | null;
}

// ─── Appointment Type ─────────────────────────────────────────────────────────

export interface Appointment extends BaseEntity {
  agentId: string;
  organizationId: string | null;
  title: string;
  description: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: Date | string;
  endAt: Date | string | null;
  location: string | null;
  leadId: string | null;
  propertyId: string | null;
  dealId: string | null;
  notes: string | null;
  reminderMinutes: number | null;
  cancelReason: string | null;
  completedAt: Date | string | null;
  attendees: string[];
  // Relations
  agent?: User;
  lead?: Lead | null;
  property?: Property | null;
  deal?: Deal | null;
}

// ─── Campaign Type ────────────────────────────────────────────────────────────

export interface Campaign extends BaseEntity {
  organizationId: string | null;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  subject: string | null;
  content: string;
  templateId: string | null;
  scheduledAt: Date | string | null;
  sentAt: Date | string | null;
  completedAt: Date | string | null;
  targetAudience: CampaignTargetAudience | null;
  budget: number | null;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  // Relations
  createdBy?: User;
  organization?: Organization | null;
}

export interface CampaignTargetAudience {
  cities?: string[];
  leadStatuses?: string[];
  propertyTypes?: string[];
  tags?: string[];
  customFilter?: Record<string, unknown>;
}

// ─── Support Ticket Type ──────────────────────────────────────────────────────

export interface SupportTicket extends BaseEntity {
  organizationId: string | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  channel: TicketChannel;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  assignedToId: string | null;
  resolution: string | null;
  internalNotes: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  tags: string[];
  firstResponseAt: Date | string | null;
  resolvedAt: Date | string | null;
  closedAt: Date | string | null;
  // Relations
  assignedTo?: User | null;
  replies?: TicketReply[];
}

export interface TicketReply extends BaseEntity {
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
  user?: User;
}

// ─── Notification Type ────────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | string | null;
  actionUrl: string | null;
}

// ─── Invoice / Billing Types ──────────────────────────────────────────────────

export interface Invoice extends BaseEntity {
  organizationId: string;
  dealId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: Date | string;
  paidAt: Date | string | null;
  notes: string | null;
  items: InvoiceItem[];
  // Relations
  organization?: Organization;
  deal?: Deal | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── Comprehensive Enum Types ─────────────────────────────────────────────────

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  UNQUALIFIED = 'UNQUALIFIED',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum LeadPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  COLD_CALL = 'COLD_CALL',
  WALK_IN = 'WALK_IN',
  ADVERTISING = 'ADVERTISING',
  PARTNER = 'PARTNER',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
  MANUAL = 'MANUAL',
}

export enum DealStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum DealStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PropertyVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ORGANIZATION_ONLY = 'ORGANIZATION_ONLY',
  DRAFT = 'DRAFT',
}

export enum OwnerType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
  GOVERNMENT = 'GOVERNMENT',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  REQUIRES_CHANGES = 'REQUIRES_CHANGES',
}

export enum AppointmentType {
  PROPERTY_VIEWING = 'PROPERTY_VIEWING',
  CLIENT_MEETING = 'CLIENT_MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  PHONE_CALL = 'PHONE_CALL',
  VIDEO_CALL = 'VIDEO_CALL',
  SITE_INSPECTION = 'SITE_INSPECTION',
  CONTRACT_SIGNING = 'CONTRACT_SIGNING',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CUSTOMER = 'WAITING_ON_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketCategory {
  GENERAL = 'GENERAL',
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  ACCOUNT = 'ACCOUNT',
  LISTING = 'LISTING',
  COMPLAINT = 'COMPLAINT',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  OTHER = 'OTHER',
}

export enum TicketChannel {
  WEB = 'WEB',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  DEAL_UPDATE = 'DEAL_UPDATE',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  TICKET_UPDATE = 'TICKET_UPDATE',
  CAMPAIGN_COMPLETE = 'CAMPAIGN_COMPLETE',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum InterestType {
  BUY = 'BUY',
  RENT = 'RENT',
  INVEST = 'INVEST',
  SELL = 'SELL',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
  WHATSAPP = 'WHATSAPP',
  SITE_VISIT = 'SITE_VISIT',
  FOLLOW_UP = 'FOLLOW_UP',
  OTHER = 'OTHER',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── Form Data Types ──────────────────────────────────────────────────────────

/** Lead creation form data */
export interface LeadFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  leadSource?: string;
  status?: string;
  priority?: string;
  city?: string;
  age?: number;
  maritalStatus?: string;
  numberOfDependents?: number;
  interestType?: string;
  budgetRange?: string;
  budget?: number;
  preferredPropertyType?: string;
  preferredCity?: string;
  notes?: string;
  customerId?: string;
}

/** Property creation / edit form data */
export interface PropertyFormData {
  title: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  zipCode?: string;
  region?: string;
  district?: string;
  regionId?: number;
  cityId?: number;
  districtId?: number;
  price: number;
  propertyType: string;
  propertyCategory?: string;
  listingType?: string;
  category?: string;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  squareFeet?: number;
  areaSqm?: number;
  latitude?: number;
  longitude?: number;
  features?: string[];
  photoUrls?: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  ownerId?: string;
  ownerType?: string;
}

/** Deal creation / edit form data */
export interface DealFormData {
  leadId?: string;
  propertyId?: string;
  customerId?: string;
  stage?: string;
  status?: string;
  value?: number;
  dealValue?: number;
  agreedPrice?: number;
  commission?: number;
  expectedCloseDate?: string;
  notes?: string;
  source?: string;
}

/** Appointment form data */
export interface AppointmentFormData {
  title: string;
  description?: string;
  type: string;
  scheduledAt: string;
  endAt?: string;
  location?: string;
  leadId?: string;
  propertyId?: string;
  dealId?: string;
  notes?: string;
  reminderMinutes?: number;
  attendees?: string[];
}

/** Campaign form data */
export interface CampaignFormData {
  name: string;
  description?: string;
  type: string;
  subject?: string;
  content: string;
  templateId?: string;
  scheduledAt?: string;
  targetAudience?: CampaignTargetAudience;
  budget?: number;
  recipientIds?: string[];
}

/** Support ticket form data */
export interface SupportTicketFormData {
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  channel?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  attachments?: string[];
  tags?: string[];
}

/** User profile update form data */
export interface UserProfileFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  language?: 'ar' | 'en';
  timezone?: string;
}

/** Password change form data */
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Organization form data */
export interface OrganizationFormData {
  legalName: string;
  tradeName: string;
  licenseNo: string;
  status?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  region?: string;
  crNumber?: string;
  vatNumber?: string;
  logoUrl?: string;
  maxAgents?: number;
  subscriptionPlan?: string;
}

// ─── Dashboard & Analytics Types ──────────────────────────────────────────────

/** Admin dashboard metrics response */
export interface DashboardMetrics {
  currency: string;
  leads: PeriodMetric;
  listings: PeriodMetric;
  appointments: PeriodMetric;
  dealsWon: PeriodMetric;
  gmv: PeriodMetric & { currency: string };
  invoiceTotal: PeriodMetric & { currency: string };
  cashCollected: PeriodMetric & { currency: string };
}

/** Metric with today / 7-day / 30-day breakdowns */
export interface PeriodMetric {
  today: number;
  last7Days: number;
  last30Days: number;
}

/** System health indicator */
export interface SystemHealthIndicator {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTimeMs: number | null;
  details: string | null;
  lastCheckedAt: string;
}

/** Top agent performance entry */
export interface TopAgentEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dealsWon: number;
  gmv: number;
  conversionRate: number | null;
}

/** Analytics user engagement metrics */
export interface UserEngagementMetrics {
  dau: number;
  mau: number;
  avgSessionTimeSeconds: number;
  bounceRate: number;
  retentionRate7Day: number;
  retentionRate30Day: number;
}

/** Geographic distribution entry */
export interface GeoDistribution {
  city: string;
  region: string | null;
  propertyCount: number;
  listingCount: number;
  dealCount: number;
  revenue: number;
}

/** Revenue breakdown entry */
export interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/** Conversion funnel step */
export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoffRate: number;
}

// ─── WebSocket / Real-Time Types ──────────────────────────────────────────────

export interface RealtimeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  userId?: string;
  organizationId?: string;
}

// ─── Settings Types ───────────────────────────────────────────────────────────

export interface UserSettings {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  leadAssigned: boolean;
  dealUpdate: boolean;
  appointmentReminder: boolean;
  marketingUpdates: boolean;
}

export interface DashboardPreferences {
  defaultDateRange: 'today' | '7d' | '30d' | '90d';
  visibleWidgets: string[];
  metricsOrder: string[];
}

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface ReportConfig {
  id: string;
  name: string;
  type: 'sales' | 'leads' | 'properties' | 'agents' | 'financial' | 'custom';
  dateRange: { start: string; end: string };
  filters: Record<string, unknown>;
  groupBy?: string;
  metrics: string[];
  format: 'table' | 'chart' | 'summary';
}

export interface ReportResult {
  config: ReportConfig;
  generatedAt: string;
  data: Record<string, unknown>[];
  summary: Record<string, number>;
  chartData?: Array<Record<string, unknown>>;
}

// ─── Const Tuple Enums (for runtime iteration & strict typing) ──────────────

/** All possible deal pipeline stages (const tuple) */
export const DealStages = ['NEW', 'NEGOTIATION', 'UNDER_OFFER', 'WON', 'LOST'] as const;
export type DealStageConst = (typeof DealStages)[number];

/** All possible lead statuses (const tuple) */
export const LeadStatuses = ['NEW', 'IN_PROGRESS', 'WON', 'LOST'] as const;
export type LeadStatusConst = (typeof LeadStatuses)[number];

/** All possible property statuses (const tuple) */
export const PropertyStatuses = ['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED'] as const;
export type PropertyStatusConst = (typeof PropertyStatuses)[number];

/** All possible appointment statuses (const tuple) */
export const AppointmentStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'] as const;
export type AppointmentStatusConst = (typeof AppointmentStatuses)[number];

/** Listing type constants */
export const ListingTypes = ['sale', 'rent'] as const;
export type ListingTypeConst = (typeof ListingTypes)[number];

/** Property type constants */
export const PropertyTypes = [
  'apartment', 'villa', 'land', 'commercial',
  'office', 'warehouse', 'building', 'chalet',
] as const;
export type PropertyTypeConst = (typeof PropertyTypes)[number];

/** Activity type constants */
export const ActivityTypes = [
  'call', 'email', 'meeting', 'note', 'task', 'follow_up',
] as const;
export type ActivityTypeConst = (typeof ActivityTypes)[number];

/** Lead source constants */
export const LeadSources = [
  'website', 'referral', 'social_media', 'phone',
  'walk_in', 'advertising', 'partner', 'manual',
] as const;
export type LeadSourceConst = (typeof LeadSources)[number];

// ─── Additional Utility Types ────────────────────────────────────────────────

/** Add createdAt/updatedAt timestamps to any type */
export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
};

/** Add ID field to any type */
export type WithId<T> = T & {
  id: string;
};

/** Extract resolved type from a Promise */
export type AwaitedType<T> = T extends Promise<infer U> ? U : T;

// ─── Chart & Time Series Types ──────────────────────────────────────────────

/** Generic time-series data point for charts */
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

/** Pipeline stage count for funnel visualization */
export interface PipelineStageCount {
  stage: string;
  count: number;
  value: number;
}

// ─── Saved Search Type ──────────────────────────────────────────────────────

/** A user's saved search configuration */
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  params: {
    query?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, string | string[] | number | boolean | null>;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Contact Log Extended ───────────────────────────────────────────────────

/** Extended contact log with outcome tracking */
export interface ContactLogFull extends ContactLog {
  duration?: number | null;
  direction?: 'inbound' | 'outbound' | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  followUpRequired?: boolean;
  followUpDate?: Date | string | null;
}

// ─── Form Types (simple aliases used by front-end forms) ────────────────────

/** Form data for posting a listing (simple alias) */
export type PostListingForm = PropertyFormData;

/** Form data for creating a lead (simple alias) */
export type CreateLeadForm = LeadFormData;

/** Form data for creating a deal (simple alias) */
export type CreateDealForm = DealFormData;

/** Form data for creating an appointment (simple alias) */
export type CreateAppointmentForm = AppointmentFormData;

/** Form data for updating a profile (simple alias) */
export type UpdateProfileForm = UserProfileFormData;

/** Form data for changing a password (simple alias) */
export type ChangePasswordForm = PasswordChangeFormData;
