// Direct database test for properties_seeker table
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data that matches the form structure
const testFormData = {
  firstName: "فاطمة",
  lastName: "السعد",
  mobileNumber: "+966501234570",
  email: "fatima.alsad@example.com",
  nationality: "سعودية",
  age: 32,
  monthlyIncome: 15000,
  gender: "female",
  typeOfProperty: "فيلا",
  typeOfContract: "buy",
  numberOfRooms: 4,
  numberOfBathrooms: 3,
  numberOfLivingRooms: 2,
  houseDirection: "south",
  budgetSize: 800000,
  hasMaidRoom: true,
  hasDriverRoom: true,
  kitchenInstalled: true,
  hasElevator: false,
  parkingAvailable: true,
  city: "الدمام",
  district: "الخبر",
  region: "الشرقية",
  sqm: 250,
  notes: "أبحث عن فيلا عائلية"
};

async function testDatabasePush() {
  console.log("🧪 Testing database push function...");
  console.log("📝 Test data:", JSON.stringify(testFormData, null, 2));

  try {
    // Test the exact same logic that the API uses
    const result = await prisma.propertySeeker.upsert({
      where: {
        email_mobileNumber: {
          email: testFormData.email,
          mobileNumber: testFormData.mobileNumber,
        },
      },
      create: {
        firstName: testFormData.firstName,
        lastName: testFormData.lastName,
        mobileNumber: testFormData.mobileNumber,
        email: testFormData.email,
        nationality: testFormData.nationality,
        age: testFormData.age,
        monthlyIncome: testFormData.monthlyIncome,
        gender: testFormData.gender,
        typeOfProperty: testFormData.typeOfProperty,
        typeOfContract: testFormData.typeOfContract,
        numberOfRooms: testFormData.numberOfRooms,
        numberOfBathrooms: testFormData.numberOfBathrooms,
        numberOfLivingRooms: testFormData.numberOfLivingRooms,
        houseDirection: testFormData.houseDirection,
        budgetSize: testFormData.budgetSize,
        hasMaidRoom: testFormData.hasMaidRoom,
        hasDriverRoom: testFormData.hasDriverRoom,
        kitchenInstalled: testFormData.kitchenInstalled,
        hasElevator: testFormData.hasElevator,
        parkingAvailable: testFormData.parkingAvailable,
        city: testFormData.city,
        district: testFormData.district,
        region: testFormData.region,
        otherComments: testFormData.notes,
        sqm: testFormData.sqm,
      },
      update: {
        firstName: testFormData.firstName,
        lastName: testFormData.lastName,
        mobileNumber: testFormData.mobileNumber,
        email: testFormData.email,
        nationality: testFormData.nationality,
        age: testFormData.age,
        monthlyIncome: testFormData.monthlyIncome,
        gender: testFormData.gender,
        typeOfProperty: testFormData.typeOfProperty,
        typeOfContract: testFormData.typeOfContract,
        numberOfRooms: testFormData.numberOfRooms,
        numberOfBathrooms: testFormData.numberOfBathrooms,
        numberOfLivingRooms: testFormData.numberOfLivingRooms,
        houseDirection: testFormData.houseDirection,
        budgetSize: testFormData.budgetSize,
        hasMaidRoom: testFormData.hasMaidRoom,
        hasDriverRoom: testFormData.hasDriverRoom,
        kitchenInstalled: testFormData.kitchenInstalled,
        hasElevator: testFormData.hasElevator,
        parkingAvailable: testFormData.parkingAvailable,
        city: testFormData.city,
        district: testFormData.district,
        region: testFormData.region,
        otherComments: testFormData.notes,
        sqm: testFormData.sqm,
      },
    });

    console.log("✅ SUCCESS! Data pushed to database:");
    console.log("🆔 Seeker ID:", result.seekerId);
    console.log("👤 Name:", result.firstName, result.lastName);
    console.log("📧 Email:", result.email);
    console.log("🏠 Property:", result.typeOfProperty, "-", result.typeOfContract);
    console.log("💰 Budget:", result.budgetSize);
    console.log("📍 Location:", result.city, result.district);

    // Verify the data was saved
    const verification = await prisma.propertySeeker.findUnique({
      where: { seekerId: result.seekerId }
    });

    console.log("\n🔍 Verification - Record found:", !!verification);
    console.log("📊 Total records in database:", await prisma.propertySeeker.count());

  } catch (error) {
    console.error("❌ ERROR pushing to database:", error);
    console.error("Error details:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabasePush();

