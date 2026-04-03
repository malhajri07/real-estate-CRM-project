/**
 * seed-full-data.ts — Comprehensive database seeder
 *
 * Seeds:
 * - 20 organizations
 * - 50 individual agents
 * - 200 corporate agents (across organizations)
 * - 11,000 seller requests
 * - 2,000 buyer requests
 * - 2,000 properties (all types across Saudi regions)
 * - 500+ forum posts
 * - 13 forum channels (one per Saudi region)
 * - Leads, deals, appointments, activities
 *
 * Run: npx tsx apps/api/scripts/seed-full-data.ts
 */

import bcrypt from "bcryptjs";
import { prisma } from "../prismaClient";

// ── Saudi Data ──────────────────────────────────────────────────────────────

const REGIONS = [
  "منطقة الرياض", "منطقة مكة المكرمة", "المنطقة الشرقية", "منطقة المدينة المنورة",
  "منطقة القصيم", "منطقة عسير", "منطقة تبوك", "منطقة حائل",
  "منطقة الحدود الشمالية", "منطقة جازان", "منطقة نجران", "منطقة الباحة", "منطقة الجوف",
];

const CITIES: Record<string, string[]> = {
  "منطقة الرياض": ["الرياض", "الخرج", "الدرعية", "المزاحمية", "الدوادمي"],
  "منطقة مكة المكرمة": ["مكة المكرمة", "جدة", "الطائف", "رابغ", "القنفذة"],
  "المنطقة الشرقية": ["الدمام", "الخبر", "الظهران", "الأحساء", "القطيف", "الجبيل"],
  "منطقة المدينة المنورة": ["المدينة المنورة", "ينبع", "العلا", "بدر"],
  "منطقة القصيم": ["بريدة", "عنيزة", "الرس"],
  "منطقة عسير": ["أبها", "خميس مشيط", "بيشة", "النماص"],
  "منطقة تبوك": ["تبوك", "الوجه", "ضباء"],
  "منطقة حائل": ["حائل", "بقعاء"],
  "منطقة الحدود الشمالية": ["عرعر", "رفحاء", "طريف"],
  "منطقة جازان": ["جازان", "صبيا", "أبو عريش"],
  "منطقة نجران": ["نجران", "شرورة"],
  "منطقة الباحة": ["الباحة", "بلجرشي"],
  "منطقة الجوف": ["سكاكا", "دومة الجندل"],
};

const DISTRICTS = ["حي الياسمين", "حي النرجس", "حي العليا", "حي السلامة", "حي الروضة", "حي النزهة", "حي الورود", "حي الملك فهد", "حي الشفا", "حي الحمراء", "حي الربوة", "حي الفيصلية", "حي المروج", "حي العزيزية", "حي السويدي"];

const PROPERTY_TYPES = ["apartment", "villa", "land", "commercial", "office", "warehouse", "building", "chalet"];
const LISTING_TYPES = ["sale", "rent"];

const FIRST_NAMES_M = ["محمد", "أحمد", "عبدالله", "فهد", "سعود", "خالد", "عمر", "سلطان", "تركي", "ناصر", "إبراهيم", "صالح", "عبدالرحمن", "بندر", "ماجد", "وليد", "حمد", "مشعل", "نواف", "فيصل"];
const FIRST_NAMES_F = ["نورة", "سارة", "هند", "ريم", "لمى", "دلال", "منال", "أمل", "فاطمة", "عائشة"];
const LAST_NAMES = ["العتيبي", "الحربي", "القحطاني", "الشمري", "الدوسري", "المطيري", "الغامدي", "الزهراني", "السبيعي", "البلوي", "العنزي", "الرشيدي", "المالكي", "الأحمدي", "السلمي", "الحازمي", "الشهري", "البقمي", "الثبيتي", "اليامي"];

const ORG_NAMES = [
  "شركة دار الأركان العقارية", "مجموعة إعمار السعودية", "شركة جبل عمر",
  "شركة المراكز العربية", "مجموعة بن لادن العقارية", "شركة رافال للتطوير",
  "شركة سدكو للتطوير", "مؤسسة الراجحي العقارية", "شركة كيان العقارية",
  "شركة طيبة للاستثمار", "شركة المعذر العقارية", "شركة ريبورتاج العقارية",
  "مجموعة العقيلي العقارية", "شركة الماجدية للتطوير", "شركة رتال للتطوير العمراني",
  "شركة روشن العقارية", "شركة وادي مكة العقارية", "شركة جدة الاقتصادية",
  "شركة المشاريع المتحدة", "شركة دار التمليك",
];

