INSERT INTO "permissions" ("id", "key", "label", "description", "domain")
VALUES
  ('00000000-0000-0000-0000-000000000201', 'manage_users', 'Manage Users', 'Create, update, deactivate platform user accounts', 'rbac'),
  ('00000000-0000-0000-0000-000000000202', 'manage_organizations', 'Manage Organizations', 'Manage organization onboarding, status, and details', 'rbac'),
  ('00000000-0000-0000-0000-000000000203', 'manage_roles', 'Manage Roles', 'Create and update RBAC roles and permissions', 'rbac'),
  ('00000000-0000-0000-0000-000000000204', 'view_all_data', 'View All Data', 'View system-wide analytics and CRM records', 'analytics'),
  ('00000000-0000-0000-0000-000000000205', 'impersonate_users', 'Impersonate Users', 'Assume user identities for support and debugging', 'rbac'),
  ('00000000-0000-0000-0000-000000000206', 'manage_site_settings', 'Manage Site Settings', 'Configure global platform settings and feature flags', 'platform'),
  ('00000000-0000-0000-0000-000000000207', 'view_audit_logs', 'View Audit Logs', 'Inspect audit trails and security activity', 'security'),
  ('00000000-0000-0000-0000-000000000208', 'manage_org_profile', 'Manage Organization Profile', 'Edit organization profile, billing, and branding', 'organization'),
  ('00000000-0000-0000-0000-000000000209', 'manage_org_agents', 'Manage Organization Agents', 'Invite and manage organization agents and owners', 'organization'),
  ('00000000-0000-0000-0000-000000000210', 'view_org_data', 'View Organization Data', 'Access organization level reports and CRM data', 'organization'),
  ('00000000-0000-0000-0000-000000000211', 'search_buyer_pool', 'Search Buyer Pool', 'Search and filter buyer pool records', 'crm'),
  ('00000000-0000-0000-0000-000000000212', 'reassign_leads', 'Reassign Leads', 'Reassign buyers and leads across agents', 'crm'),
  ('00000000-0000-0000-0000-000000000213', 'view_org_reports', 'View Organization Reports', 'Access organization level analytics dashboards', 'analytics'),
  ('00000000-0000-0000-0000-000000000214', 'manage_own_properties', 'Manage Own Properties', 'Create and maintain owned property listings', 'crm'),
  ('00000000-0000-0000-0000-000000000215', 'view_org_properties', 'View Organization Properties', 'View properties listed by the organization', 'crm'),
  ('00000000-0000-0000-0000-000000000216', 'claim_buyer_requests', 'Claim Buyer Requests', 'Claim buyer requests from the marketplace', 'crm'),
  ('00000000-0000-0000-0000-000000000217', 'manage_own_leads', 'Manage Own Leads', 'Manage leads owned by the agent', 'crm'),
  ('00000000-0000-0000-0000-000000000218', 'view_org_leads', 'View Organization Leads', 'View leads assigned within the organization', 'crm'),
  ('00000000-0000-0000-0000-000000000219', 'manage_own_submissions', 'Manage Own Submissions', 'Submit and manage seller property submissions', 'crm'),
  ('00000000-0000-0000-0000-000000000220', 'view_own_leads', 'View Own Leads', 'See inbound leads for owned listings', 'crm'),
  ('00000000-0000-0000-0000-000000000221', 'manage_own_requests', 'Manage Own Requests', 'Create and manage buyer requests', 'crm'),
  ('00000000-0000-0000-0000-000000000222', 'view_own_claims', 'View Own Claims', 'See which agents claimed buyer requests', 'crm'),
  ('00000000-0000-0000-0000-000000000223', 'manage_billing', 'Manage Billing', 'Configure billing accounts, subscriptions, and invoices', 'billing'),
  ('00000000-0000-0000-0000-000000000224', 'view_analytics', 'View Analytics', 'Access analytics dashboards and exports', 'analytics'),
  ('00000000-0000-0000-0000-000000000225', 'manage_revenue_reporting', 'Manage Revenue Reporting', 'Build and schedule revenue reports', 'revenue')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "system_roles" ("id", "key", "name", "description", "scope", "isDefault", "isSystem")
VALUES
  ('00000000-0000-0000-0000-000000000301', 'WEBSITE_ADMIN', 'Website Administrator', 'Platform owner/admin with full system access', 'PLATFORM', true, true),
  ('00000000-0000-0000-0000-000000000302', 'CORP_OWNER', 'Corporate Owner', 'Corporate account owner or manager', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000303', 'CORP_AGENT', 'Corporate Agent', 'Licensed agent managed under an organization', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000304', 'INDIV_AGENT', 'Independent Agent', 'Independent licensed agent with marketplace access', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000305', 'SELLER', 'Seller', 'Individual customer selling property', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000306', 'BUYER', 'Buyer', 'Individual customer searching for property', 'ORGANIZATION', true, true)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
VALUES
  -- WEBSITE_ADMIN
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000203'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000204'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000205'),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000206'),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000207'),
  ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000223'),
  ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000224'),
  ('00000000-0000-0000-0000-00000000040a', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000225'),
  -- CORP_OWNER
  ('00000000-0000-0000-0000-00000000040b', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000208'),
  ('00000000-0000-0000-0000-00000000040c', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000209'),
  ('00000000-0000-0000-0000-00000000040d', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000210'),
  ('00000000-0000-0000-0000-00000000040e', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-00000000040f', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000212'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000213'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000223'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000224'),
  -- CORP_AGENT
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000214'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000215'),
  ('00000000-0000-0000-0000-000000000415', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-000000000416', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000216'),
  ('00000000-0000-0000-0000-000000000417', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000217'),
  ('00000000-0000-0000-0000-000000000418', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000218'),
  -- INDIV_AGENT
  ('00000000-0000-0000-0000-000000000419', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000214'),
  ('00000000-0000-0000-0000-00000000041a', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-00000000041b', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000216'),
  ('00000000-0000-0000-0000-00000000041c', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000217'),
  -- SELLER
  ('00000000-0000-0000-0000-00000000041d', '00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000219'),
  ('00000000-0000-0000-0000-00000000041e', '00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000220'),
  -- BUYER
  ('00000000-0000-0000-0000-00000000041f', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000221'),
  ('00000000-0000-0000-0000-000000000420', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000222')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

UPDATE "users"
SET "approvalStatus" = CASE
    WHEN "isActive" = TRUE THEN 'APPROVED'::"public"."UserApprovalStatus"
    ELSE "approvalStatus"
  END;
