-- Lead policies
-- WEBSITE_ADMIN can see all leads
CREATE POLICY "website_admin_all_leads" ON leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'WEBSITE_ADMIN' = ANY(u.roles)
    )
  );

-- Agents can see their own leads
CREATE POLICY "agents_own_leads" ON leads
  FOR ALL
  TO authenticated
  USING (agent_id = current_setting('app.current_user_id')::uuid);

-- CORP_OWNER can see leads by agents in their organization
CREATE POLICY "corp_owner_org_leads" ON leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_OWNER' = ANY(u.roles)
      AND u.organization_id = (
        SELECT organization_id FROM users 
        WHERE id = leads.agent_id
      )
    )
  );

-- Users can see leads related to their buyer requests or seller submissions
CREATE POLICY "users_related_leads" ON leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buyer_requests br
      WHERE br.id = leads.buyer_request_id
      AND br.created_by_user_id = current_setting('app.current_user_id')::uuid
    )
    OR EXISTS (
      SELECT 1 FROM seller_submissions ss
      WHERE ss.id = leads.seller_submission_id
      AND ss.created_by_user_id = current_setting('app.current_user_id')::uuid
    )
  );