const FORUM_TOPICS = [
  "أفضل المناطق للاستثمار العقاري", "نصائح لشراء شقة لأول مرة", "كيف تختار وسيط عقاري موثوق",
  "توقعات سوق العقارات للعام القادم", "مقارنة بين الشقق والفلل", "أفضل مخططات الأراضي الجديدة",
  "تجربتي مع التمويل العقاري", "شروط برنامج سكني الجديدة", "أسعار العقارات في الرياض",
  "أفضل أحياء جدة للسكن", "الاستثمار في الأراضي التجارية", "تجديد العقار القديم vs شراء جديد",
  "أخبار سوق العقارات اليوم", "نصائح للمستثمرين المبتدئين", "مشاريع نيوم وتأثيرها على العقارات",
  "أفضل شركات التطوير العقاري", "تجربتي في بيع عقار عبر المنصة", "مميزات الشقق المفروشة للإيجار",
  "كيف تقيّم سعر العقار بشكل صحيح", "الفرق بين الصك الإلكتروني والورقي",
];

const PROPERTY_TITLES = [
  "شقة فاخرة بإطلالة بانورامية", "فيلا عصرية بحديقة خاصة", "أرض سكنية بموقع استراتيجي",
  "مكتب تجاري بتشطيبات راقية", "شاليه بمسبح خاص", "مبنى تجاري بدخل مرتفع",
  "شقة استوديو للإيجار", "فيلا دوبلكس بحي الملقا", "أرض تجارية على شارع رئيسي",
  "محل تجاري في مول", "شقة 3 غرف بتشطيب سوبر لوكس", "فيلا مع مسبح وملحق",
  "أرض زراعية بصك إلكتروني", "عمارة سكنية بدخل ممتاز", "شقة بالقرب من الحرم",
  "فيلا روف بتراس واسع", "مستودع بمساحة كبيرة", "شقة عوائل بالدور الأول",
  "أرض بمخطط معتمد", "مكتب جاهز بالأثاث",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};
const saudiPhone = () => `+9665${rand(0, 9)}${rand(1000000, 9999999)}`;
const uid = () => crypto.randomUUID();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const ts = () => Date.now().toString(36).slice(-4);

let regionList: any[] = [];
let cityList: any[] = [];

async function getGeography() {
  regionList = await prisma.regions.findMany();
  cityList = await prisma.cities.findMany({ take: 500 });
  console.log(`  Geography: ${regionList.length} regions, ${cityList.length} cities`);
}

function randomCity() {
  if (cityList.length > 0) {
    const c = pick(cityList);
    return { city: c.nameAr, regionId: c.regionId };
  }
  const region = pick(REGIONS);
  const cities = CITIES[region] || ["الرياض"];
  return { city: pick(cities), regionId: null };
}

// ── Seeders ─────────────────────────────────────────────────────────────────

async function seedOrganizations() {
  console.log("  Seeding 20 organizations...");
  const orgs = [];
  for (let i = 0; i < 20; i++) {
    const name = ORG_NAMES[i];
    const org = await prisma.organizations.create({
      data: {
        legalName: name,
        tradeName: name,
        licenseNo: `ORG-${ts()}-${String(i + 1).padStart(4, "0")}`,
        status: "ACTIVE",
        phone: saudiPhone(),
        email: `info@org${i + 1}.sa`,
        website: `https://org${i + 1}.sa`,
        industry: pick(["تطوير عقاري", "وساطة عقارية", "إدارة أملاك", "استثمار عقاري"]),
        address: `${pick(DISTRICTS)}، ${pick(Object.values(CITIES).flat())}`,
      },
    });
    orgs.push(org);
  }
  return orgs;
}

