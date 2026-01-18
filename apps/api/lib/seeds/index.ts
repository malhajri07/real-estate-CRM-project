/**
 * index.ts - Seed Index
 * 
 * Location: apps/api/ → Lib/ → seeds/ → index.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Main seed index file. Orchestrates:
 * - Database seeding process
 * - Seed execution order
 * - Seed result reporting
 * 
 * Related Files:
 * - apps/api/lib/seeds/core.ts - Core seed data
 * - apps/api/lib/seeds/domain.ts - Domain seed data
 * - apps/api/lib/seeds/cms.ts - CMS seed data
 * - apps/api/lib/seeds/analytics.ts - Analytics seed data
 * - apps/api/lib/seeds/revenue.ts - Revenue seed data
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Faker, ar, en } from "@faker-js/faker";
import { performance } from "node:perf_hooks";
import seedCore from "./core";
import seedCMS from "./cms";
import seedDomain from "./domain";
import seedRevenue from "./revenue";
import seedAnalytics from "./analytics";
import seedSupport from "./support";
import { SeedCredential, SeedResult, SeedContext } from "./types";

const prisma = new PrismaClient();

const faker = new Faker({ locale: [ar, en] });

const isResetEnabled = String(process.env.RESET ?? "false").toLowerCase() === "true";

const logger = (message: string) => {
  console.log(`[seed] ${message}`);
};

const aggregateSummaries = (results: SeedResult[]): Array<{ model: string; count: number }> => {
  const map = new Map<string, number>();
  results
    .flatMap((result) => result.summary ?? [])
    .forEach(({ model, count }) => {
      map.set(model, count);
    });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([model, count]) => ({ model, count }));
};

const collectCredentials = (results: SeedResult[]): SeedCredential[] =>
  results.flatMap((result) => result.credentials ?? []);

const run = async () => {
  const context: SeedContext = {
    prisma,
    faker,
    reset: isResetEnabled,
    logger
  };

  const results: SeedResult[] = [];
  const start = performance.now();

  try {
    logger(`Starting seed run (RESET=${isResetEnabled ? "true" : "false"})`);

    results.push(await seedCore(context));
    results.push(await seedCMS(context));
    results.push(await seedDomain(context));
    results.push(await seedRevenue(context));
    results.push(await seedAnalytics(context));
    results.push(await seedSupport(context));

    const summaries = aggregateSummaries(results);
    const credentials = collectCredentials(results);

    logger("Seed run completed. Summary:");
    console.table(summaries);

    if (credentials.length) {
      logger("Demo credentials (email / password):");
      credentials.forEach((credential) => {
        console.log(
          ` • ${credential.role}${credential.organization ? ` (${credential.organization})` : ""}: ${credential.email} / ${credential.password}`
        );
      });
    }

    logger("Reminder: run `pnpm db:reseed` anytime to refresh demo data.");
  } catch (error) {
    console.error("❌ Seed run failed", error);
    process.exitCode = 1;
  } finally {
    const duration = ((performance.now() - start) / 1000).toFixed(2);
    logger(`Total duration: ${duration}s`);
    await prisma.$disconnect();
  }
};

run();
