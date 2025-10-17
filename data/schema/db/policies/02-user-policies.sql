-- User policies
-- WEBSITE_ADMIN can see all users
CREATE POLICY "website_admin_all_users" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'WEBSITE_ADMIN' = ANY(u.roles)
    )
  );

-- Users can see their own profile
CREATE POLICY "users_own_profile" ON users
  FOR ALL
  TO authenticated
  USING (id = current_setting('app.current_user_id')::uuid);

-- CORP_OWNER can see users in their organization
CREATE POLICY "corp_owner_org_users" ON users
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_OWNER' = ANY(roles)
    )
  );

-- CORP_AGENT can see users in their organization (read-only)
CREATE POLICY "corp_agent_org_users" ON users
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_AGENT' = ANY(roles)
    )
  );
