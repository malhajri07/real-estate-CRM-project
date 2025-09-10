-- Buyer Request policies
-- WEBSITE_ADMIN can see all buyer requests
CREATE POLICY "website_admin_all_buyer_requests" ON buyer_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND 'WEBSITE_ADMIN' = ANY(u.roles)
    )
  );

-- Users can see their own buyer requests
CREATE POLICY "users_own_buyer_requests" ON buyer_requests
  FOR ALL
  TO authenticated
  USING (created_by_user_id = current_setting('app.current_user_id')::uuid);

-- Agents can see OPEN buyer requests with masked contact
CREATE POLICY "agents_open_buyer_requests_masked" ON buyer_requests
  FOR SELECT
  TO authenticated
  USING (
    status = 'OPEN' AND (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user_id')::uuid 
        AND ('CORP_AGENT' = ANY(u.roles) OR 'INDIV_AGENT' = ANY(u.roles))
      )
    )
  );

-- Agents can see full contact details only if they have an ACTIVE claim
CREATE POLICY "agents_claimed_buyer_requests_full" ON buyer_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.buyer_request_id = buyer_requests.id
      AND c.agent_id = current_setting('app.current_user_id')::uuid
      AND c.status = 'ACTIVE'
      AND c.expires_at > NOW()
    )
  );
