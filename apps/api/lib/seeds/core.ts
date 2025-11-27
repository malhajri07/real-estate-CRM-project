/**
 * core.ts - Core Seed Data
 * 
 * Location: apps/api/ → Lib/ → seeds/ → core.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Core seed data generation. Provides:
 * - User and role seeding
 * - Permission seeding
 * - Core entity data
 * 
 * Related Files:
 * - apps/api/lib/seeds/index.ts - Seed orchestrator
 * - apps/api/seed-rbac.ts - RBAC seed script
 */

import bcrypt from "bcryptjs";
import { differenceInDays, subDays } from "date-fns";
import { SeedContext, SeedResult, SeedCredential } from "./types";

type PermissionSeed = {
  key: string;
  label: string;
  description: string;
  domain: string;
};

type RoleSeed = {
  key: string;
  name: string;
  description: string;
  scope: "PLATFORM" | "ORGANIZATION";
  isDefault?: boolean;
  isSystem?: boolean;
};

type OrganizationSeed = {
  slug: string;
  legalName: string;
  tradeName: string;
  licenseNo: string;
  industry: string;
  size: number;
  city: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
  billingEmail: string;
  billingPhone: string;
  metadata?: Record<string, unknown>;
};

type UserSeed = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  organizationLicense?: string | null;
  roles: string[];
  jobTitle?: string;
  department?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
};

const PASSWORD_SEED = "Passw0rd!";

const PERMISSIONS: PermissionSeed[] = [
  {
    key: "admin.dashboard.view",
    label: "View admin dashboard",
    description: "Access KPI dashboards and overview widgets",
    domain: "admin.dashboard"
  },
  {
    key: "admin.users.read",
    label: "View users",
    description: "View platform user directory",
    domain: "admin.users"
  },
  {
    key: "admin.users.manage",
    label: "Manage users",
    description: "Create, update and deactivate users",
    domain: "admin.users"
  },
  {
    key: "admin.organizations.read",
    label: "View organizations",
    description: "View partner organizations",
    domain: "admin.organizations"
  },
  {
    key: "admin.organizations.manage",
    label: "Manage organizations",
    description: "Create and update organization records",
    domain: "admin.organizations"
  },
  {
    key: "admin.roles.read",
    label: "View roles",
    description: "View RBAC role definitions",
    domain: "admin.roles"
  },
  {
    key: "admin.roles.manage",
    label: "Manage roles",
    description: "Assign permissions to roles and users",
    domain: "admin.roles"
  },
  {
    key: "admin.properties.read",
    label: "View properties",
    description: "Read property catalog",
    domain: "admin.properties"
  },
  {
    key: "admin.properties.write",
    label: "Manage properties",
    description: "Create and edit property records",
    domain: "admin.properties"
  },
  {
    key: "admin.listings.read",
    label: "View listings",
    description: "View listings across the organization",
    domain: "admin.listings"
  },
  {
    key: "admin.listings.write",
    label: "Manage listings",
    description: "Create and edit property listings",
    domain: "admin.listings"
  },
  {
    key: "admin.leads.read",
    label: "View leads",
    description: "Read buyer and seller leads",
    domain: "admin.leads"
  },
  {
    key: "admin.leads.write",
    label: "Manage leads",
    description: "Assign and update lead statuses",
    domain: "admin.leads"
  },
  {
    key: "admin.deals.read",
    label: "View deals",
    description: "Read deal pipeline",
    domain: "admin.deals"
  },
  {
    key: "admin.deals.write",
    label: "Manage deals",
    description: "Update deal pipeline records",
    domain: "admin.deals"
  },
  {
    key: "admin.tickets.read",
    label: "View support tickets",
    description: "Read support tickets",
    domain: "admin.support"
  },
  {
    key: "admin.tickets.manage",
    label: "Manage support tickets",
    description: "Respond to and resolve support tickets",
    domain: "admin.support"
  },
  {
    key: "admin.analytics.view",
    label: "View analytics",
    description: "Read analytics dashboards and reports",
    domain: "admin.analytics"
  },
  {
    key: "admin.billing.read",
    label: "View billing",
    description: "Read invoices and transactions",
    domain: "admin.billing"
  },
  {
    key: "admin.billing.manage",
    label: "Manage billing",
    description: "Create invoices and manage billing operations",
    domain: "admin.billing"
  }
];

