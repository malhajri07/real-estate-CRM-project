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
  organization?: Organization | null;
  dealValue?: number | string | null;
  expectedCloseDate?: Date | string | null;
  notes?: string | null;
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
  description: z.string().min(1, "الوصف مطلوب"),
  address: z.string().min(1, "العنوان مطلوب"),
  city: z.string().min(1, "المدينة مطلوبة"),
  state: z.string().min(1, "المنطقة مطلوبة"),
  zipCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  price: z.coerce.number().min(0, "السعر يجب أن يكون أكبر من 0"),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  status: z.string().default("active"),
  bedrooms: z.coerce.number().min(0, "عدد الغرف يجب أن يكون أكبر من أو يساوي 0").default(0),
  bathrooms: z.coerce.number().min(0, "عدد الحمامات يجب أن يكون أكبر من أو يساوي 0").default(0),
  livingRooms: z.coerce.number().min(0, "عدد صالات المعيشة يجب أن يكون أكبر من أو يساوي 0").default(0),
  squareFeet: z.coerce.number().min(0, "المساحة يجب أن تكون أكبر من أو يساوي 0").default(0),
  features: z.array(z.string()).default([]),
  photoUrls: z.array(z.string()).default([]),
  agentId: z.string().optional(),
  organizationId: z.string().optional(),
}).passthrough();

export type InsertProperty = z.infer<typeof insertPropertySchema>;
