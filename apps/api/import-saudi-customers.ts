/**
 * import-saudi-customers.ts - Saudi Customers Import Script
 * 
 * Location: apps/api/ → Database Seeds & Population → import-saudi-customers.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Saudi customers import script. Provides:
 * - CSV customer data import
 * - Customer and lead creation from CSV
 * 
 * Related Files:
 * - apps/api/import-users-from-csv.ts - User CSV import
 */

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import {
  CustomerType,
  LeadStatus,
  type customers,
  type leads,
  type users
} from "@prisma/client";
import { prisma } from "./prismaClient";

type CustomerRecord = {
  "اسم العميل": string;
  "رقم الهاتف": string;
  "الجنس": string;
  "الحالة الاجتماعية": string;
  "العمر": string;
  "عدد المعالين": string;
  "المهنة": string;
  "متوسط الدخل الشهري": string;
  "نوع العقار الذي يبحث عنه": string;
  "ميزانية العميل": string;
  "المدينة": string;
};

const IMPORT_SOURCE = "استيراد بيانات";
const DATASET_PATH = "data/raw-assets/saudi_customers_dataset_with_city (2)_1756513642047.csv";

function convertMaritalStatus(arabicStatus: string): string {
  const statusMap: Record<string, string> = {
    "أعزب": "single",
    "عزباء": "single",
    "متزوج": "married",
    "متزوجة": "married",
    "مطلق": "divorced",
    "مطلقة": "divorced",
    "أرمل": "widowed",
    "أرملة": "widowed"
  };
  return statusMap[arabicStatus] ?? "single";
}

function convertBudgetRange(budget: number): string {
  if (budget < 500_000) return "أقل من 500,000 ريال";
  if (budget < 1_000_000) return "500,000 - 1,000,000 ريال";
  if (budget < 2_000_000) return "1,000,000 - 2,000,000 ريال";
  if (budget < 3_000_000) return "2,000,000 - 3,000,000 ريال";
  if (budget < 5_000_000) return "3,000,000 - 5,000,000 ريال";
  return "أكثر من 5,000,000 ريال";
}

function splitName(fullName?: string): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: "غير محدد", lastName: "العميل" };
  }
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "غير محدد", lastName: "العميل" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "العميل" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function normalizePhone(phone?: string): string {
  if (!phone) return "0500000000";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("05")) return digits;
  if (digits.startsWith("5")) return `0${digits}`;
  if (digits.startsWith("966")) return `0${digits.slice(3)}`;
  if (digits.startsWith("00966")) return `0${digits.slice(5)}`;
  if (digits.length === 9) return `0${digits}`;
  return digits || "0500000000";
}

function generateEmail(fullName: string, phone: string): string {
  const { firstName, lastName } = splitName(fullName);
  const sanitized = `${firstName}.${lastName}`
    .replace(/[^\p{Script=Arabic}A-Za-z0-9\.]/gu, "")
    .replace(/\.+/g, ".")
    .toLowerCase();
  const suffix = phone.replace(/\D/g, "").slice(-4) || "0000";
  return `${sanitized || "customer"}${suffix}@customer.sa`;
}

async function findImportAgent(): Promise<users> {
  const byRole = await prisma.users.findFirst({
    where: {
      isActive: true,
      roles: {
        contains: '"CORP_AGENT"'
      }
    },
    orderBy: { createdAt: "asc" }
  });
  if (byRole) return byRole;

  const fallback = await prisma.users.findFirst({ orderBy: { createdAt: "asc" } });
  if (!fallback) {
    throw new Error("لم يتم العثور على مستخدم لتعيين العملاء له. الرجاء تشغيل بيانات seed أولاً.");
  }
  return fallback;
}

async function resolveOrganization(agent: users) {
  if (agent.organizationId) {
    const organization = await prisma.organizations.findUnique({ where: { id: agent.organizationId } });
    if (organization) {
      return organization;
    }
  }

  const organization = await prisma.organizations.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) {
    throw new Error("لا توجد منظمات مسجلة في قاعدة البيانات.");
  }
  return organization;
}

