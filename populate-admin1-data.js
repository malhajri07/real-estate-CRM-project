const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a simple TypeScript execution script
const scriptContent = `
import { db } from "./server/db";
import { properties, leads, deals, activities, messages, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const cities = ["الرياض", "جدة", "الدمام", "الخبر", "الطائف", "مكة", "المدينة", "الاحساء", "القطيف", "حائل", "أبها", "تبوك", "بريدة", "نجران", "الباحة"];
const states = ["الرياض", "مكة المكرمة", "المنطقة الشرقية", "عسير", "المدينة المنورة", "حائل", "تبوك", "القصيم", "نجران", "الباحة"];
const propertyTypes = ["شقة", "فيلا", "دوبلكس", "تاون هاوس", "بنتهاوس", "استوديو", "مكتب", "محل تجاري", "مستودع", "أرض"];
const statuses = ["active", "pending", "sold", "withdrawn"];

const propertyTitles = [
  "شقة فاخرة في",
  "فيلا عصرية في", 
  "دوبلكس للبيع في",
  "تاون هاوس في",
  "بنتهاوس مطل على",
  "استوديو مفروش في",
  "شقة استثمارية في",
  "فيلا بمسبح في",
  "شقة بإطلالة في",
  "مكتب تجاري في"
];

const descriptions = [
  "عقار فاخر في موقع مميز مع جميع الخدمات",
  "موقع استراتيجي قريب من الخدمات والمولات", 
  "تصميم عصري مع تشطيبات راقية",
  "إطلالة رائعة ومساحات واسعة",
  "في قلب المدينة مع سهولة المواصلات"
];

const addresses = [
  "شارع الملك فهد",
  "شارع الأمير محمد بن عبدالعزيز",
  "شارع العليا",
  "شارع التحلية",
  "شارع الستين"
];

const features = [
  ["موقف سيارات", "مصعد", "أمن وحراسة"],
  ["حمام سباحة", "صالة رياضية", "حديقة"],
  ["مطبخ مجهز", "تكييف مركزي", "إنترنت"]
];

const photoSets = [
  [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1615873968403-89e068629265"
  ],
  [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "https://images.unsplash.com/photo-1505843513577-22bb7d21e455"
  ]
];

const cityCoordinates = {
  "الرياض": { lat: [24.6877, 24.7136], lng: [46.7219, 46.6753] },
  "جدة": { lat: [21.4858, 21.5433], lng: [39.1925, 39.2003] },
  "الدمام": { lat: [26.3927, 26.4457], lng: [49.9777, 50.1063] },
  "الخبر": { lat: [26.2172, 26.2794], lng: [50.1962, 50.2187] },
  "الطائف": { lat: [21.2703, 21.3891], lng: [40.4158, 40.4838] }
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice() {
  const prices = [150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 750000, 800000, 900000, 1000000, 1200000, 1500000, 1800000, 2000000, 2500000, 3000000];
  return getRandomElement(prices).toString();
}

function getRandomCoordinates(city) {
  const coords = cityCoordinates[city];
  if (!coords) {
    return {
      lat: (24.7136 + (Math.random() - 0.5) * 0.1).toFixed(6),
      lng: (46.6753 + (Math.random() - 0.5) * 0.1).toFixed(6)
    };
  }
  
  return {
    lat: (coords.lat[0] + Math.random() * (coords.lat[1] - coords.lat[0])).toFixed(6),
    lng: (coords.lng[0] + Math.random() * (coords.lng[1] - coords.lng[0])).toFixed(6)
  };
}

async function createAdmin1AndPopulate() {
  console.log("🚀 بدء إنشاء مستخدم Admin1 وإضافة البيانات...");
  
  try {
    // Check if Admin1 user already exists
    let admin1User = await db.select().from(users).where(eq(users.email, "admin1@example.com")).limit(1);
    
    if (admin1User.length === 0) {
      console.log("👤 إنشاء مستخدم Admin1...");
      const [newUser] = await db.insert(users).values({
        email: "admin1@example.com",
        firstName: "Admin",
        lastName: "One",
        accountType: "individual_broker",
        isActive: true,
        isVerified: true,
        subscriptionStatus: "active",
        subscriptionTier: "premium",
        maxActiveListings: 100,
        currentActiveListings: 0,
        maxCustomers: 500,
        currentCustomers: 0,
        tenantId: "admin1-tenant"
      }).returning();
      
      admin1User = [newUser];
      console.log(\`✅ تم إنشاء مستخدم Admin1: \${newUser.firstName} \${newUser.lastName}\`);
    } else {
      console.log(\`✅ مستخدم Admin1 موجود بالفعل: \${admin1User[0].firstName} \${admin1User[0].lastName}\`);
    }
    
    const admin1 = admin1User[0];
    const propertiesToCreate = 50;
    const leadsToCreate = 75;
    
    const createdProperties = [];
    const createdLeads = [];

    const arabicFirstNames = [
      "محمد", "أحمد", "عبدالله", "فيصل", "خالد", "سعد", "عبدالرحمن", "يوسف", "عبدالعزيز", "بندر",
      "فاطمة", "عائشة", "خديجة", "سارة", "نورا", "هدى", "مريم", "زينب", "رقية", "منى"
    ];
    
    const arabicLastNames = [
      "العتيبي", "الحربي", "القحطاني", "الدوسري", "الشمري", "العنزي", "الرشيد", "الغامدي", "المالكي", "الزهراني",
      "السعد", "الأحمد", "المطيري", "الشهري", "العلي", "البقمي", "الجهني", "الثقفي", "الحازمي", "الصاعدي"
    ];
    
    const emailDomains = [
      "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
      "stc.com.sa", "mobily.com.sa", "zain.sa", "aramco.com", "sabic.com"
    ];

    console.log("👥 إنشاء العملاء المحتملين...");
    for (let i = 0; i < leadsToCreate; i++) {
      const firstName = getRandomElement(arabicFirstNames);
      const lastName = getRandomElement(arabicLastNames);
      const emailDomain = getRandomElement(emailDomains);
      const emailPrefix = firstName.toLowerCase().replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h') + '.' + lastName.toLowerCase().replace(/ال/g, '').replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h');
      
      const customerAge = getRandomNumber(25, 65);
      const maritalStatus = getRandomElement(["أعزب", "متزوج", "مطلق", "أرمل"]);
      const numberOfDependents = maritalStatus === "متزوج" ? getRandomNumber(0, 5) : 
                                maritalStatus === "مطلق" ? getRandomNumber(0, 3) : 0;
      
      const leadData = {
        firstName: firstName,
        lastName: lastName,
        email: \`\${emailPrefix}@\${emailDomain}\`,
        phone: \`966\${getRandomNumber(50, 59)}\${getRandomNumber(1000000, 9999999)}\`,
        city: getRandomElement(cities),
        age: customerAge,
        maritalStatus: maritalStatus,
        numberOfDependents: numberOfDependents,
        leadSource: getRandomElement(["موقع الكتروني", "إعلان", "إحالة", "وسائل التواصل", "Facebook", "Instagram", "WhatsApp", "Google"]),
        interestType: getRandomElement(["شراء", "بيع", "إيجار", "استثمار"]),
        budgetRange: getRandomElement([
          "300,000 - 500,000 ﷼",
          "500,000 - 800,000 ﷼", 
          "800,000 - 1,200,000 ﷼",
          "1,200,000 - 1,500,000 ﷼",
          "1,500,000 - 2,000,000 ﷼",
          "2,000,000+ ﷼"
        ]),
        status: getRandomElement(["new", "qualified", "showing", "negotiation", "closed", "lost"]),
        notes: \`عميل \${firstName} \${lastName} - مهتم بالعقارات\`,
        ownerId: admin1.id,
        createdBy: admin1.id,
        tenantId: admin1.tenantId || 'admin1-tenant'
      };

      const [lead] = await db.insert(leads).values(leadData).returning();
      createdLeads.push(lead);
      
      if ((i + 1) % 25 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} عميل محتمل من \${leadsToCreate}\`);
      }
    }

    console.log("🏠 إنشاء العقارات...");
    for (let i = 0; i < propertiesToCreate; i++) {
      const city = getRandomElement(cities);
      const propertyType = getRandomElement(propertyTypes);
      const status = getRandomElement(statuses);
      const coords = getRandomCoordinates(city);
      
      let selectedPhotos = [];
      const shouldHavePhotos = Math.random() > 0.2;
      
      if (shouldHavePhotos) {
        const photoSet = getRandomElement(photoSets);
        const numPhotos = getRandomNumber(2, Math.min(3, photoSet.length));
        selectedPhotos = photoSet.slice(0, numPhotos);
      }
      
      const propertyData = {
        title: \`\${getRandomElement(propertyTitles)} \${city}\`,
        description: getRandomElement(descriptions),
        address: getRandomElement(addresses),
        city: city,
        state: getRandomElement(states),
        zipCode: \`\${getRandomNumber(10000, 99999)}\`,
        latitude: coords.lat,
        longitude: coords.lng,
        price: getRandomPrice(),
        propertyCategory: 'سكني',
        propertyType: propertyType,
        bedrooms: propertyType === "استوديو" ? 0 : getRandomNumber(1, 6),
        bathrooms: getRandomNumber(1, 4).toString() + (Math.random() > 0.5 ? ".5" : ".0"),
        squareFeet: getRandomNumber(80, 500),
        status: status,
        isPubliclyVisible: true,
        listingType: 'sale',
        ownerType: 'broker',
        ownerId: admin1.id,
        createdBy: admin1.id,
        tenantId: admin1.tenantId || 'admin1-tenant',
        photoUrls: selectedPhotos.length > 0 ? selectedPhotos : null,
        features: getRandomElement(features)
      };

      const [property] = await db.insert(properties).values(propertyData).returning();
      createdProperties.push(property);

      if ((i + 1) % 25 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} عقار من \${propertiesToCreate}\`);
      }
    }

    console.log("💰 إنشاء الصفقات...");
    for (let i = 0; i < 30; i++) {
      const lead = getRandomElement(createdLeads);
      const property = getRandomElement(createdProperties);
      
      const dealData = {
        leadId: lead.id,
        propertyId: property.id,
        stage: getRandomElement(["lead", "qualified", "showing", "negotiation", "closed"]),
        dealValue: property.price,
        commission: (parseFloat(property.price) * 0.025).toString(),
        expectedCloseDate: new Date(Date.now() + getRandomNumber(1, 90) * 24 * 60 * 60 * 1000),
        notes: \`صفقة العقار \${property.title}\`,
        tenantId: admin1.tenantId || 'admin1-tenant'
      };

      await db.insert(deals).values(dealData);
    }

    console.log("📋 إنشاء الأنشطة...");
    for (let i = 0; i < 100; i++) {
      const lead = getRandomElement(createdLeads);
      
      const activityData = {
        leadId: lead.id,
        activityType: getRandomElement(["call", "email", "meeting", "note", "showing"]),
        title: \`نشاط \${i + 1}\`,
        description: \`وصف النشاط للعميل \${lead.firstName}\`,
        scheduledDate: new Date(Date.now() + getRandomNumber(-30, 30) * 24 * 60 * 60 * 1000),
        completed: Math.random() > 0.3,
        tenantId: admin1.tenantId || 'admin1-tenant'
      };

      await db.insert(activities).values(activityData);
    }

    console.log("💬 إنشاء رسائل WhatsApp...");
    for (let i = 0; i < 25; i++) {
      const lead = getRandomElement(createdLeads);
      
      const messageData = {
        leadId: lead.id,
        messageType: "whatsapp",
        phoneNumber: lead.phone,
        message: \`مرحباً \${lead.firstName}، شكراً لاهتمامك بالعقارات. هل يمكننا تحديد موعد للمعاينة؟\`,
        status: getRandomElement(["sent", "delivered", "read", "pending"]),
        tenantId: admin1.tenantId || 'admin1-tenant'
      };

      await db.insert(messages).values(messageData);
    }

    console.log(\`✅ تم إنشاء البيانات لـ Admin1 بنجاح:\`);
    console.log(\`- \${createdLeads.length} عميل محتمل\`);
    console.log(\`- \${createdProperties.length} عقار\`);
    console.log(\`- 30 صفقة\`);
    console.log(\`- 100 نشاط\`);
    console.log(\`- 25 رسالة WhatsApp\`);
    
    return {
      user: admin1,
      leads: createdLeads.length,
      properties: createdProperties.length,
      deals: 30,
      activities: 100,
      messages: 25
    };

  } catch (error) {
    console.error("❌ خطأ في إنشاء البيانات:", error);
    throw error;
  }
}

// Run the function
createAdmin1AndPopulate()
  .then((result) => {
    console.log("🎉 تم الانتهاء بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 فشل في إنشاء البيانات:", error);
    process.exit(1);
  });
`;

// Write the script to a temporary file
const tempScriptPath = path.join(__dirname, 'temp-populate-admin1.ts');
fs.writeFileSync(tempScriptPath, scriptContent);

try {
  console.log('🚀 تشغيل سكريبت إنشاء بيانات Admin1...');
  execSync(`npx tsx ${tempScriptPath}`, { stdio: 'inherit' });
  console.log('✅ تم الانتهاء بنجاح!');
} catch (error) {
  console.error('❌ خطأ في تشغيل السكريبت:', error.message);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempScriptPath)) {
    fs.unlinkSync(tempScriptPath);
  }
}
