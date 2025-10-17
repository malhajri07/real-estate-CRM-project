-- Claim policies
-- WEBSITE_ADMIN can see all claims
CREATE POLICY "website_admin_all_claims" ON claims
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'WEBSITE_ADMIN' = ANY(u.roles)
    )
  );

-- Agents can see their own claims
CREATE POLICY "agents_own_claims" ON claims
  FOR ALL
  TO authenticated
  USING (agent_id = current_setting('app.current_user_id')::uuid);

-- CORP_OWNER can see claims by agents in their organization
CREATE POLICY "corp_owner_org_claims" ON claims
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'CORP_OWNER' = ANY(u.roles)
      AND u.organization_id = (
        SELECT organization_id FROM users 
        WHERE id = claims.agent_id
      )
    )
  );

-- Buyers can see claims on their requests (limited info)
CREATE POLICY "buyers_own_request_claims" ON claims
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buyer_requests br
      WHERE br.id = claims.buyer_request_id
      AND br.created_by_user_id = current_setting('app.current_user_id')::uuid
    )
  );
