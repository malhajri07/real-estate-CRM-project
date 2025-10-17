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
