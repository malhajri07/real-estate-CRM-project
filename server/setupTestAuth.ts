import { db } from "./db";
import { users, userPermissions } from "@shared/schema";

const TEST_USERS = [
  {
    id: "admin-1",
    email: "admin@aqaraty.com",
    firstName: "مدير",
    lastName: "المنصة",
    userLevel: 1,
    companyName: "منصة عقاراتي",
    tenantId: "admin-1",
    isActive: true,
    subscriptionStatus: "active",
    subscriptionTier: "enterprise",
    maxSeats: 1000,
    usedSeats: 0
  },
  {
    id: "owner-1", 
    email: "ahmed@company1.com",
    firstName: "أحمد",
    lastName: "الأحمد",
    userLevel: 2,
    companyName: "شركة الأحمد العقارية",
    tenantId: "owner-1",
    isActive: true,
    subscriptionStatus: "active",
    subscriptionTier: "professional",
    maxSeats: 10,
    usedSeats: 2
  },
  {
    id: "owner-2",
    email: "fatima@company2.com", 
    firstName: "فاطمة",
    lastName: "السالم",
    userLevel: 2,
    companyName: "مؤسسة السالم للعقارات",
    tenantId: "owner-2",
    isActive: true,
    subscriptionStatus: "active",
    subscriptionTier: "business",
    maxSeats: 5,
    usedSeats: 2
  },
  {
    id: "sub-1",
    email: "mohammed@company1.com",
    firstName: "محمد", 
    lastName: "الأحمد",
    userLevel: 3,
    companyName: "شركة الأحمد العقارية",
    tenantId: "owner-1",
    accountOwnerId: "owner-1",
    isActive: true,
    subscriptionStatus: "active"
  },
  {
    id: "sub-2",
    email: "khalid@company2.com",
    firstName: "خالد",
    lastName: "السالم", 
    userLevel: 3,
    companyName: "مؤسسة السالم للعقارات",
    tenantId: "owner-2",
    accountOwnerId: "owner-2",
    isActive: true,
    subscriptionStatus: "active"
  }
];

async function setupTestAuth() {
  console.log("🔧 إعداد المستخدمين التجريبيين...");

  try {
    // Insert test users
    for (const user of TEST_USERS) {
      await db.insert(users).values(user).onConflictDoUpdate({
        target: users.id,
        set: {
          ...user,
          updatedAt: new Date()
        }
      });
      
      // Create permissions for each user
      const permissions = [
        "view_dashboard", "view_leads", "create_leads", "edit_leads", "delete_leads",
        "view_properties", "create_properties", "edit_properties", "delete_properties",
        "view_deals", "create_deals", "edit_deals", "delete_deals",
        "view_activities", "create_activities", "edit_activities", "delete_activities",
        "view_messages", "send_messages"
      ];

      // Platform admins and account owners get all permissions
      if (user.userLevel === 1 || user.userLevel === 2) {
        permissions.push(
          "manage_users", "view_reports", "manage_settings", 
          "manage_integrations", "view_analytics", "export_data"
        );
      }

      for (const permission of permissions) {
        await db.insert(userPermissions).values({
          userId: user.id,
          permission,
          granted: true
        }).onConflictDoNothing();
      }

      console.log(`✅ تم إنشاء المستخدم: ${user.firstName} ${user.lastName} - ${user.id}`);
    }

    console.log("🎉 تم إعداد جميع المستخدمين التجريبيين بنجاح!");
    
  } catch (error) {
    console.error("❌ خطأ في إعداد المستخدمين:", error);
  }
}

// Run if called directly
setupTestAuth().then(() => process.exit(0));

export { setupTestAuth };