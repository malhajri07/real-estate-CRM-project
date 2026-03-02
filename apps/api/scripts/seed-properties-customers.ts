/**
 * seed-properties-customers.ts
 *
 * Seeds 50 Properties and 100 Customers with realistic MENA-based data.
 * Creates an organization for agent1 if one doesn't exist, then links
 * customers (with associated leads) and properties to that agent/org.
 *
 * Run: pnpm run db:seed-demo
 */

import { prisma } from '../prismaClient';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const FIRST_NAMES_AR = [
  'أحمد', 'محمد', 'عبدالله', 'سعود', 'خالد', 'فهد', 'تركي', 'سلطان',
  'ناصر', 'عمر', 'يوسف', 'إبراهيم', 'عبدالرحمن', 'بندر', 'ماجد',
  'فاطمة', 'نورا', 'سارة', 'مريم', 'هند', 'لطيفة', 'ريم', 'دلال',
  'منيرة', 'عائشة', 'أمل', 'هيا', 'لمى', 'جواهر', 'مها',
];

const LAST_NAMES_AR = [
  'العتيبي', 'القحطاني', 'الشمري', 'الدوسري', 'الحربي', 'المطيري',
  'الغامدي', 'الزهراني', 'السبيعي', 'البلوي', 'العنزي', 'الرشيدي',
  'الشهري', 'المالكي', 'السلمي', 'الجهني', 'الثبيتي', 'الحارثي',
  'الأحمدي', 'العمري',
];

const CITIES = [
  { name: 'الرياض', districts: ['الملقا', 'النرجس', 'العليا', 'السليمانية', 'حطين', 'الياسمين', 'الرمال', 'العارض'] },
  { name: 'جدة', districts: ['الحمراء', 'الروضة', 'الشاطئ', 'أبحر الشمالية', 'الزهراء', 'المرجان', 'الفيصلية'] },
  { name: 'الدمام', districts: ['الشاطئ الغربي', 'الفيصلية', 'النزهة', 'الريان', 'المنار', 'الجلوية'] },
  { name: 'مكة المكرمة', districts: ['العزيزية', 'الشوقية', 'النسيم', 'الرصيفة', 'العوالي'] },
  { name: 'المدينة المنورة', districts: ['العزيزية', 'قباء', 'الدفاع', 'السلام', 'الملك فهد'] },
];

const PROPERTY_TYPES = ['apartment', 'villa', 'land', 'office', 'warehouse'];

const PROPERTY_TITLES: Record<string, string[]> = {
  apartment: [
    'شقة فاخرة', 'شقة عصرية', 'شقة واسعة', 'شقة مميزة', 'شقة راقية',
    'شقة بإطلالة رائعة', 'شقة دوبلكس', 'شقة مفروشة بالكامل',
  ],
  villa: [
    'فيلا مع مسبح', 'فيلا فاخرة', 'فيلا عصرية', 'فيلا مستقلة',
    'فيلا بتصميم حديث', 'فيلا دوبلكس', 'فيلا مع حديقة واسعة',
  ],
  land: [
    'أرض سكنية', 'أرض تجارية', 'أرض بموقع مميز', 'أرض استثمارية',
    'أرض على شارع رئيسي',
  ],
  office: [
    'مكتب تجاري', 'مكتب بموقع حيوي', 'مكتب مجهز بالكامل',
    'مكتب في برج تجاري', 'مساحة مكتبية مميزة',
  ],
  warehouse: [
    'مستودع كبير', 'مستودع بموقع صناعي', 'مستودع مجهز',
    'مخزن تجاري واسع',
  ],
};

const PROPERTY_STATUSES: Array<'ACTIVE' | 'SOLD' | 'RENTED' | 'PENDING_APPROVAL'> = [
  'ACTIVE', 'SOLD', 'RENTED', 'PENDING_APPROVAL',
];

const LEAD_STATUSES: Array<'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST'> = [
  'NEW', 'IN_PROGRESS', 'WON', 'LOST',
];

