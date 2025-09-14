import { storage } from "./storage-prisma";
// Note: saudiRegions data moved to inline definition

// Saudi Arabia's 13 official administrative regions
const regions = [
  {
    nameArabic: "الرياض",
    nameEnglish: "Riyadh",
    code: "SA-01"
  },
  {
    nameArabic: "مكة المكرمة",
    nameEnglish: "Makkah",
    code: "SA-02"
  },
  {
    nameArabic: "المدينة المنورة",
    nameEnglish: "Madinah",
    code: "SA-03"
  },
  {
    nameArabic: "القصيم",
    nameEnglish: "Al-Qassim",
    code: "SA-05"
  },
  {
    nameArabic: "المنطقة الشرقية",
    nameEnglish: "Eastern Province",
    code: "SA-04"
  },
  {
    nameArabic: "عسير",
    nameEnglish: "Asir",
    code: "SA-11"
  },
  {
    nameArabic: "تبوك",
    nameEnglish: "Tabuk",
    code: "SA-07"
  },
  {
    nameArabic: "حائل",
    nameEnglish: "Hail",
    code: "SA-06"
  },
  {
    nameArabic: "الحدود الشمالية",
    nameEnglish: "Northern Borders",
    code: "SA-08"
  },
  {
    nameArabic: "جازان",
    nameEnglish: "Jazan",
    code: "SA-09"
  },
  {
    nameArabic: "نجران",
    nameEnglish: "Najran",
    code: "SA-10"
  },
  {
    nameArabic: "الباحة",
    nameEnglish: "Al Bahah",
    code: "SA-12"
  },
  {
    nameArabic: "الجوف",
    nameEnglish: "Al Jawf",
    code: "SA-13"
  }
];

async function seedSaudiRegions() {
  try {
    console.log("🇸🇦 Adding Saudi Arabia's 13 official regions...");
    
    // Check if regions already exist
    const existingRegions = await db.select().from(saudiRegions);
    
    if (existingRegions.length > 0) {
      console.log("✅ Regions already exist in database");
      return;
    }
    
    // Insert all regions
    const insertedRegions = await db.insert(saudiRegions)
      .values(regions)
      .returning();
    
    console.log(`✅ Successfully added ${insertedRegions.length} Saudi regions`);
    
    // Display added regions
    console.log("\n📍 Added regions:");
    insertedRegions.forEach((region, index) => {
      console.log(`${index + 1}. ${region.nameArabic} (${region.nameEnglish}) - ${region.code}`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding Saudi regions:", error);
    throw error;
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seedSaudiRegions()
    .then(() => {
      console.log("\n🎉 Saudi regions seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedSaudiRegions };