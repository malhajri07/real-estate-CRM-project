/**
 * types.ts - Seed Types
 * 
 * Location: apps/api/ → Lib/ → seeds/ → types.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Type definitions for seed utilities. Defines:
 * - Seed context types
 * - Seed result types
 * - Seed credential types
 * 
 * Related Files:
 * - apps/api/lib/seeds/index.ts - Uses these types
 */

import type { PrismaClient } from "@prisma/client";
import type { Faker } from "@faker-js/faker";

export type SeedContext = {
  prisma: PrismaClient;
  faker: Faker;
  reset: boolean;
  logger: (message: string) => void;
};

export type SeedSummaryEntry = {
  model: string;
  count: number;
};

export type SeedCredential = {
  role: string;
  email: string;
  password: string;
  organization?: string | null;
};

export type SeedResult = {
  summary: SeedSummaryEntry[];
  credentials?: SeedCredential[];
};

export type SeedModule = (ctx: SeedContext) => Promise<SeedResult>;
