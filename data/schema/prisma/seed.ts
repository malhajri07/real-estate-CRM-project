import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Property Categories (Context Data)
    const categories = [
        { code: 'RESIDENTIAL', nameAr: 'سكني', nameEn: 'Residential' },
        { code: 'COMMERCIAL', nameAr: 'تجاري', nameEn: 'Commercial' },
        { code: 'INDUSTRIAL', nameAr: 'صناعي', nameEn: 'Industrial' },
        { code: 'LAND', nameAr: 'أراضي', nameEn: 'Land' },
    ];
    for (const cat of categories) {
        // Assume 'property_category' is the model name based on storage-prisma.ts
        // We use any type casting to avoid TS errors if the types aren't fully generated in this environment
        await (prisma as any).property_category.upsert({
            where: { code: cat.code },
            update: {
                name_ar: cat.nameAr,
                name_en: cat.nameEn,
            },
            create: {
                code: cat.code,
                name_ar: cat.nameAr,
                name_en: cat.nameEn,
                description: `${cat.nameEn} properties`,
                icon: 'home', // Default icon
                display_order: 1,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    /*
     * 2. System Roles (Context Data)
     * Roles are currently stored as JSON strings in users table, but we might want a reference table.
     * Skipping for now as no schema support exists, but documenting the intent.
     */

    const auditMeta = {
        userId: 'system-seed',
        action: 'SEED_COMPLETED',
        entity: 'system',
        entityId: 'global',
        createdAt: new Date()
    };

    // Log the seed action
    await prisma.audit_logs.create({
        data: auditMeta
    });

    console.log('✅ Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
