/**
 * import-users-from-csv.ts - Users CSV Import Script
 * 
 * Location: apps/api/ → Database Seeds & Population → import-users-from-csv.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Users CSV import script. Provides:
 * - CSV user data import
 * - User and organization creation from CSV
 * 
 * Related Files:
 * - apps/api/import-saudi-customers.ts - Customer CSV import
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { OrganizationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from './prismaClient';
import { hashPassword } from './auth';

type CsvRow = {
  'First Name (AR)': string;
  'Last Name (AR)': string;
  'Role/Type': string;
  'Account ID': string;
  'Account Number': string;
  'Parent Account': string;
  'Username (EN)': string;
  'Password': string;
  'Mobile': string;
  'Create Date': string;
  'Expiry Date': string;
  'Status': string;
};

// Adopted CSV Role/Type -> App role mapping
// Source labels come from the CSV "Role/Type" column
const roleMap: Record<string, string> = {
  // Admins
  'Employee Admin': 'WEBSITE_ADMIN', // Full control
  'Sub-Admin': 'SUB_ADMIN',          // Sub-account admin (limited system control)

  // Customers
  'Provider Customer': 'SELLER',     // Property owner/provider
  'Seeker Customer': 'BUYER',        // Property seeker/buyer

  // Agents & Corporate
  'Agent Corporate': 'CORP_AGENT',
  'Agent Individual': 'INDIV_AGENT',
  'Corporate Account': 'CORP_OWNER',
};

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return null;
  let p = phone.toString().replace(/[^0-9]/g, '');
  if (p.startsWith('0')) return p;
  if (p.startsWith('5')) return '0' + p; // Saudi mobile like 5XXXXXXXX -> 05XXXXXXXX
  if (p.length >= 8) return '0' + p; // fallback
  return p || null;
}

function parseDate(input?: string) {
  if (!input) return undefined;
  const s = input.trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return undefined;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  const dt = new Date(y, mo, d);
  if (isNaN(dt.getTime())) return undefined;
  return dt;
}

async function upsertOrganizationFromRow(row: CsvRow): Promise<string | undefined> {
  // Prefer parent account if present, else account number
  const parentAccount = row['Parent Account']?.toString().trim();
  const accountNumber = row['Account Number']?.toString().trim();
  const orgKey = (parentAccount || accountNumber)?.trim();
  const accountId = row['Account ID']?.toString().trim();

  // Only create orgs for corporate entries (E)
  if (!orgKey || accountId !== 'E') return undefined;

  const legal = `Org ${orgKey}`;
  const trade = legal;

  const found = await prisma.organization.findFirst({ where: { licenseNo: orgKey } });
  if (found) return found.id;

  const created = await prisma.organization.create({
    data: {
      id: randomUUID(),
      legalName: legal,
      tradeName: trade,
      licenseNo: orgKey,
      status: OrganizationStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });
  return created.id;
}

async function main() {
  const filePath = process.argv[2] || 'data/raw-assets/real_estate_users_500_clean.csv';
  console.log('📦 Importing users from CSV:', filePath);
  const csv = readFileSync(filePath, 'utf-8');

  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of records) {
    try {
      const firstName = row['First Name (AR)']?.toString().trim() || '';
      const lastName = row['Last Name (AR)']?.toString().trim() || '';
      const username = row['Username (EN)']?.toString().trim().toLowerCase();
      const plainPassword = row['Password']?.toString() || 'Passw0rd!';
      const phone = normalizePhone(row['Mobile']);
      const status = row['Status']?.toString().toLowerCase();
      const isActive = status === 'active';
      const mappedRole = roleMap[row['Role/Type']] || 'BUYER';
      const rolesJson = JSON.stringify([mappedRole]);
      const orgId = await upsertOrganizationFromRow(row);
      const createdAt = parseDate(row['Create Date']);

      if (!username || !firstName || !lastName) {
        skipped++;
        continue;
      }

      const passwordHash = await hashPassword(plainPassword);

      // Upsert by username (unique)
      const existing = await prisma.users.findUnique({ where: { username } });
      if (existing) {
        await prisma.users.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            phone: phone || existing.phone,
            roles: rolesJson,
            isActive,
            organizationId: orgId ?? existing.organizationId ?? null,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.users.create({
          data: {
            id: randomUUID(),
            username,
            email: null,
            phone,
            firstName,
            lastName,
            passwordHash,
            roles: rolesJson,
            isActive,
            organizationId: orgId ?? null,
            updatedAt: new Date(),
            ...(createdAt ? { createdAt } : {}),
          },
        });
        created++;
      }
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }

  console.log('✅ Import finished:', { created, updated, skipped, errors: errors.length });
  if (errors.length) {
    console.log('Some errors:', errors.slice(0, 5));
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
