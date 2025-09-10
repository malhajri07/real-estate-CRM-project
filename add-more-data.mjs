import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a simple script that adds data using the existing storage
const scriptContent = `
// Simple data addition script
const cities = ["الرياض", "جدة", "الدمام", "الخبر", "الطائف", "مكة", "المدينة", "الاحساء", "القطيف", "حائل", "أبها", "تبوك", "بريدة", "نجران", "الباحة"];

const arabicFirstNames = [
  "محمد", "أحمد", "عبدالله", "فيصل", "خالد", "سعد", "عبدالرحمن", "يوسف", "عبدالعزيز", "بندر",
  "فاطمة", "عائشة", "خديجة", "سارة", "نورا", "هدى", "مريم", "زينب", "رقية", "منى",
  "عبدالإله", "طلال", "مساعد", "ناصر", "عمر", "علي", "إبراهيم", "عثمان", "صالح", "حسام",
  "نوف", "رهف", "غدير", "لمى", "أمل", "ريم", "دانة", "شهد", "جود", "رغد"
];

const arabicLastNames = [
  "العتيبي", "الحربي", "القحطاني", "الدوسري", "الشمري", "العنزي", "الرشيد", "الغامدي", "المالكي", "الزهراني",
  "السعد", "الأحمد", "المطيري", "الشهري", "العلي", "البقمي", "الجهني", "الثقفي", "الحازمي", "الصاعدي",
  "المحمدي", "السلمي", "الحسيني", "الفهد", "الراشد", "العريفي", "الخثعمي", "البيشي", "الحمداني", "النجار"
];

const emailDomains = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
  "stc.com.sa", "mobily.com.sa", "zain.sa", "aramco.com", "sabic.com"
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addMoreData() {
  console.log("🚀 بدء إضافة المزيد من البيانات...");
  
  try {
    // Import the storage module dynamically
    const { storage } = await import('./server/storage.ts');
    
    const admin1Id = "admin1-user-id";
    const tenantId = "admin1-tenant";
    
    // Create more leads
    console.log("👥 إنشاء المزيد من العملاء المحتملين...");
    const createdLeads = [];
    for (let i = 0; i < 100; i++) {
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
        notes: \`عميل \${firstName} \${lastName} - مهتم بالعقارات في \${getRandomElement(cities)}\`
      };

      const lead = await storage.createLead(leadData, admin1Id, tenantId);
      createdLeads.push(lead);
      
      if ((i + 1) % 50 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} عميل محتمل\`);
      }
    }

    // Create more activities
    console.log("📋 إنشاء المزيد من الأنشطة...");
    for (let i = 0; i < 150; i++) {
      const lead = getRandomElement(createdLeads);
      
      const activityData = {
        leadId: lead.id,
        activityType: getRandomElement(["call", "email", "meeting", "note", "showing"]),
        title: \`نشاط \${i + 1}\`,
        description: \`وصف النشاط للعميل \${lead.firstName} \${lead.lastName}\`,
        scheduledDate: new Date(Date.now() + getRandomNumber(-30, 30) * 24 * 60 * 60 * 1000),
        completed: Math.random() > 0.3
      };

      await storage.createActivity(activityData, tenantId);
      
      if ((i + 1) % 50 === 0) {
        console.log(\`✅ تم إنشاء \${i + 1} نشاط\`);
      }
    }

    // Create more WhatsApp messages
    console.log("💬 إنشاء المزيد من رسائل WhatsApp...");
    for (let i = 0; i < 50; i++) {
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

    console.log(\`✅ تم إضافة المزيد من البيانات بنجاح:\`);
    console.log(\`- \${createdLeads.length} عميل محتمل إضافي\`);
    console.log(\`- 150 نشاط إضافي\`);
    console.log(\`- 50 رسالة WhatsApp إضافية\`);
    
    return {
      leads: createdLeads.length,
      activities: 150,
      messages: 50
    };

  } catch (error) {
    console.error("❌ خطأ في إضافة البيانات:", error);
    throw error;
  }
}

// Run the function
addMoreData()
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
const tempScriptPath = path.join(process.cwd(), 'temp-add-more-data.mjs');
fs.writeFileSync(tempScriptPath, scriptContent);

try {
  console.log('🚀 تشغيل سكريبت إضافة المزيد من البيانات...');
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