const CUSTOMER_TYPES: Array<'BUYER' | 'SELLER' | 'BOTH'> = ['BUYER', 'SELLER', 'BOTH'];

const SOURCES = ['website', 'referral', 'walk_in', 'social_media', 'phone', 'whatsapp'];

const NATIONALITIES = ['سعودي', 'إماراتي', 'كويتي', 'بحريني', 'قطري', 'عماني', 'أردني', 'مصري'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function saudiPhone(): string {
  const prefix = pick(['50', '53', '54', '55', '56', '59']);
  const rest = faker.string.numeric(7);
  return `+966${prefix}${rest}`;
}

function generatePropertyTitle(type: string, city: { name: string; districts: string[] }): string {
  const titles = PROPERTY_TITLES[type] || PROPERTY_TITLES.apartment;
  const district = pick(city.districts);
  return `${pick(titles)} في حي ${district}، ${city.name}`;
}

function priceForType(type: string): number {
  const ranges: Record<string, [number, number]> = {
    apartment: [500_000, 3_000_000],
    villa: [1_500_000, 10_000_000],
    land: [300_000, 8_000_000],
    office: [400_000, 5_000_000],
    warehouse: [500_000, 4_000_000],
  };
  const [min, max] = ranges[type] || [500_000, 5_000_000];
  return Math.round((min + Math.random() * (max - min)) / 1000) * 1000;
}

function bedroomsForType(type: string): number | null {
  if (type === 'land' || type === 'warehouse') return null;
  if (type === 'office') return faker.number.int({ min: 0, max: 2 });
  if (type === 'apartment') return faker.number.int({ min: 1, max: 5 });
  return faker.number.int({ min: 3, max: 8 });
}

function bathroomsForType(type: string): number | null {
  if (type === 'land' || type === 'warehouse') return null;
  if (type === 'office') return faker.number.int({ min: 1, max: 2 });
  if (type === 'apartment') return faker.number.int({ min: 1, max: 3 });
  return faker.number.int({ min: 2, max: 6 });
}

function areaForType(type: string): number {
  const ranges: Record<string, [number, number]> = {
    apartment: [80, 350],
    villa: [250, 1200],
    land: [300, 5000],
    office: [50, 500],
    warehouse: [200, 3000],
  };
  const [min, max] = ranges[type] || [100, 500];
  return faker.number.int({ min, max });
}

async function main() {
  console.log('🌱 Seeding 50 Properties and 100 Customers...\n');

  // Find agent1 user
  const agent = await prisma.users.findUnique({ where: { username: 'agent1' } });
  if (!agent) {
    console.error('❌ agent1 user not found. Run "pnpm run db:agent1" first.');
    process.exit(1);
  }
  console.log(`✅ Found agent1: ${agent.id}`);

  // Find or create organization for agent1
  let orgId = agent.organizationId;
  if (!orgId) {
    const org = await prisma.organizations.create({
      data: {
        id: randomUUID(),
        legalName: 'مكتب الوكيل الأول للوساطة العقارية',
        tradeName: 'عقارات الوكيل الأول',
        licenseNo: `ORG-${randomUUID().substring(0, 8).toUpperCase()}`,
        status: 'ACTIVE',
        city: 'الرياض',
        region: 'منطقة الرياض',
        phone: '+966500000001',
        email: 'info@agent1-realty.sa',
      },
    });
    orgId = org.id;
    await prisma.users.update({
      where: { id: agent.id },
      data: { organizationId: orgId },
    });
    console.log(`✅ Created organization: ${org.tradeName} (${orgId})`);
  } else {
    console.log(`✅ Using existing organization: ${orgId}`);
  }

  // --- Seed 100 Customers with linked Leads ---
  console.log('\n📇 Creating 100 customers with leads...');
  let customerCount = 0;
  let leadCount = 0;

  for (let i = 0; i < 100; i++) {
    const firstName = pick(FIRST_NAMES_AR);
    const lastName = pick(LAST_NAMES_AR);
    const city = pick(CITIES);
    const phone = saudiPhone();
    const customerType = pick(CUSTOMER_TYPES);

    const customer = await prisma.customers.create({
      data: {
        id: randomUUID(),
        organizationId: orgId,
        type: customerType,
        firstName,
        lastName,
        email: `${faker.internet.username().toLowerCase()}@example.sa`,
        phone,
        whatsappNumber: phone,
        preferredLanguage: 'ar',
        city: city.name,
        district: pick(city.districts),
        nationality: pick(NATIONALITIES),
        source: pick(SOURCES),
        notes: `ميزانية تقريبية: ${faker.number.int({ min: 300, max: 10_000 })}K ر.س`,
      },
    });
    customerCount++;

    const lead = await prisma.leads.create({
      data: {
        id: randomUUID(),
        agentId: agent.id,
        organizationId: orgId,
        customerId: customer.id,
        status: pick(LEAD_STATUSES),
        source: pick(SOURCES),
        priority: faker.number.int({ min: 1, max: 5 }),
        notes: `عميل مهتم بـ ${customerType === 'BUYER' ? 'الشراء' : customerType === 'SELLER' ? 'البيع' : 'الشراء والبيع'}`,
        assignedAt: faker.date.recent({ days: 90 }),
        lastContactAt: faker.date.recent({ days: 30 }),
      },
    });
    leadCount++;

    if ((i + 1) % 25 === 0) {
      console.log(`  ${i + 1}/100 customers created...`);
    }
  }
  console.log(`✅ Created ${customerCount} customers and ${leadCount} leads`);

  // --- Seed 50 Properties ---
  console.log('\n🏠 Creating 50 properties...');
  let propCount = 0;

  for (let i = 0; i < 50; i++) {
    const type = pick(PROPERTY_TYPES);
    const city = pick(CITIES);
    const district = pick(city.districts);
    const price = priceForType(type);
    const bedrooms = bedroomsForType(type);
    const bathrooms = bathroomsForType(type);
    const area = areaForType(type);
    const status = pick(PROPERTY_STATUSES);

    await prisma.properties.create({
      data: {
        id: randomUUID(),
        agentId: agent.id,
        organizationId: orgId,
        title: generatePropertyTitle(type, city),
        description: `${pick(PROPERTY_TITLES[type] || ['عقار'])} بمساحة ${area} م² في حي ${district}، ${city.name}. ${bedrooms ? `${bedrooms} غرف نوم و ${bathrooms} حمامات.` : ''} السعر ${price.toLocaleString()} ر.س`,
        type,
        category: type === 'land' ? 'land' : type === 'warehouse' || type === 'office' ? 'commercial' : 'residential',
        city: city.name,
        district,
        address: `حي ${district}، ${city.name}`,
        bedrooms,
        bathrooms,
        areaSqm: area,
        price,
        status,
        visibility: 'public',
        features: JSON.stringify(
          faker.helpers.arrayElements(
            ['مسبح', 'حديقة', 'مصعد', 'موقف سيارات', 'تكييف مركزي', 'غرفة خادمة', 'غرفة سائق', 'مطبخ مجهز', 'شرفة'],
            { min: 2, max: 5 },
          ),
        ),
        createdAt: faker.date.recent({ days: 180 }),
        updatedAt: new Date(),
      },
    });
    propCount++;

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/50 properties created...`);
    }
  }
  console.log(`✅ Created ${propCount} properties`);

  // --- Summary ---
  const totalCustomers = await prisma.customers.count();
  const totalLeads = await prisma.leads.count();
  const totalProperties = await prisma.properties.count();

  console.log('\n📊 Database Summary:');
  console.log(`  Customers: ${totalCustomers}`);
  console.log(`  Leads:     ${totalLeads}`);
  console.log(`  Properties: ${totalProperties}`);
  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
