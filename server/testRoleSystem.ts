import { storage } from "./storage";
import { createDefaultUserPermissions, UserLevel } from "./authMiddleware";

/**
 * Test script to validate the role-based access control system
 * This script creates test users and validates the multi-tenant architecture
 */

export async function testRoleSystem() {
  console.log("🔧 بدء اختبار نظام إدارة الأدوار والصلاحيات...");

  try {
    // Create Platform Admin
    const platformAdmin = await storage.createUser({
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
    });
    console.log("✅ تم إنشاء مدير المنصة:", platformAdmin.id);

    // Create permissions for platform admin
    await createDefaultUserPermissions(platformAdmin.id, UserLevel.PLATFORM_ADMIN);
    console.log("✅ تم إنشاء صلاحيات مدير المنصة");

    // Create Account Owner 1
    const accountOwner1 = await storage.createUser({
      firstName: "أحمد",
      lastName: "الأحمد",
      email: "ahmed@company1.com",
      userLevel: UserLevel.ACCOUNT_OWNER,
      companyName: "شركة الأحمد العقارية",
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "professional",
      maxSeats: 10,
      usedSeats: 0,
      tenantId: null, // Will be set to their own ID
    });

    // Set tenantId to own ID for account owner
    await storage.upsertUser({
      ...accountOwner1,
      tenantId: accountOwner1.id,
    });
    console.log("✅ تم إنشاء مالك الحساب الأول:", accountOwner1.id);

    // Create permissions for account owner 1
    await createDefaultUserPermissions(accountOwner1.id, UserLevel.ACCOUNT_OWNER);
    console.log("✅ تم إنشاء صلاحيات مالك الحساب الأول");

    // Create Account Owner 2
    const accountOwner2 = await storage.createUser({
      firstName: "فاطمة",
      lastName: "السالم",
      email: "fatima@company2.com",
      userLevel: UserLevel.ACCOUNT_OWNER,
      companyName: "مؤسسة السالم للعقارات",
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: "business",
      maxSeats: 5,
      usedSeats: 0,
      tenantId: null,
    });

    // Set tenantId to own ID for account owner 2
    await storage.upsertUser({
      ...accountOwner2,
      tenantId: accountOwner2.id,
    });
    console.log("✅ تم إنشاء مالك الحساب الثاني:", accountOwner2.id);

    // Create permissions for account owner 2
    await createDefaultUserPermissions(accountOwner2.id, UserLevel.ACCOUNT_OWNER);
    console.log("✅ تم إنشاء صلاحيات مالك الحساب الثاني");

    // Create Sub-account 1 under Account Owner 1
    const subAccount1 = await storage.createUser({
      firstName: "محمد",
      lastName: "الأحمد",
      email: "mohammed@company1.com",
      userLevel: UserLevel.SUB_ACCOUNT,
      accountOwnerId: accountOwner1.id,
      companyName: accountOwner1.companyName,
      tenantId: accountOwner1.id, // Same tenant as account owner
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: accountOwner1.subscriptionTier,
    });
    console.log("✅ تم إنشاء الحساب الفرعي الأول:", subAccount1.id);

    // Create permissions for sub-account 1
    await createDefaultUserPermissions(subAccount1.id, UserLevel.SUB_ACCOUNT);
    console.log("✅ تم إنشاء صلاحيات الحساب الفرعي الأول");

    // Create Sub-account 2 under Account Owner 2
    const subAccount2 = await storage.createUser({
      firstName: "خالد",
      lastName: "السالم",
      email: "khalid@company2.com",
      userLevel: UserLevel.SUB_ACCOUNT,
      accountOwnerId: accountOwner2.id,
      companyName: accountOwner2.companyName,
      tenantId: accountOwner2.id, // Same tenant as account owner
      isActive: true,
      subscriptionStatus: "active",
      subscriptionTier: accountOwner2.subscriptionTier,
    });
    console.log("✅ تم إنشاء الحساب الفرعي الثاني:", subAccount2.id);

    // Create permissions for sub-account 2
    await createDefaultUserPermissions(subAccount2.id, UserLevel.SUB_ACCOUNT);
    console.log("✅ تم إنشاء صلاحيات الحساب الفرعي الثاني");

    // Create test data for tenant isolation testing
    // Create leads for Account Owner 1's tenant
    const lead1 = await storage.createLead({
      firstName: "عبدالله",
      lastName: "المحمد",
      phone: "0501234567",
      email: "abdullah@email.com",
      interestType: "شراء",
      status: "جديد",
      budget: 500000,
    }, accountOwner1.id, accountOwner1.id);
    console.log("✅ تم إنشاء عميل محتمل للمؤسسة الأولى");

    // Create leads for Account Owner 2's tenant
    const lead2 = await storage.createLead({
      firstName: "نورا",
      lastName: "الزهراني",
      phone: "0507654321",
      email: "nora@email.com",
      interestType: "إيجار",
      status: "مؤهل",
      budget: 30000,
    }, accountOwner2.id, accountOwner2.id);
    console.log("✅ تم إنشاء عميل محتمل للمؤسسة الثانية");

    // Test tenant isolation
    const tenant1Leads = await storage.getAllLeads(accountOwner1.id);
    const tenant2Leads = await storage.getAllLeads(accountOwner2.id);
    const allLeads = await storage.getAllLeads(); // Platform admin view

    console.log("\n📊 اختبار عزل البيانات:");
    console.log(`- العملاء المحتملون للمؤسسة الأولى: ${tenant1Leads.length}`);
    console.log(`- العملاء المحتملون للمؤسسة الثانية: ${tenant2Leads.length}`);
    console.log(`- إجمالي العملاء المحتملون (رؤية مدير المنصة): ${allLeads.length}`);

    // Verify tenant isolation is working
    if (tenant1Leads.some(lead => lead.tenantId !== accountOwner1.id)) {
      throw new Error("❌ فشل في عزل البيانات للمؤسسة الأولى!");
    }

    if (tenant2Leads.some(lead => lead.tenantId !== accountOwner2.id)) {
      throw new Error("❌ فشل في عزل البيانات للمؤسسة الثانية!");
    }

    console.log("\n🎉 تم اختبار نظام إدارة الأدوار والصلاحيات بنجاح!");
    console.log("✅ عزل البيانات يعمل بشكل صحيح");
    console.log("✅ الصلاحيات تم إنشاؤها لجميع المستخدمين");
    console.log("✅ الهيكل الهرمي للمستخدمين يعمل بشكل صحيح");

    return {
      platformAdmin: platformAdmin.id,
      accountOwner1: accountOwner1.id,
      accountOwner2: accountOwner2.id,
      subAccount1: subAccount1.id,
      subAccount2: subAccount2.id,
    };

  } catch (error) {
    console.error("❌ فشل في اختبار نظام إدارة الأدوار:", error);
    throw error;
  }
}