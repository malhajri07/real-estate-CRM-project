/**
 * fix-hardcoded-rtl.ts
 * 
 * Script to fix hardcoded dir="rtl" and dir="ltr" in platform pages
 * Replaces with dir={dir} from useLanguage() hook
 * 
 * Run with: npx tsx scripts/fix-hardcoded-rtl.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const PLATFORM_PAGES_DIR = 'apps/web/src/pages/platform';

async function fixHardcodedRTL() {
  console.log('🔍 Scanning for hardcoded RTL directions...\n');

  // Find all TypeScript files in platform pages
  const files = await glob(`${PLATFORM_PAGES_DIR}/**/*.tsx`, {
    ignore: ['**/node_modules/**', '**/*.test.tsx', '**/*.spec.tsx']
  });

  let fixedCount = 0;
  const filesToFix: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const hasHardcodedRTL = /dir=["']rtl["']|dir=["']ltr["']/.test(content);
    const hasUseLanguage = /useLanguage/.test(content);
    const hasDirFromHook = /dir=\{dir\}/.test(content);

    if (hasHardcodedRTL) {
      filesToFix.push(file);
      console.log(`⚠️  Found hardcoded direction in: ${file}`);
      
      if (!hasUseLanguage) {
        console.log(`   ⚠️  Missing useLanguage hook import`);
      }
    }
  }

  console.log(`\n📊 Found ${filesToFix.length} files with hardcoded directions\n`);

  if (filesToFix.length === 0) {
    console.log('✅ No files need fixing!');
    return;
  }

  console.log('📝 Files that need manual fixing:');
  filesToFix.forEach(file => console.log(`   - ${file}`));
  console.log('\n💡 Please fix these files manually by:');
  console.log('   1. Adding: import { useLanguage } from "@/contexts/LanguageContext";');
  console.log('   2. Adding: const { dir } = useLanguage();');
  console.log('   3. Replacing: dir="rtl" or dir="ltr" with dir={dir}');
}

fixHardcodedRTL().catch(console.error);