const ROLE_DEFINITIONS: RoleSeed[] = [
  {
    key: "WEBSITE_ADMIN",
    name: "Global Platform Admin",
    description: "Full access to the entire platform",
    scope: "PLATFORM",
    isSystem: true
  },
  {
    key: "CORP_ADMIN",
    name: "Organization Administrator",
    description: "Manages a single organization",
    scope: "ORGANIZATION",
    isSystem: true
  },
  {
    key: "AGENT",
    name: "Real Estate Agent",
    description: "Handles assigned clients and listings",
    scope: "ORGANIZATION",
    isSystem: true
  },
  {
    key: "SUPPORT",
    name: "Support Specialist",
    description: "Manages support tickets for the organization",
    scope: "ORGANIZATION",
    isSystem: true
  },
  {
    key: "VIEWER",
    name: "Read Only Viewer",
    description: "Read-only access to dashboards and reports",
    scope: "ORGANIZATION",
    isSystem: true
  }
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  WEBSITE_ADMIN: PERMISSIONS.map((permission) => permission.key),
  CORP_ADMIN: PERMISSIONS.map((permission) => permission.key),
  AGENT: [
    "admin.dashboard.view",
    "admin.properties.read",
    "admin.listings.read",
    "admin.listings.write",
    "admin.leads.read",
    "admin.leads.write",
    "admin.deals.read",
    "admin.deals.write",
    "admin.analytics.view"
  ],
  SUPPORT: [
    "admin.dashboard.view",
    "admin.support.manage",
    "admin.tickets.manage",
    "admin.tickets.read",
    "admin.listings.read",
    "admin.leads.read",
    "admin.analytics.view"
  ],
  VIEWER: [
    "admin.dashboard.view",
    "admin.analytics.view",
    "admin.properties.read",
    "admin.listings.read",
    "admin.leads.read",
    "admin.deals.read",
    "admin.users.read",
    "admin.organizations.read",
    "admin.tickets.read"
  ]
};

const ORGANIZATIONS: OrganizationSeed[] = [
  {
    slug: "salam-estate",
    legalName: "Salam Estate Riyadh",
    tradeName: "Salam Estate",
    licenseNo: "SER-1001",
    industry: "Real Estate Brokerage",
    size: 180,
    city: "Riyadh",
    region: "Riyadh",
    address: "King Fahd Rd, Al Olaya, Riyadh",
    phone: "+966112233441",
    email: "info@salamestate.sa",
    website: "https://salamestate.sa",
    timezone: "Asia/Riyadh",
    billingEmail: "finance@salamestate.sa",
    billingPhone: "+966118877661",
    metadata: {
      brandColor: "#056674"
    }
  },
  {
    slug: "aqar-horizon",
    legalName: "Aqar Horizon Jeddah",
    tradeName: "Aqar Horizon",
    licenseNo: "AHJ-2044",
    industry: "Real Estate Services",
    size: 135,
    city: "Jeddah",
    region: "Makkah",
    address: "Prince Sultan Rd, Al Rawdah, Jeddah",
    phone: "+966112233552",
    email: "contact@aqarhorizon.sa",
    website: "https://aqarhorizon.sa",
    timezone: "Asia/Riyadh",
    billingEmail: "accounts@aqarhorizon.sa",
    billingPhone: "+966126661122",
    metadata: {
      brandColor: "#8B5CF6"
    }
  },
  {
    slug: "najd-realty",
    legalName: "Najd Realty Dammam",
    tradeName: "Najd Realty",
    licenseNo: "NRD-3099",
    industry: "Property Management",
    size: 95,
    city: "Dammam",
    region: "Eastern Province",
    address: "King Saud Rd, Al Faisaliyah, Dammam",
    phone: "+966138887744",
    email: "hello@najdrealty.sa",
    website: "https://najdrealty.sa",
    timezone: "Asia/Riyadh",
    billingEmail: "billing@najdrealty.sa",
    billingPhone: "+966138887733",
    metadata: {
      brandColor: "#FF8A4C"
    }
  }
];

