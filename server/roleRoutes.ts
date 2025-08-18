import type { Express } from "express";
import { storage } from "./storage";
import { 
  requireAuth, 
  requireRole, 
  requirePermission,
  requireTenantAccess,
  createDefaultUserPermissions,
  UserLevel,
  type AuthenticatedRequest 
} from "./authMiddleware";
import { insertUserPermissionsSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoleBasedRoutes(app: Express) {
  
  // USER MANAGEMENT ROUTES - Account Owner Level Access

  // Get all users in the account (account owner can see sub-accounts)
  app.get('/api/users', 
    requireAuth, 
    requireRole([UserLevel.PLATFORM_ADMIN, UserLevel.ACCOUNT_OWNER]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        
        // Access storage and database imports from the storage module
        const { db } = await import("./db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        if (user.userLevel === UserLevel.PLATFORM_ADMIN) {
          // Platform admin can see all users
          const allUsers = await db.select().from(users);
          return res.json(allUsers);
        }
        
        // Account owners can see their sub-accounts
        const subAccounts = await db.select()
          .from(users)
          .where(eq(users.accountOwnerId, user.id));
        
        res.json([user, ...subAccounts]);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  );

  // Create sub-account user (account owner only)
  app.post('/api/users',
    requireAuth,
    requireRole([UserLevel.ACCOUNT_OWNER]),
    requirePermission('manage_users'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const accountOwner = req.user;
        const { firstName, lastName, email, companyName } = req.body;

        // Check seat limit
        const currentUser = await storage.getUser(accountOwner.id);
        if (!currentUser || (currentUser.usedSeats >= currentUser.maxSeats)) {
          return res.status(400).json({ 
            error: `تم الوصول إلى الحد الأقصى المسموح: ${currentUser?.maxSeats} مقاعد` 
          });
        }

        // Create sub-account user
        const newUser = await storage.createUser({
          firstName,
          lastName,
          email,
          userLevel: UserLevel.SUB_ACCOUNT,
          accountOwnerId: accountOwner.id,
          companyName: companyName || accountOwner.companyName,
          tenantId: accountOwner.tenantId,
          isActive: true,
          subscriptionStatus: 'active',
          subscriptionTier: currentUser.subscriptionTier,
        });

        // Create default permissions for the new sub-account
        await createDefaultUserPermissions(newUser.id, UserLevel.SUB_ACCOUNT);

        // Update seat count
        const { db } = await import("./db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.update(users)
          .set({ usedSeats: currentUser.usedSeats + 1 })
          .where(eq(users.id, accountOwner.id));

        res.status(201).json(newUser);
      } catch (error) {
        console.error('Error creating sub-account:', error);
        res.status(500).json({ error: 'Failed to create sub-account' });
      }
    }
  );

  // Update user permissions (account owner only)
  app.put('/api/users/:userId/permissions',
    requireAuth,
    requireRole([UserLevel.PLATFORM_ADMIN, UserLevel.ACCOUNT_OWNER]),
    requirePermission('manage_users'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { userId } = req.params;
        const user = req.user;
        
        // Validate permission updates
        const permissionUpdates = insertUserPermissionsSchema.partial().parse(req.body);

        // Account owners can only update their sub-accounts' permissions
        if (user.userLevel === UserLevel.ACCOUNT_OWNER) {
          const targetUser = await storage.getUser(userId);
          if (!targetUser || targetUser.accountOwnerId !== user.id) {
            return res.status(403).json({ error: 'لا يمكنك تعديل صلاحيات هذا المستخدم' });
          }
        }

        const updatedPermissions = await storage.updateUserPermissions(userId, permissionUpdates);
        res.json(updatedPermissions);
      } catch (error) {
        console.error('Error updating user permissions:', error);
        res.status(500).json({ error: 'Failed to update permissions' });
      }
    }
  );

  // PLATFORM ADMIN ROUTES - Cross-account visibility

  // Get all accounts (platform admin only)
  app.get('/api/admin/accounts',
    requireAuth,
    requireRole([UserLevel.PLATFORM_ADMIN]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { db } = await import("./db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        const accounts = await db.select()
          .from(users)
          .where(eq(users.userLevel, UserLevel.ACCOUNT_OWNER));
        
        res.json(accounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
      }
    }
  );

  // Get account details with sub-users (platform admin only)
  app.get('/api/admin/accounts/:accountId',
    requireAuth,
    requireRole([UserLevel.PLATFORM_ADMIN]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { accountId } = req.params;
        
        const account = await storage.getUser(accountId);
        if (!account || account.userLevel !== UserLevel.ACCOUNT_OWNER) {
          return res.status(404).json({ error: 'Account not found' });
        }

        const { db } = await import("./db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        const subAccounts = await db.select()
          .from(users)
          .where(eq(users.accountOwnerId, accountId));

        // Get account statistics
        const tenantId = account.tenantId;
        const leads = await storage.getAllLeads(tenantId);
        const properties = await storage.getAllProperties(tenantId);
        const deals = await storage.getAllDeals(tenantId);

        res.json({
          account,
          subAccounts,
          statistics: {
            totalLeads: leads.length,
            totalProperties: properties.length,
            totalDeals: deals.length,
            usedSeats: account.usedSeats,
            maxSeats: account.maxSeats
          }
        });
      } catch (error) {
        console.error('Error fetching account details:', error);
        res.status(500).json({ error: 'Failed to fetch account details' });
      }
    }
  );

  // Suspend/activate account (platform admin only)
  app.put('/api/admin/accounts/:accountId/status',
    requireAuth,
    requireRole([UserLevel.PLATFORM_ADMIN]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { accountId } = req.params;
        const { isActive } = req.body;

        const { db } = await import("./db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.update(users)
          .set({ isActive })
          .where(eq(users.id, accountId));

        // Also update all sub-accounts
        await db.update(users)
          .set({ isActive })
          .where(eq(users.accountOwnerId, accountId));

        res.json({ message: isActive ? 'Account activated' : 'Account suspended' });
      } catch (error) {
        console.error('Error updating account status:', error);
        res.status(500).json({ error: 'Failed to update account status' });
      }
    }
  );

  // User profile route (all authenticated users)
  app.get('/api/profile',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user;
        const permissions = await storage.getUserPermissions(user.id);
        
        res.json({
          user,
          permissions,
          accessLevel: {
            1: 'مدير المنصة',
            2: 'مالك الحساب',
            3: 'حساب فرعي'
          }[user.userLevel]
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
      }
    }
  );

  // TENANT-ISOLATED DATA ACCESS MIDDLEWARE
  // This middleware will be applied to all CRM data routes

  // Override existing lead routes with tenant isolation
  app.get('/api/leads', 
    requireAuth,
    requireTenantAccess,
    requirePermission('view_leads'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId;
        const leads = await storage.getAllLeads(tenantId);
        res.json(leads);
      } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
      }
    }
  );

  app.get('/api/properties',
    requireAuth,
    requireTenantAccess,
    requirePermission('view_leads'), // Using view_leads permission for properties too
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId;
        const properties = await storage.getAllProperties(tenantId);
        res.json(properties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
      }
    }
  );

  app.get('/api/deals',
    requireAuth,
    requireTenantAccess,
    requirePermission('view_leads'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId;
        const deals = await storage.getAllDeals(tenantId);
        res.json(deals);
      } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ error: 'Failed to fetch deals' });
      }
    }
  );

  app.get('/api/activities/today',
    requireAuth,
    requireTenantAccess,
    requirePermission('view_leads'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId;
        const activities = await storage.getTodaysActivities(tenantId);
        res.json(activities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
      }
    }
  );

  app.get('/api/messages',
    requireAuth,
    requireTenantAccess,
    requirePermission('view_leads'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId;
        const messages = await storage.getAllMessages(tenantId);
        res.json(messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
      }
    }
  );
}