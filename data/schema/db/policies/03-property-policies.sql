-- Property policies
-- WEBSITE_ADMIN can see all properties
CREATE POLICY "website_admin_all_properties" ON properties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'WEBSITE_ADMIN' = ANY(u.roles)
    )
  );

-- Agents can see their own properties
CREATE POLICY "agents_own_properties" ON properties
  FOR ALL
  TO authenticated
  USING (agent_id = current_setting('app.current_user_id')::uuid);

-- CORP_OWNER can see all properties in their organization
CREATE POLICY "corp_owner_org_properties" ON properties
  FOR ALL
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_OWNER' = ANY(roles)
    )
  );

-- CORP_AGENT can see properties in their organization (read-only for others)
CREATE POLICY "corp_agent_org_properties_read" ON properties
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_AGENT' = ANY(roles)
    )
  );

-- Public can see active properties (for search)
CREATE POLICY "public_active_properties" ON properties
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE' AND visibility = 'public');
