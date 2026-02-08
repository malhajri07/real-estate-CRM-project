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
     * 2. Support Categories (Context Data)
     */
    const supportCategories = [
        { name: 'الدعم الفني', slug: 'technical-support', order: 1 },
        { name: 'الاستفسارات العامة', slug: 'general-inquiries', order: 2 },
        { name: 'المدفوعات', slug: 'payments', order: 3 },
        { name: 'حسابي', slug: 'my-account', order: 4 },
    ];

    for (const cat of supportCategories) {
        await (prisma as any).support_categories.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, displayOrder: cat.order },
            create: {
                name: cat.name,
                slug: cat.slug,
                displayOrder: cat.order,
                isActive: true
            }
        });
    }

    /*
     * 3. Support Templates (Context Data)
     */
    const supportTemplates = [
        { title: 'رد تلقائي - استلام', content: 'نشكرك على تواصلك معنا. تم استلام طلبك ورقم التذكرة هو...' },
        { title: 'طلب معلومات إضافية', content: 'نحتاج إلى مزيد من التفاصيل لمساعدتك في حل المشكلة...' },
        { title: 'إغلاق التذكرة', content: 'نود إعلامك بأنه تم حل المشكلة وإغلاق التذكرة. شكراً لك.' },
    ];

    for (const tmpl of supportTemplates) {
        // Upsert on title for now as we don't have slugs
        const existing = await (prisma as any).support_templates.findFirst({ where: { title: tmpl.title } });
        if (existing) {
            await (prisma as any).support_templates.update({
                where: { id: existing.id },
                data: { content: tmpl.content }
            });
        } else {
            await (prisma as any).support_templates.create({
                data: {
                    title: tmpl.title,
                    content: tmpl.content,
                    isActive: true
                }
            });
        }
    }


    // Ensure system user exists for audit log
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    await prisma.users.upsert({
        where: { id: systemUserId },
        update: {},
        create: {
            id: systemUserId,
            username: 'system_seed',
            firstName: 'System',
            lastName: 'Seed',
            passwordHash: 'system-locked',
            roles: '["SYSTEM"]',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });

    const auditMeta = {
        userId: systemUserId,
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
