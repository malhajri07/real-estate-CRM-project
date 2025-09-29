/**
 * shared/types.ts - Shared TypeScript Types
 * 
 * This file provides shared TypeScript types for the real estate CRM platform.
 * It replaces the Drizzle-based schema types with Prisma-compatible types.
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
  type: string;
  category: string;
  city: string;
  district: string | null;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  price: number;
  status: string;
  visibility: string;
  latitude: number | null;
  longitude: number | null;
  features: string; // JSON string
  photos: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
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
  source: string;
  status: string;
  budget: number | null;
  preferences: string; // JSON string
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  title: string;
  description: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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

// Property creation types
export interface InsertProperty {
  title: string;
  description: string;
  type: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  state: string;
  latitude?: string;
  longitude?: string;
  images?: string[];
  features?: string[];
  status?: string;
  agentId?: string;
  organizationId?: string;
}


// Property creation schema
export const insertPropertySchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  type: z.string().min(1, "نوع العقار مطلوب"),
  price: z.number().min(0, "السعر يجب أن يكون أكبر من 0"),
  area: z.number().min(0, "المساحة يجب أن تكون أكبر من 0"),
  bedrooms: z.number().min(0, "عدد الغرف يجب أن يكون أكبر من أو يساوي 0"),
  bathrooms: z.number().min(0, "عدد الحمامات يجب أن يكون أكبر من أو يساوي 0"),
  address: z.string().min(1, "العنوان مطلوب"),
  city: z.string().min(1, "المدينة مطلوبة"),
  state: z.string().min(1, "المنطقة مطلوبة"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  status: z.string().optional(),
  agentId: z.string().optional(),
  organizationId: z.string().optional(),
});
