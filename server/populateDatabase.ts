import { db } from "./db";
import { properties, leads, deals, activities, messages } from "@shared/schema";

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
  "مكتب تجاري في",
  "محل للإيجار في",
  "أرض سكنية في",
  "شقة جديدة في",
  "فيلا واسعة في",
  "دوبلكس مطل في"
];

const descriptions = [
  "عقار فاخر في موقع مميز مع جميع الخدمات",
  "موقع استراتيجي قريب من الخدمات والمولات",
  "تصميم عصري مع تشطيبات راقية",
  "إطلالة رائعة ومساحات واسعة",
  "في قلب المدينة مع سهولة المواصلات",
  "مجمع سكني راقي مع أمن وحراسة",
  "مطبخ مجهز وغرف نوم واسعة",
  "حديقة خاصة وموقف سيارات",
  "بالقرب من المدارس والمستشفيات",
  "استثمار مميز بعائد مضمون"
];

const addresses = [
  "شارع الملك فهد",
  "شارع الأمير محمد بن عبدالعزيز",
  "شارع العليا",
  "شارع التحلية",
  "شارع الستين",
  "شارع الأمير سلطان",
  "شارع الملك عبدالعزيز",
  "شارع الملك خالد",
  "شارع الأمير تركي",
  "شارع الورود",
  "طريق الملك فهد",
  "شارع الأمير فيصل",
  "شارع الدائري الشمالي",
  "شارع الملك سعود",
  "شارع النصر"
];

const features = [
  ["موقف سيارات", "مصعد", "أمن وحراسة"],
  ["حمام سباحة", "صالة رياضية", "حديقة"],
  ["مطبخ مجهز", "تكييف مركزي", "إنترنت"],
  ["شرفة", "غرفة خادمة", "مخزن"],
  ["قريب من المول", "إطلالة بحرية", "موقع هادئ"],
  ["مواقف زوار", "مسجد قريب", "مدارس قريبة"],
  ["تشطيب فاخر", "أرضيات رخام", "نوافذ كبيرة"]
];

// Photo URLs from Unsplash for different property types
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
  ],
  [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
  ],
  [
    "https://images.unsplash.com/photo-1497366216548-37526070297c",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2"
  ],
  [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000"
  ],
  [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
  ],
  [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858"
  ],
  [
    "https://images.unsplash.com/photo-1613545325278-f24b0cae1224",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9"
  ]
];

