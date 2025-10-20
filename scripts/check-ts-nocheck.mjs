#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const allowlist = new Set([
  'apps/web/src/components/maps/PropertyMap.tsx',
  'apps/api/seed-rbac.ts',
  'apps/api/seedData.ts',
  'apps/api/utils/mailer.ts',
  'apps/api/services/landingService.ts',
  'apps/api/vite.ts',
  'apps/api/createAdmin1AndPopulate.ts',
  'apps/api/seed-saudi-regions.ts',
  'apps/api/populateAdmin1Data.ts',
  'apps/api/routes/rbac-admin.ts',
  'apps/api/spatial-queries.ts',
  'apps/api/src/middleware/auth.ts',
]);

const gitFilesOutput = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' });
const gitFiles = gitFilesOutput.split('\n').filter(Boolean);
const gitFilesSet = new Set(gitFiles);

const offenders = [];
const staleAllowlist = [];

for (const relativePath of gitFiles) {
  const absolutePath = resolve(repoRoot, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  if (content.includes('@ts-nocheck') && !allowlist.has(relativePath)) {
    offenders.push(relativePath);
  }
}

for (const allowedPath of allowlist) {
  if (!gitFilesSet.has(allowedPath)) {
    staleAllowlist.push(`${allowedPath} (missing file)`);
    continue;
  }
  const content = readFileSync(resolve(repoRoot, allowedPath), 'utf8');
  if (!content.includes('@ts-nocheck')) {
    staleAllowlist.push(`${allowedPath} (directive removed)`);
  }
}

if (staleAllowlist.length > 0) {
  console.warn('⚠️ Detected allowlist entries without @ts-nocheck directives:');
  for (const entry of staleAllowlist) {
    console.warn(` - ${entry}`);
  }
}

if (offenders.length > 0) {
  console.error('❌ Found unauthorized @ts-nocheck directives in:');
  for (const entry of offenders) {
    console.error(` - ${entry}`);
  }
  process.exit(1);
}
