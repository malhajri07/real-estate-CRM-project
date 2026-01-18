/**
 * prismaClient.ts - Prisma Client Singleton
 * 
 * Location: apps/api/ → Database & Prisma → prismaClient.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Prisma client singleton for database operations. Provides:
 * - Database connection management
 * - Type-safe database queries
 * - Marketing delegate stubs for unsupported models
 * 
 * Related Files:
 * - data/schema/prisma/schema.prisma - Prisma schema definition
 * - apps/api/storage-prisma.ts - Prisma storage adapter
 */

import { PrismaClient } from '@prisma/client';

type MarketingDelegate = {
  create: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
  findUnique: (...args: any[]) => Promise<any>;
  findMany: (...args: any[]) => Promise<any[]>;
  findFirst: (...args: any[]) => Promise<any | null>;
};

export const basePrisma = new PrismaClient();

const createStubDelegate = (name: string): MarketingDelegate => {
  const warn = (method: string) => {
    console.warn(`⚠️ ${name}.${method} is not supported with the current database schema.`);
  };

  return {
    create: async (..._args) => {
      warn('create');
      return null;
    },
    update: async (..._args) => {
      warn('update');
      return null;
    },
    findUnique: async (..._args) => {
      warn('findUnique');
      return null;
    },
    findMany: async (..._args) => {
      warn('findMany');
      return [];
    },
    findFirst: async (..._args) => {
      warn('findFirst');
      return null;
    },
  };
};

type LegacyPrismaClient = PrismaClient & {
  organization: PrismaClient['organizations'];
  property: PrismaClient['properties'];
  lead: PrismaClient['leads'];
  buyerRequest: PrismaClient['buyer_requests'];
  contactLog: PrismaClient['contact_logs'];
  claim: PrismaClient['claims'];
  city: PrismaClient['cities'];
  region: PrismaClient['regions'];
  district: PrismaClient['districts'];
  auditLog: PrismaClient['audit_logs'];
  agentProfile: PrismaClient['agent_profiles'];
  user: PrismaClient['users'];
  sellerSubmission: PrismaClient['seller_submissions'];
  listing: PrismaClient['listings'];
  propertiesSeeker: PrismaClient['properties_seeker'];
  marketingRequest: MarketingDelegate;
  marketingProposal: MarketingDelegate;
};

const prisma = basePrisma as LegacyPrismaClient;

const alias = <K extends keyof LegacyPrismaClient>(property: K, getter: () => LegacyPrismaClient[K]) => {
  Object.defineProperty(prisma, property, {
    get: getter,
  });
};

alias('organization', () => basePrisma.organizations);
alias('property', () => basePrisma.properties);
alias('lead', () => basePrisma.leads);
alias('buyerRequest', () => basePrisma.buyer_requests);
alias('contactLog', () => basePrisma.contact_logs);
alias('claim', () => basePrisma.claims);
alias('city', () => basePrisma.cities);
alias('region', () => basePrisma.regions);
alias('district', () => basePrisma.districts);
alias('auditLog', () => basePrisma.audit_logs);
alias('agentProfile', () => basePrisma.agent_profiles);
alias('user', () => basePrisma.users);
alias('sellerSubmission', () => basePrisma.seller_submissions);
alias('listing', () => basePrisma.listings);
alias('propertiesSeeker', () => basePrisma.properties_seeker);
alias('marketingRequest', () => createStubDelegate('marketingRequest'));
alias('marketingProposal', () => createStubDelegate('marketingProposal'));

export { prisma };
