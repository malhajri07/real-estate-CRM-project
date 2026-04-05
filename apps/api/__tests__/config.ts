/** Shared test configuration — avoids hardcoded URLs and credentials in test files */
export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
export const ADMIN_CREDS = {
  identifier: process.env.TEST_ADMIN_USER || "admin",
  password: process.env.TEST_ADMIN_PASS || "admin123",
};
export const AGENT_CREDS = {
  identifier: process.env.TEST_AGENT_USER || "agent1",
  password: process.env.TEST_AGENT_PASS || "agent123",
};
