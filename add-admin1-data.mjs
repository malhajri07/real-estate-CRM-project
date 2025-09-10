import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a simple script that adds data directly to the storage
const scriptContent = `
import { storage } from './server/storage.js';

const cities = ["الرياض", "جدة", "الدمام", "الخبر", "الطائف", "مكة", "المدينة", "الاحساء", "القطيف", "حائل", "أبها", "تبوك", "بريدة", "نجران", "الباحة"];
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
  "الرياض": { lat: 24.7136, lng: 46.6753 },
  "جدة": { lat: 21.4894, lng: 39.2460 },
  "الدمام": { lat: 26.4207, lng: 50.0888 },
  "الخبر": { lat: 26.2172, lng: 50.1971 },
  "الطائف": { lat: 21.2703, lng: 40.4158 }
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
    lat: (coords.lat + (Math.random() - 0.5) * 0.1).toFixed(6),
    lng: (coords.lng + (Math.random() - 0.5) * 0.1).toFixed(6)
  };
}

async function addAdmin1Data() {
  console.log("🚀 بدء إضافة بيانات Admin1...");
  
  try {
    const admin1Id = "admin1-user-id";
    const tenantId = "admin1-tenant";
    
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

    // Create leads
    console.log("👥 إنشاء العملاء المحتملين...");
    const createdLeads = [];
    for (let i = 0; i < 50; i++) {
      const firstName = getRandomElement(arabicFirstNames);
      const lastName = getRandomElement(arabicLastNames);
      const emailDomain = getRandomElement(emailDomains);
      const emailPrefix = firstName.toLowerCase().replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h') + '.' + lastName.toLowerCase().replace(/ال/g, '').replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h');
      
      const leadData = {
        firstName: firstName,
        lastName: lastName,
        email: \`\${emailPrefix}@\${emailDomain}\`,
        phone: \`966\${getRandomNumber(50, 59)}\${getRandomNumber(1000000, 9999999)}\`,
        city: getRandomElement(cities),
        age: getRandomNumber(25, 65),
        maritalStatus: getRandomElement(["أعزب", "متزوج", "مطلق", "أرمل"]),
        numberOfDependents: getRandomNumber(0, 3),
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
        notes: \`عميل \${firstName} \${lastName} - مهتم بالعقارات\`
      };

      const lead = await storage.createLead(leadData, admin1Id, tenantId);
      createdLeads.push(lead);
      
      if ((i + 1) % 25 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} عميل محتمل\`);
      }
    }

    // Create properties
    console.log("🏠 إنشاء العقارات...");
    const createdProperties = [];
    for (let i = 0; i < 75; i++) {
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
        state: city,
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
        photoUrls: selectedPhotos.length > 0 ? selectedPhotos : null,
        features: getRandomElement(features)
      };

      const property = await storage.createProperty(propertyData, admin1Id, tenantId);
      createdProperties.push(property);

      if ((i + 1) % 25 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} عقار\`);
      }
    }

    // Create deals
    console.log("💰 إنشاء الصفقات...");
    for (let i = 0; i < 25; i++) {
      const lead = getRandomElement(createdLeads);
      const property = getRandomElement(createdProperties);
      
      const dealData = {
        leadId: lead.id,
        propertyId: property.id,
        stage: getRandomElement(["lead", "qualified", "showing", "negotiation", "closed"]),
        dealValue: property.price,
        commission: (parseFloat(property.price) * 0.025).toString(),
        expectedCloseDate: new Date(Date.now() + getRandomNumber(1, 90) * 24 * 60 * 60 * 1000),
        notes: \`صفقة العقار \${property.title}\`
      };

      await storage.createDeal(dealData, tenantId);
    }

    // Create activities
    console.log("📋 إنشاء الأنشطة...");
    for (let i = 0; i < 50; i++) {
      const lead = getRandomElement(createdLeads);
      
      const activityData = {
        leadId: lead.id,
        activityType: getRandomElement(["call", "email", "meeting", "note", "showing"]),
        title: \`نشاط \${i + 1}\`,
        description: \`وصف النشاط للعميل \${lead.firstName}\`,
        scheduledDate: new Date(Date.now() + getRandomNumber(-30, 30) * 24 * 60 * 60 * 1000),
        completed: Math.random() > 0.3
      };

      await storage.createActivity(activityData, tenantId);
    }

    // Create WhatsApp messages
    console.log("💬 إنشاء رسائل WhatsApp...");
    for (let i = 0; i < 15; i++) {
      const lead = getRandomElement(createdLeads);
      
      const messageData = {
        leadId: lead.id,
        messageType: "whatsapp",
        phoneNumber: lead.phone,
        message: \`مرحباً \${lead.firstName}، شكراً لاهتمامك بالعقارات. هل يمكننا تحديد موعد للمعاينة؟\`,
        status: getRandomElement(["sent", "delivered", "read", "pending"])
      };

      await storage.createMessage(messageData, tenantId);
    }

    console.log(\`✅ تم إضافة البيانات لـ Admin1 بنجاح:\`);
    console.log(\`- \${createdLeads.length} عميل محتمل\`);
    console.log(\`- \${createdProperties.length} عقار\`);
    console.log(\`- 25 صفقة\`);
    console.log(\`- 50 نشاط\`);
    console.log(\`- 15 رسالة WhatsApp\`);
    
    return {
      leads: createdLeads.length,
      properties: createdProperties.length,
      deals: 25,
      activities: 50,
      messages: 15
    };

  } catch (error) {
    console.error("❌ خطأ في إضافة البيانات:", error);
    throw error;
  }
}

// Run the function
addAdmin1Data()
  .then((result) => {
    console.log("🎉 تم الانتهاء بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 فشل في إضافة البيانات:", error);
    process.exit(1);
  });
`;

// Write the script to a temporary file
const tempScriptPath = path.join(process.cwd(), 'temp-add-admin1-data.mjs');
fs.writeFileSync(tempScriptPath, scriptContent);

try {
  console.log('🚀 تشغيل سكريبت إضافة بيانات Admin1...');
  execSync(`node ${tempScriptPath}`, { stdio: 'inherit' });
  console.log('✅ تم الانتهاء بنجاح!');
} catch (error) {
  console.error('❌ خطأ في تشغيل السكريبت:', error.message);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempScriptPath)) {
    fs.unlinkSync(tempScriptPath);
  }
}