async function clearExistingData(organizationId: string) {
  console.log("🗑️ تنظيف بيانات الاستيراد السابقة...");

  const importedLeads = await prisma.leads.findMany({
    where: {
      organizationId,
      source: IMPORT_SOURCE
    },
    select: { id: true }
  });

  const leadIds = importedLeads.map((lead) => lead.id);

  if (leadIds.length) {
    await prisma.contact_logs.deleteMany({ where: { leadId: { in: leadIds } } });
    await prisma.messages.deleteMany({ where: { leadId: { in: leadIds } } });
    await prisma.leads.deleteMany({ where: { id: { in: leadIds } } });
  }

  await prisma.customers.deleteMany({
    where: {
      organizationId,
      source: IMPORT_SOURCE
    }
  });

  console.log("✅ تم مسح بيانات الاستيراد السابقة");
}

async function upsertCustomer(options: {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string | null;
  notes: string;
}): Promise<customers> {
  const { organizationId, firstName, lastName, phone, email, city, notes } = options;

  const existing = await prisma.customers.findFirst({
    where: {
      organizationId,
      phone
    }
  });

  if (existing) {
    return prisma.customers.update({
      where: { id: existing.id },
      data: {
        firstName,
        lastName,
        email,
        city,
        source: IMPORT_SOURCE,
        notes
      }
    });
  }

  return prisma.customers.create({
    data: {
      id: randomUUID(),
      organizationId,
      type: CustomerType.BUYER,
      firstName,
      lastName,
      email,
      phone,
      city,
      source: IMPORT_SOURCE,
      notes
    }
  });
}

async function createLead(options: {
  agentId: string;
  organizationId: string;
  customerId: string;
  notes: string;
}): Promise<leads> {
  const { agentId, organizationId, customerId, notes } = options;
  const now = new Date();
  return prisma.leads.create({
    data: {
      id: randomUUID(),
      agentId,
      organizationId,
      customerId,
      status: LeadStatus.NEW,
      source: IMPORT_SOURCE,
      notes,
      createdAt: now,
      updatedAt: now
    }
  });
}

async function importSaudiCustomers() {
  console.log("🚀 بدء استيراد بيانات العملاء السعوديين...");

  const csvContent = readFileSync(DATASET_PATH, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    encoding: "utf8"
  }) as CustomerRecord[];

  console.log(`📊 تم العثور على ${records.length} عميل في الملف`);

  const agent = await findImportAgent();
  const organization = await resolveOrganization(agent);

  await clearExistingData(organization.id);

  let importedCount = 0;

  for (const record of records) {
    const fullName = (record?.["اسم العميل"] ?? "غير محدد").trim();
    const { firstName, lastName } = splitName(fullName);
    const rawPhone = record?.["رقم الهاتف"] ?? "";
    const phone = normalizePhone(rawPhone);
    const maritalStatus = convertMaritalStatus(record?.["الحالة الاجتماعية"] ?? "");
    const age = Number.parseInt(record?.["العمر"] ?? "", 10) || undefined;
    const dependents = Number.parseInt(record?.["عدد المعالين"] ?? "", 10) || undefined;
    const profession = record?.["المهنة"] ?? "غير محدد";
    const income = record?.["متوسط الدخل الشهري"] ?? "0";
    const propertyType = record?.["نوع العقار الذي يبحث عنه"] ?? "شقة";
    const budget = Number.parseInt(record?.["ميزانية العميل"] ?? "", 10) || 0;
    const city = record?.["المدينة"]?.trim() || null;

    const email = generateEmail(fullName, phone);
    const budgetRange = convertBudgetRange(budget);

    const notes = [
      `المهنة: ${profession}`,
      `متوسط الدخل الشهري: ${income} ريال`,
      `نوع العقار المطلوب: ${propertyType}`,
      `الميزانية: ${budget.toLocaleString("ar-EG")} ريال`,
      `الحالة الاجتماعية: ${maritalStatus}`,
      dependents ? `عدد المعالين: ${dependents}` : null,
      age ? `العمر: ${age}` : null,
      `نطاق الميزانية: ${budgetRange}`
    ]
      .filter(Boolean)
      .join("\n");

    const customer = await upsertCustomer({
      organizationId: organization.id,
      firstName,
      lastName,
      phone,
      email,
      city,
      notes
    });

    await createLead({
      agentId: agent.id,
      organizationId: organization.id,
      customerId: customer.id,
      notes
    });

    importedCount += 1;
  }

  console.log(`✅ تم استيراد ${importedCount} عميل وربطهم بالمنصة بنجاح!`);
}

async function main() {
  try {
    await importSaudiCustomers();
    console.log("🎉 اكتمل استيراد البيانات السعودية");
    process.exit(0);
  } catch (error) {
    console.error("❌ خطأ في استيراد البيانات:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { importSaudiCustomers };