const serializeRoles = (roles: string[]): string => JSON.stringify(Array.from(new Set(roles)));

let passwordHashCache: string | null = null;

const ensurePasswordHash = async (): Promise<string> => {
  if (passwordHashCache) return passwordHashCache;
  passwordHashCache = await bcrypt.hash(PASSWORD_SEED, 12);
  return passwordHashCache;
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const buildUserSeeds = (ctx: SeedContext, organizationsMap: Map<string, { id: string; slug: string; domain: string }>): UserSeed[] => {
  const seeds: UserSeed[] = [];

  seeds.push({
    username: "global.admin",
    email: "admin@platform.sa",
    firstName: "Global",
    lastName: "Admin",
    phone: "+966500000001",
    roles: ["WEBSITE_ADMIN"],
    department: "Executive",
    jobTitle: "Head of Platform",
    approvalStatus: "APPROVED"
  });

  organizationsMap.forEach((orgMeta) => {
    const corpAdminFirst = ctx.faker.person.firstName();
    const corpAdminLast = ctx.faker.person.lastName();
    const corpUsername = `${orgMeta.slug}.admin`;
    seeds.push({
      username: corpUsername,
      email: `${corpUsername}@${orgMeta.domain}`,
      firstName: corpAdminFirst,
      lastName: corpAdminLast,
      phone: ctx.faker.phone.number("+9665########"),
      organizationLicense: orgMeta.slug,
      roles: ["CORP_ADMIN"],
      department: "Management",
      jobTitle: "General Manager",
      approvalStatus: "APPROVED"
    });

    for (let index = 1; index <= 4; index += 1) {
      const first = ctx.faker.person.firstName();
      const last = ctx.faker.person.lastName();
      const username = `${orgMeta.slug}.agent${index}`;
      seeds.push({
        username,
        email: `${username}@${orgMeta.domain}`,
        firstName: first,
        lastName: last,
        phone: ctx.faker.phone.number("+9665########"),
        organizationLicense: orgMeta.slug,
        roles: ["AGENT"],
        department: "Brokerage",
        jobTitle: index % 2 === 0 ? "Senior Property Advisor" : "Property Advisor",
        approvalStatus: "APPROVED"
      });
    }

    const supportName = ctx.faker.person.fullName();
    const [supportFirst, ...supportLastParts] = supportName.split(" ");
    const supportUsername = `${orgMeta.slug}.support`;
    seeds.push({
      username: supportUsername,
      email: `${supportUsername}@${orgMeta.domain}`,
      firstName: supportFirst,
      lastName: supportLastParts.join(" ") || ctx.faker.person.lastName(),
      phone: ctx.faker.phone.number("+9665########"),
      organizationLicense: orgMeta.slug,
      roles: ["SUPPORT"],
      department: "Customer Success",
      jobTitle: "Support Specialist",
      approvalStatus: "APPROVED"
    });

    const viewerFirst = ctx.faker.person.firstName();
    const viewerLast = ctx.faker.person.lastName();
    const viewerUsername = `${orgMeta.slug}.viewer`;
    seeds.push({
      username: viewerUsername,
      email: `${viewerUsername}@${orgMeta.domain}`,
      firstName: viewerFirst,
      lastName: viewerLast,
      phone: ctx.faker.phone.number("+9665########"),
      organizationLicense: orgMeta.slug,
      roles: ["VIEWER"],
      department: "Insights",
      jobTitle: "Portfolio Analyst",
      approvalStatus: "APPROVED"
    });
  });

  return seeds;
};

export const seedCore = async (ctx: SeedContext): Promise<SeedResult> => {
  const { prisma, logger } = ctx;
  const summary = [] as SeedResult["summary"];
  const credentials: SeedCredential[] = [];

  logger("Seeding permissions...");
  const permissionRecords = new Map<string, { id: string }>();
  for (const permission of PERMISSIONS) {
    const record = await prisma.permissions.upsert({
      where: { key: permission.key },
      update: {
        label: permission.label,
        description: permission.description,
        domain: permission.domain
      },
      create: {
        key: permission.key,
        label: permission.label,
        description: permission.description,
        domain: permission.domain
      }
    });
    permissionRecords.set(permission.key, { id: record.id });
  }

  logger("Seeding roles...");
  const roleRecords = new Map<string, { id: string; scope: string }>();
  for (const role of ROLE_DEFINITIONS) {
    const record = await prisma.system_roles.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
        scope: role.scope,
        isDefault: role.isDefault ?? false,
        isSystem: role.isSystem ?? false
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        scope: role.scope,
        isDefault: role.isDefault ?? false,
        isSystem: role.isSystem ?? false
      }
    });
    roleRecords.set(role.key, { id: record.id, scope: record.scope });
  }

  logger("Linking role permissions...");
  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleRecord = roleRecords.get(roleKey);
    if (!roleRecord) continue;
    const permittedIds = permissionKeys
      .map((key) => permissionRecords.get(key)?.id)
      .filter((value): value is string => Boolean(value));

    await prisma.role_permissions.deleteMany({
      where: {
        roleId: roleRecord.id,
        NOT: {
          permissionId: { in: permittedIds }
        }
      }
    });

    for (const permissionId of permittedIds) {
      await prisma.role_permissions.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRecord.id,
            permissionId
          }
        },
        update: {},
        create: {
          roleId: roleRecord.id,
          permissionId,
          createdBy: "seed"
        }
      });
    }
  }

  logger("Seeding organizations...");
  const organizationRecords = new Map<
    string,
    { id: string; slug: string; domain: string; licenseNo: string }
  >();

  for (const organization of ORGANIZATIONS) {
    const domain = organization.website.replace(/^https?:\/\//, "");
    const result = await prisma.organizations.upsert({
      where: { licenseNo: organization.licenseNo },
      update: {
        legalName: organization.legalName,
        tradeName: organization.tradeName,
        industry: organization.industry,
        size: organization.size,
        address: organization.address,
        phone: organization.phone,
        email: organization.email,
        website: organization.website,
        city: organization.city,
        region: organization.region,
        timezone: organization.timezone,
        billingEmail: organization.billingEmail,
        billingPhone: organization.billingPhone,
        metadata: organization.metadata ?? {}
      },
      create: {
        legalName: organization.legalName,
        tradeName: organization.tradeName,
        licenseNo: organization.licenseNo,
        industry: organization.industry,
        size: organization.size,
        address: organization.address,
        phone: organization.phone,
        email: organization.email,
        website: organization.website,
        city: organization.city,
        region: organization.region,
        timezone: organization.timezone,
        billingEmail: organization.billingEmail,
        billingPhone: organization.billingPhone,
        metadata: organization.metadata ?? {}
      }
    });
    organizationRecords.set(organization.slug, {
      id: result.id,
      slug: organization.slug,
      domain,
      licenseNo: organization.licenseNo
    });
  }

  logger("Seeding users, memberships and role assignments...");
  const passwordHash = await ensurePasswordHash();
  const userSeeds = buildUserSeeds(ctx, organizationRecords);
  const corpAdminByOrg = new Map<string, string>();

  for (const seed of userSeeds) {
    const organizationMeta = seed.organizationLicense
      ? organizationRecords.get(seed.organizationLicense)
      : undefined;

    const membershipOrganizationId = organizationMeta?.id ?? null;

    const now = new Date();
    const lastLoginAt = subDays(now, ctx.faker.number.int({ min: 1, max: 14 }));
    const lastSeenAt = subDays(now, ctx.faker.number.int({ min: 0, max: differenceInDays(now, lastLoginAt) || 1 }));

    const metadata = {
      approvalHistory: [
        {
          action: seed.approvalStatus ?? "APPROVED",
          adminId: "seed",
          at: now.toISOString()
        }
      ]
    };

    const user = await prisma.users.upsert({
      where: { username: seed.username },
      update: {
        email: seed.email,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        organizationId: membershipOrganizationId,
        roles: serializeRoles(seed.roles),
        passwordHash,
        isActive: true,
        approvalStatus: seed.approvalStatus ?? "APPROVED",
        jobTitle: seed.jobTitle,
        department: seed.department,
        metadata,
        lastLoginAt,
        lastSeenAt
      },
      create: {
        username: seed.username,
        email: seed.email,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        organizationId: membershipOrganizationId,
        roles: serializeRoles(seed.roles),
        passwordHash,
        isActive: true,
        approvalStatus: seed.approvalStatus ?? "APPROVED",
        jobTitle: seed.jobTitle,
        department: seed.department,
        metadata,
        createdAt: now,
        updatedAt: now,
        lastLoginAt,
        lastSeenAt
      }
    });

    const desiredRoleIds = seed.roles
      .map((key) => roleRecords.get(key)?.id)
      .filter((value): value is string => Boolean(value));

    await prisma.user_roles.deleteMany({
      where: {
        userId: user.id,
        NOT: {
          roleId: { in: desiredRoleIds }
        }
      }
    });

    for (const roleId of desiredRoleIds) {
      await prisma.user_roles.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId
          }
        },
        update: {
          assignedBy: "seed"
        },
        create: {
          userId: user.id,
          roleId,
          assignedBy: "seed"
        }
      });
    }

    if (membershipOrganizationId) {
      await prisma.organization_memberships.upsert({
        where: {
          organizationId_userId: {
            organizationId: membershipOrganizationId,
            userId: user.id
          }
        },
        update: {
          status: "ACTIVE",
          isPrimary: seed.roles.includes("CORP_ADMIN")
        },
        create: {
          organizationId: membershipOrganizationId,
          userId: user.id,
          roleId: seed.roles
            .map((roleKey) => roleRecords.get(roleKey)?.id)
            .find((roleId) => Boolean(roleId)) ?? null,
          status: "ACTIVE",
          isPrimary: seed.roles.includes("CORP_ADMIN"),
          joinedAt: now
        }
      });
    } else {
      // Global admin gets memberships to all orgs for visibility.
      for (const record of organizationRecords.values()) {
        await prisma.organization_memberships.upsert({
          where: {
            organizationId_userId: {
              organizationId: record.id,
              userId: user.id
            }
          },
          update: {
            status: "ACTIVE",
            isPrimary: false
          },
          create: {
            organizationId: record.id,
            userId: user.id,
            roleId: roleRecords.get("WEBSITE_ADMIN")?.id ?? null,
            status: "ACTIVE",
            isPrimary: false,
            joinedAt: now
          }
        });
      }
    }

    if (seed.roles.includes("CORP_ADMIN") && organizationMeta) {
      corpAdminByOrg.set(organizationMeta.id, user.id);
    }

    if (seed.roles.includes("WEBSITE_ADMIN")) {
      credentials.push({
        role: "Global Admin",
        email: seed.email,
        password: PASSWORD_SEED,
        organization: null
      });
    }

    if (seed.roles.includes("CORP_ADMIN") && organizationMeta) {
      credentials.push({
        role: "Corporate Admin",
        email: seed.email,
        password: PASSWORD_SEED,
        organization: organizationMeta.slug
      });
    }

    if (seed.roles.includes("AGENT") && organizationMeta) {
      // Only store the first agent credential per org.
      const existingAgentCredential = credentials.find(
        (credential) => credential.role === "Agent" && credential.organization === organizationMeta.slug
      );
      if (!existingAgentCredential) {
        credentials.push({
          role: "Agent",
          email: seed.email,
          password: PASSWORD_SEED,
          organization: organizationMeta.slug
        });
      }
    }
  }

  for (const [organizationId, userId] of corpAdminByOrg.entries()) {
    await prisma.organizations.update({
      where: { id: organizationId },
      data: { primaryContactId: userId }
    });
  }

  summary.push({ model: "permissions", count: await prisma.permissions.count() });
  summary.push({ model: "system_roles", count: await prisma.system_roles.count() });
  summary.push({ model: "role_permissions", count: await prisma.role_permissions.count() });
  summary.push({ model: "organizations", count: await prisma.organizations.count() });
  summary.push({ model: "users", count: await prisma.users.count() });
  summary.push({ model: "organization_memberships", count: await prisma.organization_memberships.count() });
  summary.push({ model: "user_roles", count: await prisma.user_roles.count() });

  return {
    summary,
    credentials
  };
};

export default seedCore;