// Generate coordinates for major Saudi cities
const cityCoordinates: Record<string, { lat: [number, number], lng: [number, number] }> = {
  "الرياض": { lat: [24.6877, 24.7136], lng: [46.7219, 46.6753] },
  "جدة": { lat: [21.4858, 21.5433], lng: [39.1925, 39.2003] },
  "الدمام": { lat: [26.3927, 26.4457], lng: [49.9777, 50.1063] },
  "الخبر": { lat: [26.2172, 26.2794], lng: [50.1962, 50.2187] },
  "الطائف": { lat: [21.2703, 21.3891], lng: [40.4158, 40.4838] },
  "مكة": { lat: [21.3891, 21.4225], lng: [39.8579, 39.8262] },
  "المدينة": { lat: [24.4539, 24.5247], lng: [39.5692, 39.6142] },
  "الاحساء": { lat: [25.3925, 25.4312], lng: [49.5578, 49.6178] },
  "القطيف": { lat: [26.5194, 26.5665], lng: [49.9503, 50.0086] },
  "حائل": { lat: [27.5114, 27.5219], lng: [41.6909, 41.7216] }
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(): string {
  const prices = [
    150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000,
    550000, 600000, 750000, 800000, 900000, 1000000, 1200000, 1500000,
    1800000, 2000000, 2500000, 3000000
  ];
  return getRandomElement(prices).toString();
}

function getRandomCoordinates(city: string): { lat: string, lng: string } {
  const coords = cityCoordinates[city];
  if (!coords) {
    // Default to Riyadh coordinates if city not found
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

export async function populateDatabase() {
  console.log("🚀 بدء إنشاء مئات البيانات التجريبية...");
  
  const propertiesToCreate = 50; // Create 50 properties for faster startup
  
  try {
    // Clear existing data first (order matters due to foreign keys)
    await db.delete(messages);
    await db.delete(activities);
    await db.delete(deals);
    await db.delete(properties);
    await db.delete(leads);
    
    console.log("🗑️ تم حذف البيانات السابقة");

    const createdProperties = [];
    const createdLeads = [];

    // Create realistic Arabic names and data
    const arabicFirstNames = [
      "محمد", "أحمد", "عبدالله", "فيصل", "خالد", "سعد", "عبدالرحمن", "يوسف", "عبدالعزيز", "بندر",
      "فاطمة", "عائشة", "خديجة", "سارة", "نورا", "هدى", "مريم", "زينب", "رقية", "منى",
      "عبدالإله", "طلال", "مساعد", "ناصر", "عمر", "علي", "إبراهيم", "عثمان", "صالح", "حسام",
      "نوف", "رهف", "غدير", "لمى", "أمل", "ريم", "دانة", "شهد", "جود", "رغد",
      "تركي", "عبدالملك", "فهد", "عادل", "ماجد", "رائد", "وليد", "محسن", "هشام", "كريم"
    ];
    
    const arabicLastNames = [
      "العتيبي", "الحربي", "القحطاني", "الدوسري", "الشمري", "العنزي", "الرشيد", "الغامدي", "المالكي", "الزهراني",
      "السعد", "الأحمد", "المطيري", "الشهري", "العلي", "البقمي", "الجهني", "الثقفي", "الحازمي", "الصاعدي",
      "المحمدي", "السلمي", "الحسيني", "الفهد", "الراشد", "العريفي", "الخثعمي", "البيشي", "الحمداني", "النجار",
      "الصالح", "الحمود", "السديري", "الخالدي", "الفيصل", "النصار", "الحليسي", "الشريف", "البدري", "الكثيري",
      "العوفي", "الرويلي", "المنصور", "الطويرقي", "الحمراني", "الدعجاني", "العايد", "البراك", "الشهواني", "الوهيبي"
    ];
    
    const emailDomains = [
      "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
      "stc.com.sa", "mobily.com.sa", "zain.sa", "aramco.com", "sabic.com",
      "ksu.edu.sa", "kau.edu.sa", "kfupm.edu.sa", "realestate.sa", "saudipost.com.sa"
    ];

    console.log("👥 إنشاء العملاء المحتملين...");
    for (let i = 0; i < 50; i++) {
      const firstName = getRandomElement(arabicFirstNames);
      const lastName = getRandomElement(arabicLastNames);
      const emailDomain = getRandomElement(emailDomains);
      const emailPrefix = firstName.toLowerCase().replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h') + '.' + lastName.toLowerCase().replace(/ال/g, '').replace(/[أإآ]/g, 'a').replace(/[ة]/g, 'h');
      
      const leadData = {
        firstName: firstName,
        lastName: lastName,
        email: `${emailPrefix}@${emailDomain}`,
        phone: `966${getRandomNumber(50, 59)}${getRandomNumber(1000000, 9999999)}`,
        leadSource: getRandomElement(["موقع الكتروني", "إعلان", "إحالة", "وسائل التواصل", "Facebook", "Instagram", "WhatsApp", "Google"]),
        interestType: getRandomElement(["شراء", "بيع", "إيجار", "استثمار"]),
        budgetRange: getRandomElement([
          "300,000 - 500,000 ﷼",
          "500,000 - 800,000 ﷼", 
          "800,000 - 1,200,000 ﷼",
          "1,200,000 - 1,500,000 ﷼",
          "1,500,000 - 2,000,000 ﷼",
          "2,000,000+ ﷼",
          "3,000 - 5,000 ﷼ شهرياً",
          "5,000 - 8,000 ﷼ شهرياً"
        ]),
        status: getRandomElement(["new", "qualified", "showing", "negotiation", "closed", "lost"]),
        notes: `عميل ${firstName} ${lastName} - ${getRandomElement([
          "مهتم بالعقارات في الرياض",
          "يبحث عن فيلا للعائلة",
          "مستثمر يريد عقارات تجارية", 
          "يفضل الأحياء الراقية",
          "عميل جاد ومتابع",
          "لديه ميزانية محددة",
          "يريد عقار جاهز للسكن"
        ])}`
      };

      const [lead] = await db.insert(leads).values(leadData).returning();
      createdLeads.push(lead);
    }

    // Create properties
    console.log("🏠 إنشاء العقارات...");
    for (let i = 0; i < propertiesToCreate; i++) {
      const city = getRandomElement(cities);
      const propertyType = getRandomElement(propertyTypes);
      const status = getRandomElement(statuses);
      const coords = getRandomCoordinates(city);
      const photoSet = getRandomElement(photoSets);
      
      // Randomly select 1-5 photos from the set
      const numPhotos = getRandomNumber(1, Math.min(5, photoSet.length));
      const selectedPhotos = photoSet.slice(0, numPhotos);
      
      const propertyData = {
        title: `${getRandomElement(propertyTitles)} ${city}`,
        description: getRandomElement(descriptions),
        address: getRandomElement(addresses),
        city: city,
        state: getRandomElement(states),
        zipCode: `${getRandomNumber(10000, 99999)}`,
        latitude: coords.lat,
        longitude: coords.lng,
        price: getRandomPrice(),
        propertyType: propertyType,
        bedrooms: propertyType === "استوديو" ? 0 : getRandomNumber(1, 6),
        bathrooms: getRandomNumber(1, 4).toString() + (Math.random() > 0.5 ? ".5" : ".0"),
        squareFeet: getRandomNumber(80, 500),
        status: status,
        photoUrls: selectedPhotos,
        features: getRandomElement(features)
      };

      const [property] = await db.insert(properties).values(propertyData).returning();
      createdProperties.push(property);

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`✅ تم إنشاء ${i + 1} عقار من ${propertiesToCreate}`);
      }
    }

    // Create some deals
    console.log("💰 إنشاء الصفقات...");
    for (let i = 0; i < 30; i++) {
      const lead = getRandomElement(createdLeads);
      const property = getRandomElement(createdProperties);
      
      const dealData = {
        leadId: lead.id,
        propertyId: property.id,
        stage: getRandomElement(["lead", "qualified", "showing", "negotiation", "closed"]),
        dealValue: property.price,
        commission: (parseFloat(property.price) * 0.025).toString(), // 2.5% commission
        expectedCloseDate: new Date(Date.now() + getRandomNumber(1, 90) * 24 * 60 * 60 * 1000),
        notes: `صفقة العقار ${property.title}`
      };

      await db.insert(deals).values(dealData);
    }

    // Create activities
    console.log("📋 إنشاء الأنشطة...");
    for (let i = 0; i < 100; i++) {
      const lead = getRandomElement(createdLeads);
      
      const activityData = {
        leadId: lead.id,
        activityType: getRandomElement(["call", "email", "meeting", "note", "showing"]),
        title: `نشاط ${i + 1}`,
        description: `وصف النشاط للعميل ${lead.firstName}`,
        scheduledDate: new Date(Date.now() + getRandomNumber(-30, 30) * 24 * 60 * 60 * 1000),
        completed: Math.random() > 0.3
      };

      await db.insert(activities).values(activityData);
    }

    console.log(`✅ تم إنشاء قاعدة البيانات بنجاح:`);
    console.log(`- ${createdLeads.length} عميل محتمل`);
    console.log(`- ${createdProperties.length} عقار`);
    console.log(`- 30 صفقة`);
    console.log(`- 100 نشاط`);
    
    return {
      leads: createdLeads.length,
      properties: createdProperties.length,
      deals: 30,
      activities: 100
    };

  } catch (error) {
    console.error("❌ خطأ في إنشاء البيانات:", error);
    throw error;
  }
}