import { storage } from "./storage";
import { createDefaultUserPermissions, UserLevel } from "./authMiddleware";

/**
 * Create test users for all roles with simple access credentials
 */
export async function createTestUsers() {
  console.log("🔧 إنشاء المستخدمين التجريبيين...");

  try {
    // 1. Platform Admin
    const admin = await storage.upsertUser({
      id: "admin-1",
      firstName: "مدير",
      lastName: "المنصة", 
      email: "admin@aqaraty.com",
      userLevel: UserLevel.PLATFORM_ADMIN,
      companyName: "منصة عقاراتي",
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "enterprise",
      maxSeats: 1000,
      usedSeats: 0,
      tenantId: "admin-1"
    });
    await createDefaultUserPermissions(admin.id, UserLevel.PLATFORM_ADMIN);
    console.log("✅ تم إنشاء مدير المنصة - ID: admin-1");

    // 2. Account Owner 1 - Ahmad Real Estate
    const owner1 = await storage.upsertUser({
      id: "owner-1",
      firstName: "أحمد",
      lastName: "الأحمد",
      email: "ahmed@company1.com", 
      userLevel: UserLevel.ACCOUNT_OWNER,
      companyName: "شركة الأحمد العقارية",
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "professional", 
      maxSeats: 10,
      usedSeats: 1,
      tenantId: "owner-1"
    });
    await createDefaultUserPermissions(owner1.id, UserLevel.ACCOUNT_OWNER);
    console.log("✅ تم إنشاء مالك الحساب الأول - ID: owner-1");

    // 3. Account Owner 2 - Salim Real Estate  
    const owner2 = await storage.upsertUser({
      id: "owner-2",
      firstName: "فاطمة",
      lastName: "السالم",
      email: "fatima@company2.com",
      userLevel: UserLevel.ACCOUNT_OWNER, 
      companyName: "مؤسسة السالم للعقارات",
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "business",
      maxSeats: 5,
      usedSeats: 1,
      tenantId: "owner-2"
    });
    await createDefaultUserPermissions(owner2.id, UserLevel.ACCOUNT_OWNER);
    console.log("✅ تم إنشاء مالك الحساب الثاني - ID: owner-2");

    // 4. Sub-Account under Owner 1
    const sub1 = await storage.upsertUser({
      id: "sub-1",
      firstName: "محمد", 
      lastName: "الأحمد",
      email: "mohammed@company1.com",
      userLevel: UserLevel.SUB_ACCOUNT,
      accountOwnerId: "owner-1",
      companyName: "شركة الأحمد العقارية", 
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "professional",
      tenantId: "owner-1" // Same tenant as owner
    });
    await createDefaultUserPermissions(sub1.id, UserLevel.SUB_ACCOUNT);
    console.log("✅ تم إنشاء الحساب الفرعي الأول - ID: sub-1");

    // 5. Sub-Account under Owner 2
    const sub2 = await storage.upsertUser({
      id: "sub-2", 
      firstName: "خالد",
      lastName: "السالم",
      email: "khalid@company2.com",
      userLevel: UserLevel.SUB_ACCOUNT,
      accountOwnerId: "owner-2",
      companyName: "مؤسسة السالم للعقارات",
      isActive: true,
      subscriptionStatus: "active", 
      subscriptionTier: "business",
      tenantId: "owner-2" // Same tenant as owner
    });
    await createDefaultUserPermissions(sub2.id, UserLevel.SUB_ACCOUNT);
    console.log("✅ تم إنشاء الحساب الفرعي الثاني - ID: sub-2");

    console.log("\n🎉 تم إنشاء جميع المستخدمين التجريبيين بنجاح!");
    console.log("\nبيانات الدخول (استخدم x-user-id في headers):");
    console.log("- مدير المنصة: admin-1");
    console.log("- مالك الحساب الأول: owner-1"); 
    console.log("- مالك الحساب الثاني: owner-2");
    console.log("- الحساب الفرعي الأول: sub-1");
    console.log("- الحساب الفرعي الثاني: sub-2");

    return {
      admin: admin.id,
      owner1: owner1.id,
      owner2: owner2.id, 
      sub1: sub1.id,
      sub2: sub2.id
    };

  } catch (error) {
    console.error("❌ خطأ في إنشاء المستخدمين:", error);
    throw error;
  }
}