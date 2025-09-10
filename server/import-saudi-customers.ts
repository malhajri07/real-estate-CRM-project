import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { leads, activities, deals, messages } from '@shared/schema';

// تعريف نوع البيانات للسجل الواحد
interface CustomerRecord {
  'اسم العميل': string;
  'رقم الهاتف': string;
  'الجنس': string;
  'الحالة الاجتماعية': string;
  'العمر': string;
  'عدد المعالين': string;
  'المهنة': string;
  'متوسط الدخل الشهري': string;
  'نوع العقار الذي يبحث عنه': string;
  'ميزانية العميل': string;
  'المدينة': string;
}

// تنظيف البيانات السابقة
async function clearExistingData() {
  console.log('🗑️ حذف البيانات السابقة...');
  await db.delete(messages);
  await db.delete(activities);
  await db.delete(deals);
  await db.delete(leads);
  console.log('✅ تم حذف البيانات السابقة');
}

// تحويل الحالة الاجتماعية من العربية إلى الإنجليزية
function convertMaritalStatus(arabicStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'أعزب': 'single',
    'عزباء': 'single',
    'متزوج': 'married',
    'متزوجة': 'married',
    'مطلق': 'divorced',
    'مطلقة': 'divorced',
    'أرمل': 'widowed',
    'أرملة': 'widowed'
  };
  return statusMap[arabicStatus] || 'single';
}

// تحويل الميزانية إلى نطاق سعري
function convertBudgetRange(budget: number): string {
  if (budget < 500000) return 'أقل من 500,000 ريال';
  if (budget < 1000000) return '500,000 - 1,000,000 ريال';
  if (budget < 2000000) return '1,000,000 - 2,000,000 ريال';
  if (budget < 3000000) return '2,000,000 - 3,000,000 ريال';
  if (budget < 5000000) return '3,000,000 - 5,000,000 ريال';
  return 'أكثر من 5,000,000 ريال';
}

// تقسيم الاسم الكامل إلى اسم أول وأخير
function splitName(fullName: string | undefined): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') {
    return {
      firstName: 'غير محدد',
      lastName: 'العميل'
    };
  }
  
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length >= 2) {
    return {
      firstName: nameParts[0] || 'غير محدد',
      lastName: nameParts.slice(1).join(' ') || 'العميل'
    };
  }
  return {
    firstName: nameParts[0] || 'غير محدد',
    lastName: 'العميل'
  };
}

// إنشاء بريد إلكتروني من الاسم ورقم الهاتف
function generateEmail(fullName: string, phone: string): string {
  const { firstName, lastName } = splitName(fullName);
  const cleanPhone = phone.replace(/\D/g, '').slice(-4);
  const transliteratedName = `${firstName.replace(/\s+/g, '')}.${lastName.replace(/\s+/g, '')}`.toLowerCase();
  return `${transliteratedName}${cleanPhone}@customer.sa`;
}

async function importSaudiCustomers() {
  try {
    console.log('🚀 بدء استيراد بيانات العملاء السعوديين...');
    
    // قراءة ملف CSV
    const csvContent = readFileSync('attached_assets/saudi_customers_dataset_with_city (2)_1756513642047.csv', 'utf-8');
    const records: CustomerRecord[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      encoding: 'utf8'
    });

    console.log(`📊 تم العثور على ${records.length} عميل`);

    // حذف البيانات السابقة
    await clearExistingData();

    // استيراد البيانات الجديدة
    console.log('👥 بدء استيراد العملاء...');
    
    const leads_to_insert = [];
    
    for (const record of records) {
      // التحقق من وجود البيانات المطلوبة
      if (!record || typeof record !== 'object') continue;
      
      const fullName = record['اسم العميل'] || 'غير محدد';
      const phone = record['رقم الهاتف'] || '0500000000';
      const maritalStatus = record['الحالة الاجتماعية'] || 'أعزب';
      const age = parseInt(record['العمر']) || 25;
      const dependents = parseInt(record['عدد المعالين']) || 0;
      const profession = record['المهنة'] || 'غير محدد';
      const income = record['متوسط الدخل الشهري'] || '0';
      const propertyType = record['نوع العقار الذي يبحث عنه'] || 'شقة';
      const budget = parseInt(record['ميزانية العميل']) || 500000;
      const city = record['المدينة'] || 'الرياض';

      // تقسيم الاسم
      const { firstName, lastName } = splitName(fullName);

      // إنشاء البريد الإلكتروني
      const email = generateEmail(fullName, phone);

      // تحويل الحالة الاجتماعية
      const convertedMaritalStatus = convertMaritalStatus(maritalStatus);

      // تحويل الميزانية إلى نطاق
      const budgetRange = convertBudgetRange(budget);

      // إنشاء ملاحظات تتضمن تفاصيل إضافية
      const notes = `المهنة: ${profession}
متوسط الدخل الشهري: ${income} ريال
نوع العقار المطلوب: ${propertyType}
الميزانية: ${budget.toLocaleString()} ريال`;

      const leadData = {
        firstName,
        lastName,
        email,
        phone,
        city,
        age,
        maritalStatus: convertedMaritalStatus,
        numberOfDependents: dependents,
        leadSource: 'استيراد بيانات',
        interestType: 'buying',
        budgetRange,
        status: 'new' as const,
        notes,
        tenantId: 'default-tenant',
        createdBy: 'system-import'
      };

      leads_to_insert.push(leadData);
    }

    // إدراج البيانات في قاعدة البيانات
    await db.insert(leads).values(leads_to_insert as any);

    console.log(`✅ تم استيراد ${leads_to_insert.length} عميل بنجاح!`);
    console.log('🎉 اكتمل استيراد البيانات السعودية');

  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
    throw error;
  }
}

// تشغيل السكريبت
async function main() {
  try {
    await importSaudiCustomers();
    console.log('✅ تم الانتهاء من استيراد البيانات');
    process.exit(0);
  } catch (error) {
    console.error('❌ فشل في استيراد البيانات:', error);
    process.exit(1);
  }
}

// تشغيل الدالة الرئيسية
main();

export { importSaudiCustomers };
