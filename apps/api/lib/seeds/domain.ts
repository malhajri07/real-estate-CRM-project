/**
 * domain.ts - Domain Seed Data
 * 
 * Location: apps/api/ → Lib/ → seeds/ → domain.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Domain seed data generation. Provides:
 * - Property and listing seeding
 * - Location data seeding
 * - Domain entity data
 * 
 * Related Files:
 * - apps/api/lib/seeds/index.ts - Seed orchestrator
 */

import type { Prisma } from "@prisma/client";
import { SeedContext, SeedResult } from "./types";

type CityProfile = {
  city: string;
  region: string;
  baseLat: number;
  baseLng: number;
  districts: string[];
};

const CITY_PROFILES: CityProfile[] = [
  {
    city: "Riyadh",
    region: "Riyadh",
    baseLat: 24.7136,
    baseLng: 46.6753,
    districts: ["Al Yasmin", "Al Malqa", "Al Mohammadiya", "Al Nakheel", "Al Rawdah", "Al Hamra"]
  },
  {
    city: "Jeddah",
    region: "Makkah",
    baseLat: 21.5433,
    baseLng: 39.1728,
    districts: ["Al Shati", "Al Rawdah", "Al Hamra", "Al Zahraa", "Al Andalus", "Al Basateen"]
  },
  {
    city: "Dammam",
    region: "Eastern Province",
    baseLat: 26.3927,
    baseLng: 49.9777,
    districts: ["Al Faisaliyah", "Al Faisaliah", "Al Rakah", "Al Aziziyah", "Al Shati", "Al Badiyah"]
  },
  {
    city: "Khobar",
    region: "Eastern Province",
    baseLat: 26.2172,
    baseLng: 50.1971,
    districts: ["Al Qusur", "Al Olaya", "Al Bandariyah", "Al Bostan", "Al Yarmouk", "Al Aziziyah"]
  },
  {
    city: "Makkah",
    region: "Makkah",
    baseLat: 21.3891,
    baseLng: 39.8579,
    districts: ["Al Aziziyah", "Al Shisha", "Al Taqwa", "Al Naseem", "Al Khaldiya", "Al Rusaifa"]
  },
  {
    city: "Madinah",
    region: "Madinah",
    baseLat: 24.5247,
    baseLng: 39.5692,
    districts: ["Al Aqiq", "Al Qiblatayn", "Al Khalidiyah", "Al Uyun", "Al Badr", "Al Jamiah"]
  }
];

const ARABIC_FIRST_NAMES = ["أحمد", "محمد", "عبدالله", "سارة", "نورة", "هيفاء", "خالد", "عمر", "ليان", "ريم"];
const ARABIC_LAST_NAMES = ["العتيبي", "القحطاني", "السعود", "الغامدي", "الشهري", "الزهراني", "الحارثي", "الشريف"];
const COMPANY_TAGS = ["استثمار", "تطوير", "العقار", "المساكن", "الوساطة", "الاستثمارية"];

const PROPERTY_CONFIG = [
  { category: "Villa", count: 12, minPrice: 1_200_000, maxPrice: 6_000_000, unit: true },
  { category: "Apartment", count: 10, minPrice: 350_000, maxPrice: 1_200_000, unit: true },
  { category: "Land", count: 6, minPrice: 800_000, maxPrice: 8_000_000, unit: false },
  { category: "Commercial", count: 2, minPrice: 1_000_000, maxPrice: 12_000_000, unit: false }
];

const LISTING_STATUS_WEIGHTS: Record<string, number> = {
  DRAFT: 0.2,
  ACTIVE: 0.5,
  RESERVED: 0.1,
  ARCHIVED: 0.1,
  SOLD: 0.1
};

const DEAL_STAGE_WEIGHTS: Record<string, number> = {
  NEW: 0.2,
  NEGOTIATION: 0.35,
  UNDER_OFFER: 0.2,
  WON: 0.15,
  LOST: 0.1
};

const SUPPORT_STATUS_WEIGHTS: Record<string, number> = {
  OPEN: 0.4,
  IN_PROGRESS: 0.3,
  RESOLVED: 0.2,
  CLOSED: 0.1
};

const SUPPORT_PRIORITY_WEIGHTS: Record<string, number> = {
  LOW: 0.15,
  MEDIUM: 0.45,
  HIGH: 0.3,
  URGENT: 0.1
};