async function seedIndividualAgents() {
  console.log("  Seeding 50 individual agents...");
  const agents = [];
  const pw = hash("agent123");
  for (let i = 0; i < 50; i++) {
    const firstName = pick([...FIRST_NAMES_M, ...FIRST_NAMES_F]);
    const lastName = pick(LAST_NAMES);
    const user = await prisma.users.create({
      data: {
        username: `indiv_${ts()}_${i + 1}`,
        email: `indiv_${ts()}_${i + 1}@agents.sa`,
        passwordHash: pw,
        firstName,
        lastName,
        phone: saudiPhone(),
        roles: JSON.stringify(["INDIV_AGENT"]),
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });
    await prisma.agent_profiles.create({
      data: {
        userId: user.id,
        licenseNo: `IND-${ts()}-${String(i + 1).padStart(5, "0")}`,
        licenseValidTo: new Date("2028-12-31"),
        territories: pick(Object.values(CITIES).flat().slice(0, 10)),
        isIndividualAgent: true,
        status: "ACTIVE",
        specialties: pick(["شقق سكنية", "فلل", "أراضي", "تجاري", "إيجارات"]),
      },
    });
    agents.push(user);
  }
  return agents;
}

async function seedCorporateAgents(orgs: any[]) {
  console.log("  Seeding 200 corporate agents across 20 organizations...");
  const agents = [];
  const pw = hash("agent123");
  for (let i = 0; i < 200; i++) {
    const org = orgs[i % orgs.length];
    const firstName = pick([...FIRST_NAMES_M, ...FIRST_NAMES_F]);
    const lastName = pick(LAST_NAMES);
    const user = await prisma.users.create({
      data: {
        username: `corp_${ts()}_${i + 1}`,
        email: `corp_${ts()}_${i + 1}@agents.sa`,
        passwordHash: pw,
        firstName,
        lastName,
        phone: saudiPhone(),
        roles: JSON.stringify(i % 10 === 0 ? ["CORP_OWNER"] : ["CORP_AGENT"]),
        organizationId: org.id,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });
    await prisma.agent_profiles.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        licenseNo: `CORP-${ts()}-${String(i + 1).padStart(5, "0")}`,
        licenseValidTo: new Date("2028-12-31"),
        territories: pick(Object.values(CITIES).flat().slice(0, 10)),
        isIndividualAgent: false,
        status: "ACTIVE",
        specialties: pick(["شقق سكنية", "فلل وقصور", "أراضي", "تجاري", "صناعي"]),
      },
    });
    agents.push(user);
  }
  return agents;
}

