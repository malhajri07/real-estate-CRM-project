import { storage } from "./storage-prisma";
import { type Lead, type Deal, type Activity, type Message } from "@shared/types";

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
    "https://images.unsplash.com/photo-1615873968403-89e068629265",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
    "https://images.unsplash.com/photo-1571055107559-3e67626fa8be"
  ],
  [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "https://images.unsplash.com/photo-1505843513577-22bb7d21e455",
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83"
  ],
  [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    "https://images.unsplash.com/photo-1571055107734-8d7a8b29c30c",
    "https://images.unsplash.com/photo-1594736797933-d0f06b755b8f",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7"
  ],
  [
    "https://images.unsplash.com/photo-1497366216548-37526070297c",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
    "https://images.unsplash.com/photo-1555636222-cae831e670b3",
    "https://images.unsplash.com/photo-1565182999561-18d7dc61c393",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb"
  ],
  [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    "https://images.unsplash.com/photo-1628744448840-55bdb2497bd0",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1560440021-33f9b867899d"
  ],
  [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    "https://images.unsplash.com/photo-1549517045-bc93de075e53",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
    "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a",
    "https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32"
  ],
  [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6"
  ],
  [
    "https://images.unsplash.com/photo-1613545325278-f24b0cae1224",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace",
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498b"
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
    // Note: Using Prisma storage methods instead of direct db operations
    console.log("🗑️ Clearing existing data...");
    
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
      
      const customerAge = getRandomNumber(25, 65);
      const maritalStatus = getRandomElement(["أعزب", "متزوج", "مطلق", "أرمل"]);
      const numberOfDependents = maritalStatus === "متزوج" ? getRandomNumber(0, 5) : 
                                maritalStatus === "مطلق" ? getRandomNumber(0, 3) : 0;
      
      const leadData: any = {
        firstName: firstName,
        lastName: lastName,
        email: `${emailPrefix}@${emailDomain}`,
        phone: `966${getRandomNumber(50, 59)}${getRandomNumber(1000000, 9999999)}`,
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
        ])}`,
        ownerId: 'sample-user-1',
        createdBy: 'sample-user-1',
        tenantId: 'tenant-1'
      };

      const lead = await storage.createLead(leadData, "admin-user-id", "default-tenant");
      createdLeads.push(lead);
    }

    // Create properties
    console.log("🏠 إنشاء العقارات...");
    for (let i = 0; i < propertiesToCreate; i++) {
      const city = getRandomElement(cities);
      const propertyType = getRandomElement(propertyTypes);
      const status = getRandomElement(statuses);
      const coords = getRandomCoordinates(city);
      // Generate photos - 10 random properties will have no images for testing
      let selectedPhotos: string[] = [];
      const shouldHavePhotos = i >= 10; // First 10 properties will have no photos
      
      if (shouldHavePhotos) {
        const photoSet = getRandomElement(photoSets);
        const numPhotos = getRandomNumber(3, Math.min(5, photoSet.length));
        selectedPhotos = photoSet.slice(0, numPhotos);
      }
      
      const propertyData: any = {
        title: `${getRandomElement(propertyTitles)} ${city}`,
        description: getRandomElement(descriptions),
        address: getRandomElement(addresses),
        city: city,
        state: getRandomElement(states),
        zipCode: `${getRandomNumber(10000, 99999)}`,
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
        ownerId: 'sample-user-1',
        createdBy: 'sample-user-1',
        tenantId: 'tenant-1',
        photoUrls: selectedPhotos.length > 0 ? selectedPhotos : null,
        features: getRandomElement(features)
      };

      const property = await storage.createProperty(propertyData, "admin-user-id", "default-tenant");
      createdProperties.push(property);

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`✅ تم إنشاء ${i + 1} عقار من ${propertiesToCreate}`);
      }
    }

    // Note: Deal and Activity models don't exist in current Prisma schema
    // Skipping deal and activity creation for now
    console.log("⚠️ تخطي إنشاء الصفقات والأنشطة (النماذج غير موجودة في قاعدة البيانات)");

    console.log(`✅ تم إنشاء قاعدة البيانات بنجاح:`);
    console.log(`- ${createdLeads.length} عميل محتمل`);
    console.log(`- ${createdProperties.length} عقار`);
    
    return {
      leads: createdLeads.length,
      properties: createdProperties.length,
      deals: 0,
      activities: 0
    };

  } catch (error) {
    console.error("❌ خطأ في إنشاء البيانات:", error);
    throw error;
  }
}
