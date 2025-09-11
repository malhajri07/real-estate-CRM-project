import { storage } from "./storage-prisma";
import { populateDatabase } from "./populateDatabase";

export async function seedDummyData() {
  console.log("إضافة البيانات التجريبية...");
  
  try {
    // Use the new population script for hundreds of properties
    const result = await populateDatabase();
    
    console.log("✅ تم إنشاء البيانات التجريبية بنجاح:");
    console.log(`- ${result.leads} عملاء محتملين`);
    console.log(`- ${result.properties} عقارات`);
    console.log(`- ${result.deals} صفقات`);
    console.log(`- ${result.activities} أنشطة`);
    
    return;
  } catch (error) {
    console.error("خطأ في إنشاء البيانات الضخمة، التراجع للبيانات الأساسية:", error);
    // Fall back to original smaller dataset if population fails
  }

  // إنشاء العملاء المحتملين (Leads)
  const leads = [
    {
      firstName: "محمد",
      lastName: "العتيبي",
      email: "mohammed.alotaibi@realestate.sa",
      phone: "966501234567",
      leadSource: "Facebook",
      interestType: "شراء",
      budgetRange: "500,000 - 800,000 ﷼",
      status: "qualified",
      notes: "مهتم بشقة في الرياض، يفضل الأحياء الراقية"
    },
    {
      firstName: "سارة",
      lastName: "الحربي",
      email: "sarah.alharbi@gmail.com", 
      phone: "966509876543",
      leadSource: "Google",
      interestType: "بيع",
      budgetRange: "1,200,000 - 1,500,000 ﷼",
      status: "showing",
      notes: "تريد بيع فيلا في جدة، ملكية خاصة"
    },
    {
      firstName: "عبدالرحمن",
      lastName: "القحطاني",
      email: "abdulrahman.alqahtani@outlook.com",
      phone: "966555123456",
      leadSource: "إحالة",
      interestType: "استثمار",
      budgetRange: "2,000,000+ ﷼",
      status: "negotiation",
      notes: "مستثمر يبحث عن عقارات تجارية في الدمام"
    },
    {
      firstName: "نوف",
      lastName: "الدوسري",
      email: "nouf.aldosari@yahoo.com",
      phone: "966502345678",
      leadSource: "موقع الويب",
      interestType: "شراء",
      budgetRange: "300,000 - 500,000 ﷼",
      status: "new",
      notes: "عميلة جديدة تبحث عن شقة للسكن"
    },
    {
      firstName: "فيصل",
      lastName: "الشمري",
      email: "faisal.alshamari@hotmail.com",
      phone: "966507654321",
      leadSource: "Instagram",
      interestType: "شراء",
      budgetRange: "800,000 - 1,200,000 ﷼",
      status: "qualified",
      notes: "يريد فيلا في الطائف، عائلة كبيرة"
    },
    {
      firstName: "رهف",
      lastName: "العنزي",
      email: "rahaf.alanazi@gmail.com",
      phone: "966503456789",
      leadSource: "WhatsApp",
      interestType: "إيجار",
      budgetRange: "3,000 - 5,000 ﷼ شهرياً",
      status: "showing",
      notes: "تبحث عن شقة مؤثثة للإيجار في الرياض"
    },
    {
      firstName: "بندر",
      lastName: "الرشيد",
      email: "bandar.alrashid@saudipost.com.sa",
      phone: "966508765432",
      leadSource: "Twitter",
      interestType: "بيع",
      budgetRange: "900,000 - 1,100,000 ﷼",
      status: "lost",
      notes: "لم يكمل عملية البيع، وجد عرضاً أفضل"
    },
    {
      firstName: "منى",
      lastName: "الغامدي",
      email: "muna.alghamdi@aramco.com",
      phone: "966504567890",
      leadSource: "إحالة",
      interestType: "شراء",
      budgetRange: "1,500,000 - 2,000,000 ﷼",
      status: "closed",
      notes: "تم إتمام شراء فيلا في مكة بنجاح"
    },
    {
      firstName: "عبدالعزيز",
      lastName: "المالكي",
      email: "abdulaziz.almalki@sabic.com",
      phone: "966511223344",
      leadSource: "LinkedIn",
      interestType: "استثمار",
      budgetRange: "3,000,000 - 5,000,000 ﷼",
      status: "qualified",
      notes: "مدير استثمار يبحث عن مجمعات سكنية"
    },
    {
      firstName: "لمى",
      lastName: "الزهراني",
      email: "lama.alzahrani@ksu.edu.sa",
      phone: "966515678901",
      leadSource: "موقع الويب",
      interestType: "شراء",
      budgetRange: "400,000 - 600,000 ﷼",
      status: "new",
      notes: "أستاذة جامعية تبحث عن شقة قريبة من الجامعة"
    }
  ];

  // إنشاء العقارات (Properties)
  const properties = [
    {
      title: "شقة فاخرة في حي الملقا",
      description: "شقة مؤثثة بالكامل مع إطلالة رائعة على المدينة، تشطيبات عالية الجودة",
      address: "شارع الأمير محمد بن عبدالعزيز",
      city: "الرياض",
      state: "الرياض",
      zipCode: "11564",
      latitude: "24.7136",
      longitude: "46.6753",
      price: "750000.00",
      propertyType: "شقة",
      bedrooms: 3,
      bathrooms: "2.5",
      squareFeet: 180,
      status: "active",
      photoUrls: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        "https://images.unsplash.com/photo-1615873968403-89e068629265"
      ],
      features: ["موقف سيارات", "مصعد", "حمام سباحة", "صالة رياضية", "حديقة"]
    },
    {
      title: "فيلا عصرية في الحمراء",
      description: "فيلا جديدة بتصميم عصري، حديقة واسعة ومسبح خاص",
      address: "حي الحمراء",
      city: "الرياض", 
      state: "الرياض",
      zipCode: "11586",
      latitude: "24.6408",
      longitude: "46.7728",
      price: "1850000.00",
      propertyType: "فيلا",
      bedrooms: 5,
      bathrooms: "4.0",
      squareFeet: 400,
      status: "active",
      photoUrls: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        "https://images.unsplash.com/photo-1505843513577-22bb7d21e455"
      ],
      features: ["مسبح خاص", "حديقة", "غرفة خادمة", "مجلس", "صالة طعام", "مطبخ مجهز"]
    },
    {
      title: "شقة للاستثمار في وسط جدة",
      description: "شقة في موقع استراتيجي مثالية للاستثمار أو السكن",
      address: "شارع التحلية",
      city: "جدة",
      state: "مكة المكرمة", 
      zipCode: "21432",
      latitude: "21.5810",
      longitude: "39.1653",
      price: "950000.00",
      propertyType: "شقة",
      bedrooms: 4,
      bathrooms: "3.0",
      squareFeet: 220,
      status: "pending",
      photoUrls: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
      ],
      features: ["إطلالة بحرية", "قريب من المولات", "موقف مظلل", "أمن وحراسة"]
    },
    {
      title: "مكتب تجاري في الخبر",
      description: "مكتب في برج تجاري حديث مع جميع المرافق",
      address: "شارع الملك فيصل",
      city: "الخبر",
      state: "المنطقة الشرقية",
      zipCode: "31952", 
      latitude: "26.2172",
      longitude: "50.1971",
      price: "1200000.00",
      propertyType: "تجاري",
      bedrooms: 0,
      bathrooms: "2.0",
      squareFeet: 150,
      status: "active",
      photoUrls: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2"
      ],
      features: ["مصاعد حديثة", "موقف مخصص", "قاعة اجتماعات", "استقبال"]
    },
    {
      title: "استراحة في الطائف",
      description: "استراحة جميلة في مناخ معتدل مع إطلالة على الجبال",
      address: "طريق الهدا",
      city: "الطائف",
      state: "مكة المكرمة",
      zipCode: "21974",
      latitude: "21.2703",
      longitude: "40.4158",
      price: "680000.00",
      propertyType: "استراحة",
      bedrooms: 4,
      bathrooms: "3.0",
      squareFeet: 300,
      status: "active",
      photoUrls: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000"
      ],
      features: ["إطلالة جبلية", "مسبح", "شواء", "حديقة واسعة", "هواء نقي"]
    },
    {
      title: "شقة مفروشة للإيجار",
      description: "شقة مفروشة بالكامل جاهزة للسكن الفوري",
      address: "حي النخيل",
      city: "الرياض",
      state: "الرياض", 
      zipCode: "11564",
      latitude: "24.7422",
      longitude: "46.6719",
      price: "4500.00",
      propertyType: "شقة",
      bedrooms: 2,
      bathrooms: "2.0",
      squareFeet: 120,
      status: "active",
      photoUrls: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
      ],
      features: ["مفروشة", "مطبخ مجهز", "إنترنت مجاني", "كهرباء مدفوعة"]
    }
  ];

  // إنشاء الأنشطة (Activities)
  const activities = [
    {
      leadId: "",
      activityType: "مكالمة",
      title: "مكالمة متابعة أولية",
      description: "مناقشة متطلبات العميل وميزانيته",
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // في يومين
      completed: false
    },
    {
      leadId: "",
      activityType: "معاينة",
      title: "معاينة الشقة في الملقا",
      description: "موعد لمعاينة الشقة مع العميل",
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // في ثلاثة أيام
      completed: false
    },
    {
      leadId: "",
      activityType: "إيميل",
      title: "إرسال كتالوج العقارات",
      description: "تم إرسال كتالوج العقارات المتاحة",
      scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // أمس
      completed: true
    },
    {
      leadId: "",
      activityType: "اجتماع",
      title: "لقاء في المكتب",
      description: "مناقشة تفاصيل العقد والأسعار",
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // في خمسة أيام
      completed: false
    }
  ];

  // إنشاء البيانات الفعلية
  try {
    // إضافة العملاء المحتملين
    const createdLeads = [];
    for (const leadData of leads) {
      const lead = await storage.createLead(leadData);
      createdLeads.push(lead);
    }

    // إضافة العقارات
    const createdProperties = [];
    for (const propertyData of properties) {
      const property = await storage.createProperty(propertyData);
      createdProperties.push(property);
    }

    // إضافة الأنشطة مع ربطها بالعملاء
    for (let i = 0; i < activities.length; i++) {
      const activityData = {
        ...activities[i],
        leadId: createdLeads[i % createdLeads.length].id
      };
      await storage.createActivity(activityData);
    }

    // إضافة الصفقات
    const deals = [
      {
        leadId: createdLeads[0].id,
        propertyId: createdProperties[0].id,
        stage: "qualified",
        dealValue: "750000.00",
        commission: "22500.00",
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "عميل جاد، يحتاج تمويل بنكي"
      },
      {
        leadId: createdLeads[1].id,
        propertyId: createdProperties[1].id,
        stage: "showing",
        dealValue: "1850000.00", 
        commission: "55500.00",
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        notes: "معاينة مجدولة الأسبوع القادم"
      },
      {
        leadId: createdLeads[2].id,
        propertyId: createdProperties[3].id,
        stage: "negotiation",
        dealValue: "1200000.00",
        commission: "36000.00", 
        expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: "تفاوض على السعر النهائي"
      },
      {
        leadId: createdLeads[7].id,
        propertyId: createdProperties[4].id,
        stage: "closed",
        dealValue: "680000.00",
        commission: "20400.00",
        actualCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: "تمت الصفقة بنجاح"
      }
    ];

    for (const dealData of deals) {
      await storage.createDeal(dealData);
    }

    // إضافة رسائل WhatsApp
    const messages = [
      {
        leadId: createdLeads[0].id,
        messageType: "whatsapp",
        phoneNumber: createdLeads[0].phone!,
        message: "مرحباً أحمد، شكراً لاهتمامك بالشقة في الملقا. هل يمكننا تحديد موعد للمعاينة؟",
        status: "sent"
      },
      {
        leadId: createdLeads[1].id,
        messageType: "whatsapp", 
        phoneNumber: createdLeads[1].phone!,
        message: "أهلاً فاطمة، بخصوص الفيلا المعروضة للبيع، هل تفضلين مناقشة التفاصيل عبر الهاتف؟",
        status: "delivered"
      },
      {
        leadId: createdLeads[5].id,
        messageType: "whatsapp",
        phoneNumber: createdLeads[5].phone!,
        message: "مرحباً ريم، وجدنا لك عدة خيارات للشقق المفروشة. متى يمكنك المعاينة؟",
        status: "pending"
      }
    ];

    for (const messageData of messages) {
      await storage.createMessage(messageData);
    }

    console.log("✅ تم إنشاء البيانات التجريبية بنجاح:");
    console.log(`- ${createdLeads.length} عملاء محتملين`);
    console.log(`- ${createdProperties.length} عقارات`);
    console.log(`- ${activities.length} أنشطة`);
    console.log(`- ${deals.length} صفقات`);
    console.log(`- ${messages.length} رسائل واتساب`);

  } catch (error) {
    console.error("خطأ في إنشاء البيانات التجريبية:", error);
    throw error;
  }
}