async function seedProperties(orgs: any[], agents: any[]) {
  console.log("  Seeding 2,000 properties...");
  const batchSize = 100;
  for (let batch = 0; batch < 2000 / batchSize; batch++) {
    const props = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = batch * batchSize + i;
      const { city } = randomCity();
      const type = pick(PROPERTY_TYPES);
      const title = `${pick(PROPERTY_TITLES)} - ${city}`;
      const price = type === "land" ? rand(200000, 5000000) : type === "villa" ? rand(800000, 8000000) : type === "apartment" ? rand(200000, 2000000) : rand(300000, 10000000);

      props.push({
        title,
        description: `عقار ${type} مميز في ${city}. ${pick(["تشطيب فاخر", "موقع حيوي", "قريب من الخدمات", "إطلالة رائعة", "تصميم عصري"])}`,
        type,
        status: pick(["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "SOLD", "RENTED"]) as any,
        price: price,
        city,
        district: pick(DISTRICTS),
        address: `${pick(DISTRICTS)}، شارع ${rand(1, 50)}`,
        bedrooms: type === "land" ? 0 : rand(1, 6),
        bathrooms: type === "land" ? 0 : rand(1, 4),
        areaSqm: type === "land" ? rand(300, 5000) : type === "villa" ? rand(200, 800) : rand(80, 300),
        latitude: rand(17, 32) + Math.random(),
        longitude: rand(36, 55) + Math.random(),
        agentId: pick(agents).id,
        organizationId: pick(orgs).id,
      });
    }
    await prisma.properties.createMany({ data: props, skipDuplicates: true });
    process.stdout.write(`\r    Properties: ${(batch + 1) * batchSize}/2000`);
  }
  console.log(" ✓");
}

async function seedSellerRequests(agents: any[]) {
  console.log("  Seeding 11,000 seller requests...");
  const batchSize = 500;
  for (let batch = 0; batch < 11000 / batchSize; batch++) {
    const subs = [];
    for (let i = 0; i < batchSize; i++) {
      const { city } = randomCity();
      const phone = saudiPhone();
      const name = `${pick([...FIRST_NAMES_M, ...FIRST_NAMES_F])} ${pick(LAST_NAMES)}`;
      subs.push({
        createdByUserId: pick(agents).id,
        city,
        type: pick(PROPERTY_TYPES),
        bedrooms: rand(0, 6),
        priceExpectation: rand(100000, 10000000),
        status: pick(["OPEN", "OPEN", "IN_PROGRESS", "CLOSED", "PAUSED"]) as any,
        maskedContact: phone.replace(/\d{4}$/, "****"),
        fullContactJson: JSON.stringify({ name, phone, email: `seller${batch * batchSize + i + 1}@example.sa` }),
        notes: `عرض بيع عقار في ${city}`,
      });
    }
    await prisma.seller_submissions.createMany({ data: subs, skipDuplicates: true });
    process.stdout.write(`\r    Sellers: ${(batch + 1) * batchSize}/11000`);
  }
  console.log(" ✓");
}

async function seedBuyerRequests(agents: any[]) {
  console.log("  Seeding 2,000 buyer requests...");
  const batchSize = 500;
  for (let batch = 0; batch < 2000 / batchSize; batch++) {
    const reqs = [];
    for (let i = 0; i < batchSize; i++) {
      const { city } = randomCity();
      const phone = saudiPhone();
      const name = `${pick([...FIRST_NAMES_M, ...FIRST_NAMES_F])} ${pick(LAST_NAMES)}`;
      reqs.push({
        createdByUserId: pick(agents).id,
        city,
        type: pick(PROPERTY_TYPES),
        minBedrooms: rand(1, 3),
        maxBedrooms: rand(3, 8),
        minPrice: rand(100000, 500000),
        maxPrice: rand(500000, 5000000),
        contactPreferences: pick(["phone", "whatsapp", "email", "any"]),
        status: pick(["OPEN", "OPEN", "CLAIMED", "CLOSED", "PAUSED"]) as any,
        maskedContact: phone.replace(/\d{4}$/, "****"),
        fullContactJson: JSON.stringify({ name, phone, email: `buyer${batch * batchSize + i + 1}@example.sa` }),
        notes: `أبحث عن ${pick(["شقة", "فيلا", "أرض", "مكتب"])} في ${city}`,
      });
    }
    await prisma.buyer_requests.createMany({ data: reqs, skipDuplicates: true });
    process.stdout.write(`\r    Buyers: ${(batch + 1) * batchSize}/2000`);
  }
  console.log(" ✓");
}

async function seedForumChannels(adminId: string) {
  console.log("  Seeding 13 forum channels (per Saudi region)...");
  const channels = [];
  for (const region of REGIONS) {
    const ch = await prisma.forum_channels.create({
      data: {
        nameAr: `عقارات ${region}`,
        nameEn: `Real Estate - ${region}`,
        description: `نقاشات وأخبار سوق العقارات في ${region}`,
        isPublic: true,
        createdById: adminId,
      },
    });
    channels.push(ch);
  }
  const general = await prisma.forum_channels.create({
    data: { nameAr: "نقاشات عامة", nameEn: "General Discussion", description: "نقاشات عامة حول سوق العقارات", isPublic: true, createdById: adminId },
  });
  channels.push(general);
  const tips = await prisma.forum_channels.create({
    data: { nameAr: "نصائح وإرشادات", nameEn: "Tips & Guides", description: "نصائح للمشترين والبائعين والمستثمرين", isPublic: true, createdById: adminId },
  });
  channels.push(tips);
  return channels;
}

async function seedForumPosts(channels: any[], agents: any[]) {
  console.log("  Seeding 500+ forum posts...");
  const batchSize = 50;
  for (let batch = 0; batch < 500 / batchSize; batch++) {
    for (let i = 0; i < batchSize; i++) {
      const channel = pick(channels);
      const author = pick(agents);
      const topic = pick(FORUM_TOPICS);
      const { city } = randomCity();

      await (prisma as any).community_posts.create({
        data: {
          authorId: author.id,
          channelId: channel.id,
          content: `${topic}\n\n${pick([
            `في ${city}، لاحظنا ${pick(["ارتفاع", "انخفاض", "استقرار"])} في أسعار ${pick(["الشقق", "الفلل", "الأراضي"])} خلال الفترة الأخيرة.`,
            `أنصح بالاستثمار في ${city} خاصة في ${pick(DISTRICTS)}. المنطقة واعدة جداً.`,
            `هل يوجد أحد لديه تجربة في ${pick(["شراء", "بيع", "إيجار"])} عقار في ${city}؟`,
            `تحديث: مشروع ${pick(["نيوم", "ذا لاين", "البحر الأحمر", "أمالا", "القدية"])} سيرفع أسعار العقارات في المنطقة.`,
            `نصيحة مهمة: قبل ${pick(["الشراء", "البيع"])} تأكد من ${pick(["فحص العقار", "التحقق من الصك", "مراجعة العقد", "استشارة محامي"])}.`,
          ])}\n\n${pick(["ما رأيكم؟", "شاركوني تجاربكم", "هل تتفقون؟", "أنتظر آراءكم", "للنقاش..."])}`,
          type: pick(["DISCUSSION", "NEWS", "ANNOUNCEMENT", "DEAL", "ALERT"]),
          likes: rand(0, 50),
        },
      });
    }
    process.stdout.write(`\r    Posts: ${(batch + 1) * batchSize}/500`);
  }
  console.log(" ✓");
}

async function seedCustomersAndLeads(orgs: any[], agents: any[]) {
  console.log("  Seeding 500 customers + leads...");
  for (let i = 0; i < 500; i++) {
    const org = pick(orgs);
    const agent = agents.find(a => a.organizationId === org.id) || pick(agents);
    const { city } = randomCity();
    const firstName = pick([...FIRST_NAMES_M, ...FIRST_NAMES_F]);
    const lastName = pick(LAST_NAMES);

    const customer = await prisma.customers.create({
      data: {
        organizationId: org.id,
        type: pick(["BUYER", "SELLER", "BUYER"]),
        firstName,
        lastName,
        phone: saudiPhone(),
        email: `customer${i + 1}@example.sa`,
        city,
        source: pick(["website", "referral", "social_media", "walk_in", "phone"]),
      },
    });

    await prisma.leads.create({
      data: {
        agentId: agent.id,
        organizationId: org.id,
        customerId: customer.id,
        status: pick(["NEW", "IN_PROGRESS", "WON", "LOST", "NEW", "NEW"]),
        source: pick(["website", "referral", "social_media", "walk_in"]),
        notes: `عميل مهتم بـ${pick(["شراء", "إيجار", "استثمار"])} في ${city}`,
        priority: rand(1, 5),
      },
    });

    if (i % 100 === 0) process.stdout.write(`\r    Customers+Leads: ${i}/500`);
  }
  console.log(" ✓");
}

async function seedDeals(orgs: any[], agents: any[]) {
  console.log("  Seeding 200 deals...");
  const customers = await prisma.customers.findMany({ take: 200 });
  for (let i = 0; i < Math.min(200, customers.length); i++) {
    const customer = customers[i];
    const agent = agents.find(a => a.organizationId === customer.organizationId) || pick(agents);
    await prisma.deals.create({
      data: {
        organizationId: customer.organizationId,
        customerId: customer.id,
        agentId: agent.id,
        stage: pick(["NEW", "NEGOTIATION", "UNDER_OFFER", "WON", "LOST"]),
        source: pick(["website", "referral", "direct"]),
        agreedPrice: rand(100000, 5000000),
        currency: "SAR",
        notes: `صفقة ${pick(["شراء", "إيجار"])} عقار`,
      },
    });
    if (i % 50 === 0) process.stdout.write(`\r    Deals: ${i}/200`);
  }
  console.log(" ✓");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting comprehensive database seed...\n");
  const start = Date.now();

  await getGeography();

  const orgs = await seedOrganizations();
  const indivAgents = await seedIndividualAgents();
  const corpAgents = await seedCorporateAgents(orgs);
  const allAgents = [...indivAgents, ...corpAgents];

  await seedProperties(orgs, allAgents);
  await seedSellerRequests(allAgents);
  await seedBuyerRequests(allAgents);

  // Get admin user ID for channel creation
  const admin = await prisma.users.findFirst({ where: { username: "admin" } });
  const adminId = admin?.id || allAgents[0].id;

  const channels = await seedForumChannels(adminId);
  await seedForumPosts(channels, allAgents);

  await seedCustomersAndLeads(orgs, allAgents);
  await seedDeals(orgs, allAgents);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Seed complete in ${elapsed}s`);
  console.log("   20 organizations");
  console.log("   50 individual agents");
  console.log("   200 corporate agents");
  console.log("   2,000 properties");
  console.log("   11,000 seller requests");
  console.log("   2,000 buyer requests");
  console.log("   15 forum channels");
  console.log("   500+ forum posts");
  console.log("   500 customers + leads");
  console.log("   200 deals");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