const picker = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const weightedPick = (weights: Record<string, number>): string => {
  const total = Object.values(weights).reduce((acc, value) => acc + value, 0);
  const threshold = Math.random() * total;
  let running = 0;
  for (const [key, value] of Object.entries(weights)) {
    running += value;
    if (threshold <= running) {
      return key;
    }
  }
  return Object.keys(weights)[0];
};

const randomCoordinate = (base: number, variance = 0.08): number =>
  Number((base + (Math.random() - 0.5) * variance).toFixed(6));

const randomPrice = (min: number, max: number): number =>
  Math.round(Math.random() * (max - min) + min);

const randomArabicName = () => `${picker(ARABIC_FIRST_NAMES)} ${picker(ARABIC_LAST_NAMES)}`;

const buildMediaUrl = (category: string, variant: "photo" | "floorplan" = "photo") => {
  const baseQuery = variant === "photo" ? category.toLowerCase() : "floorplan";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(baseQuery)},saudi-arabia`;
};

const ensureReset = async (ctx: SeedContext) => {
  if (!ctx.reset) {
    return;
  }
  await ctx.prisma.$transaction([
    ctx.prisma.support_tickets.deleteMany({}),
    ctx.prisma.deals.deleteMany({}),
    ctx.prisma.appointments.deleteMany({}),
    ctx.prisma.inquiries.deleteMany({}),
    ctx.prisma.leads.deleteMany({ where: { customerId: { not: null } } }),
    ctx.prisma.listings.deleteMany({}),
    ctx.prisma.property_media.deleteMany({}),
    ctx.prisma.property_units.deleteMany({}),
    ctx.prisma.properties.deleteMany({}),
    ctx.prisma.customers.deleteMany({})
  ]);
};

export const seedDomain = async (ctx: SeedContext): Promise<SeedResult> => {
  const { prisma, faker, logger } = ctx;
  await ensureReset(ctx);

  const organizations = await prisma.organizations.findMany({
    include: {
      users: {
        select: {
          id: true,
          username: true,
          roles: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    }
  });

  const summaryCounters: Record<string, number> = {
    properties: await prisma.properties.count(),
    property_units: await prisma.property_units.count(),
    property_media: await prisma.property_media.count(),
    listings: await prisma.listings.count(),
    customers: await prisma.customers.count(),
    leads: await prisma.leads.count(),
    inquiries: await prisma.inquiries.count(),
    appointments: await prisma.appointments.count(),
    deals: await prisma.deals.count(),
    support_tickets: await prisma.support_tickets.count()
  };

  for (const org of organizations) {
    const existingCustomers = await prisma.customers.count({
      where: { organizationId: org.id }
    });
    if (existingCustomers > 0 && !ctx.reset) {
      logger(`Skipping domain seed for ${org.tradeName} (data present).`);
      continue;
    }

    logger(`Seeding domain data for ${org.tradeName}...`);
    const orgAgents = org.users.filter((user) => user.roles.includes("AGENT"));
    const orgSupport = org.users.filter((user) => user.roles.includes("SUPPORT"));
    const corpAdmin = org.users.find((user) => user.roles.includes("CORP_ADMIN")) ?? org.users[0];
    const fallbackAgent = orgAgents[0] ?? corpAdmin;

    const cityProfile = picker(CITY_PROFILES);

    const customerTarget = faker.number.int({ min: 55, max: 80 });
    const customerRecords: string[] = [];
    const sellerCustomers: string[] = [];
    const buyerCustomers: string[] = [];

    for (let index = 0; index < customerTarget; index += 1) {
      const useArabic = Math.random() < 0.55;
      const firstName = useArabic ? picker(ARABIC_FIRST_NAMES) : faker.person.firstName();
      const lastName = useArabic ? picker(ARABIC_LAST_NAMES) : faker.person.lastName();
      const typeRoll = Math.random();
      const customerType =
        typeRoll < 0.35 ? "BUYER" : typeRoll < 0.7 ? "SELLER" : "BOTH";
      const customer = await prisma.customers.create({
        data: {
          organizationId: org.id,
          type: customerType as Prisma.CustomerCreateInput["type"],
          firstName,
          lastName,
          salutation: useArabic ? "السيد/السيدة" : faker.person.prefix(),
          email: faker.internet.email({ firstName, lastName, provider: org.website?.replace(/^https?:\/\//, "") ?? "example.sa" }),
          phone: faker.phone.number("+9665########"),
          secondaryPhone: Math.random() < 0.25 ? faker.phone.number("+9665########") : null,
          whatsappNumber: Math.random() < 0.6 ? faker.phone.number("+9665########") : null,
          city: cityProfile.city,
          district: picker(cityProfile.districts),
          nationality: Math.random() < 0.8 ? "Saudi" : picker(["Egyptian", "Jordanian", "Pakistani", "Lebanese"]),
          source: picker(["Website", "WhatsApp", "Referral", "Walk-in", "Campaign"]),
          notes: Math.random() < 0.35 ? faker.lorem.sentence({ min: 8, max: 14 }) : null
        }
      });
      customerRecords.push(customer.id);
      if (customerType === "SELLER" || customerType === "BOTH") {
        sellerCustomers.push(customer.id);
      }
      if (customerType === "BUYER" || customerType === "BOTH") {
        buyerCustomers.push(customer.id);
      }
    }

    summaryCounters.customers += customerRecords.length;

    const propertyIds: Array<{
      id: string;
      category: string;
      price: number;
      hasUnit: boolean;
      city: string;
      district: string;
    }> = [];
    const propertyMediaBatch: Prisma.property_mediaCreateManyInput[] = [];
    const propertyUnitBatch: Prisma.property_unitsCreateManyInput[] = [];

    for (const config of PROPERTY_CONFIG) {
      for (let index = 0; index < config.count; index += 1) {
        const price = randomPrice(config.minPrice, config.maxPrice);
        const property = await prisma.properties.create({
          data: {
            organizationId: org.id,
            agentId: orgAgents.length ? picker(orgAgents).id : null,
            title:
              config.category === "Land"
                ? `${cityProfile.city} Premium Plot`
                : `${config.category} in ${cityProfile.city}`,
            description: faker.lorem.paragraph({ min: 2, max: 4 }),
            type: config.category === "Commercial" ? "Commercial" : "Residential",
            category: config.category,
            city: cityProfile.city,
            district: picker(cityProfile.districts),
            address: `${faker.location.streetAddress()} ${cityProfile.city}`,
            bedrooms: config.category === "Land" || config.category === "Commercial" ? null : faker.number.int({ min: 2, max: 6 }),
            bathrooms: config.category === "Land" || config.category === "Commercial" ? null : faker.number.int({ min: 2, max: 6 }),
            areaSqm: faker.number.int({ min: 120, max: 650 }),
            price,
            status: "ACTIVE",
            visibility: "PUBLIC",
            latitude: randomCoordinate(cityProfile.baseLat),
            longitude: randomCoordinate(cityProfile.baseLng),
            features: faker.helpers.arrayElements(
              ["Pool", "Garden", "Maid Room", "Driver Room", "Smart Access", "Gym", "Rooftop Terrace"],
              { min: 2, max: 4 }
            ).join(", "),
            photos: null,
            createdAt: faker.date.past({ years: 1 }),
            updatedAt: new Date()
          }
        });

        propertyIds.push({
          id: property.id,
          category: config.category,
          price,
          hasUnit: config.unit,
          city: property.city ?? cityProfile.city,
          district: property.district ?? picker(cityProfile.districts)
        });

        const mediaCount = faker.number.int({ min: 3, max: 6 });
        for (let mediaIndex = 0; mediaIndex < mediaCount; mediaIndex += 1) {
          propertyMediaBatch.push({
            id: faker.string.uuid(),
            propertyId: property.id,
            mediaType: "PHOTO",
            url: buildMediaUrl(config.category),
            isPrimary: mediaIndex === 0
          });
        }
        if (config.category !== "Land" && config.category !== "Commercial" && Math.random() < 0.4) {
          propertyMediaBatch.push({
            id: faker.string.uuid(),
            propertyId: property.id,
            mediaType: "FLOORPLAN",
            url: buildMediaUrl(config.category, "floorplan"),
            isPrimary: false
          });
        }

        if (config.unit) {
          propertyUnitBatch.push({
            id: faker.string.uuid(),
            propertyId: property.id,
            unitType: config.category === "Apartment" ? "Apartment Unit" : "Villa Unit",
            bedrooms: faker.number.int({ min: 2, max: 6 }),
            bathrooms: faker.number.int({ min: 2, max: 6 }),
            areaSqm: faker.number.int({ min: 120, max: 450 }),
            price: price,
            floor: config.category === "Apartment" ? faker.number.int({ min: 1, max: 20 }) : null,
            isFurnished: Math.random() < 0.35,
            hasBalcony: Math.random() < 0.55,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (propertyMediaBatch.length) {
      await prisma.property_media.createMany({ data: propertyMediaBatch });
      summaryCounters.property_media += propertyMediaBatch.length;
    }
    if (propertyUnitBatch.length) {
      await prisma.property_units.createMany({ data: propertyUnitBatch });
      summaryCounters.property_units += propertyUnitBatch.length;
    }
    summaryCounters.properties += propertyIds.length;

    const listingRecords: Array<{
      id: string;
      propertyId: string;
      category: string;
      price: number;
      status: string;
      organizationId: string | null;
      city: string;
      district: string;
      agentId: string | null;
    }> = [];

    for (const property of propertyIds) {
      if (Math.random() > 0.7) continue;
      const status = weightedPick(LISTING_STATUS_WEIGHTS);
      const hasUnit = property.hasUnit;
      const unitId = hasUnit
        ? propertyUnitBatch.find((unit) => unit.propertyId === property.id)?.id ?? null
        : null;

      const publishedAt =
        status === "ACTIVE" || status === "RESERVED" || status === "SOLD"
          ? faker.date.past({ years: 0.5 })
          : null;

      const listing = await prisma.listings.create({
        data: {
          propertyId: property.id,
          organizationId: org.id,
          agentId: orgAgents.length ? picker(orgAgents).id : fallbackAgent?.id ?? null,
          unitId,
          sellerCustomerId: sellerCustomers.length ? picker(sellerCustomers) : null,
          listingType: property.category === "Commercial" ? "RENT" : "SALE",
          exclusive: Math.random() < 0.6,
          publishedAt,
          status,
          price: status === "SOLD" ? property.price * (1 + (Math.random() - 0.5) * 0.1) : property.price,
          description: faker.lorem.sentences({ min: 2, max: 3 })
        }
      });
      listingRecords.push({
        id: listing.id,
        propertyId: property.id,
        category: property.category,
        price: Number(listing.price ?? property.price),
        status,
        organizationId: org.id,
        city: property.city,
        district: property.district,
        agentId: listing.agentId
      });
    }
    summaryCounters.listings += listingRecords.length;

    const leadTargets = Math.round(customerRecords.length * 0.6);
    const leadCustomers = faker.helpers.shuffle(customerRecords).slice(0, leadTargets);
    const leadInserts: Prisma.leadsCreateInput[] = [];

    for (const customerId of leadCustomers) {
      const agent = orgAgents.length ? picker(orgAgents) : fallbackAgent;
      const status = picker(["NEW", "IN_PROGRESS", "WON", "LOST"]);
      leadInserts.push({
        id: faker.string.uuid(),
        users: { connect: { id: agent?.id ?? corpAdmin.id } },
        organization: org.id ? { connect: { id: org.id } } : undefined,
        customer: { connect: { id: customerId } },
        status,
        notes: Math.random() < 0.5 ? faker.lorem.sentence() : null,
        source: picker(["Website", "WhatsApp", "Referral", "Campaign"]),
        priority: faker.number.int({ min: 1, max: 5 }),
        assignedAt: faker.date.past({ years: 0.2 }),
        lastContactAt: Math.random() < 0.8 ? faker.date.recent({ days: 20 }) : null
      } as Prisma.leadsCreateInput);
    }

    for (const leadData of leadInserts) {
      await prisma.leads.create({ data: leadData });
    }
    summaryCounters.leads += leadInserts.length;

    const inquiryTargets = Math.round(listingRecords.length * 0.6);
    const inquiriesCreated: string[] = [];

    for (let index = 0; index < inquiryTargets; index += 1) {
      const listing = picker(listingRecords);
      const customerId =
        buyerCustomers.length > 0 ? picker(buyerCustomers) : picker(customerRecords);
      const agentId = listing.agentId ?? fallbackAgent?.id ?? corpAdmin.id;
      const channel = picker(["WEBSITE", "WHATSAPP", "PHONE", "WALK_IN", "REFERRAL"]);
      const inquiry = await prisma.inquiries.create({
        data: {
          organizationId: org.id,
          customerId,
          propertyId: listing.propertyId,
          listingId: listing.id,
          agentId,
          channel,
          status: picker(["NEW", "IN_PROGRESS", "RESPONDED"]),
          message: faker.lorem.sentence({ min: 8, max: 16 }),
          preferredTime: faker.date.future({ months: 1 }),
          createdAt: faker.date.recent({ days: 30 })
        }
      });
      inquiriesCreated.push(inquiry.id);
    }
    summaryCounters.inquiries += inquiriesCreated.length;

    const appointmentTargets = Math.round(inquiriesCreated.length * 0.5);
    const appointmentInquiries = faker.helpers.shuffle(inquiriesCreated).slice(0, appointmentTargets);

    for (const inquiryId of appointmentInquiries) {
      const inquiry = await prisma.inquiries.findUnique({
        where: { id: inquiryId },
        select: {
          listingId: true,
          propertyId: true,
          customerId: true,
          agentId: true
        }
      });
      if (!inquiry) continue;
      await prisma.appointments.create({
        data: {
          organizationId: org.id,
          customerId: inquiry.customerId,
          propertyId: inquiry.propertyId,
          listingId: inquiry.listingId,
          inquiryId,
          agentId: inquiry.agentId,
          status: picker(["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED"]),
          scheduledAt: faker.date.soon({ days: 45 }),
          location: picker([
            `${cityProfile.city} Head Office`,
            `${cityProfile.city} Property Site`,
            "Virtual Meeting"
          ]),
          notes: Math.random() < 0.3 ? faker.lorem.sentence() : null
        }
      });
    }
    summaryCounters.appointments += appointmentTargets;

    const dealTarget = Math.round(listingRecords.length * faker.number.float({ min: 0.1, max: 0.15 }));
    const dealListings = faker.helpers.shuffle(listingRecords).slice(0, dealTarget);

    for (const listing of dealListings) {
      const stage = weightedPick(DEAL_STAGE_WEIGHTS);
      const customerId = picker(customerRecords);
      const agentId = listing.agentId ?? fallbackAgent?.id ?? corpAdmin.id;
      const expectedCloseDate = faker.date.future({ months: 3 });
      const agreedPrice =
        stage === "WON" ? listing.price * (1 + (Math.random() - 0.5) * 0.1) : listing.price;
      const deal = await prisma.deals.create({
        data: {
          organizationId: org.id,
          listingId: listing.id,
          propertyId: listing.propertyId,
          customerId,
          agentId,
          stage,
          source: picker(["Referral", "Website", "WhatsApp", "Campaign"]),
          expectedCloseDate,
          agreedPrice,
          currency: "SAR",
          wonAt: stage === "WON" ? faker.date.recent({ days: 30 }) : null,
          lostAt: stage === "LOST" ? faker.date.recent({ days: 30 }) : null,
          notes: Math.random() < 0.3 ? faker.lorem.sentences({ min: 1, max: 2 }) : null
        }
      });
      if (deal.stage === "WON") {
        await prisma.listings.update({
          where: { id: listing.id },
          data: { status: "SOLD" }
        });
      }
    }
    summaryCounters.deals += dealTarget;

    const ticketsToCreate = faker.number.int({ min: 4, max: 8 });
    for (let index = 0; index < ticketsToCreate; index += 1) {
      await prisma.support_tickets.create({
        data: {
          organizationId: org.id,
          customerId: Math.random() < 0.6 ? picker(customerRecords) : null,
          createdByUserId: corpAdmin?.id ?? null,
          assignedToUserId: orgSupport.length ? picker(orgSupport).id : fallbackAgent?.id ?? null,
          subject: `${picker(["Follow-up", "Maintenance", "Portal"])} Request #${faker.number.int({ min: 1000, max: 9999 })}`,
          description: faker.lorem.paragraph({ min: 1, max: 2 }),
          status: weightedPick(SUPPORT_STATUS_WEIGHTS) as Prisma.support_ticketsCreateInput["status"],
          priority: weightedPick(SUPPORT_PRIORITY_WEIGHTS) as Prisma.support_ticketsCreateInput["priority"],
          channel: picker(["WEBSITE", "WHATSAPP", "PHONE"])
        }
      });
    }
    summaryCounters.support_tickets += ticketsToCreate;
  }

  const summary = Object.entries(summaryCounters).map(([model, count]) => ({
    model,
    count
  }));

  return {
    summary
  };
};

export default seedDomain;
