const { populateAdmin1Data } = require('./server/populateAdmin1Data.ts');

async function runPopulateAdmin1() {
  try {
    console.log('🚀 بدء تشغيل سكريبت إضافة البيانات لـ Admin1...');
    await populateAdmin1Data();
    console.log('✅ تم الانتهاء من إضافة البيانات بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في تشغيل السكريبت:', error);
    process.exit(1);
  }
}

runPopulateAdmin1();
