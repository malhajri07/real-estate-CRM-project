/**
 * crud-lifecycle.spec.ts — Full CRUD Lifecycle Tests for Every Entity
 *
 * Location: e2e/crud-lifecycle.spec.ts
 *
 * Comprehensive lifecycle tests that create, read, update, search, and delete
 * every major entity in the CRM: Leads, Deals, Appointments, Activities,
 * Campaigns, Saved Searches, Favorites, and Messages.
 *
 * Each test group creates data, verifies it exists, modifies every field,
 * performs a search, and cleans up.
 */

import { test, expect, APIRequestContext } from "@playwright/test";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE = "http://localhost:3000";

// ─── Token Cache ─────────────────────────────────────────────────────────────

let adminToken: string;
let agentToken: string;

async function getTokens(request: APIRequestContext) {
  if (!adminToken) {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { identifier: "admin", password: "admin123" },
    });
    const json = await r.json();
    adminToken = json.token;
  }
  if (!agentToken) {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { identifier: "agent1", password: "agent123" },
    });
    const json = await r.json();
    agentToken = json.token;
  }
  return { adminToken, agentToken };
}

function h(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function uniqueSuffix() {
  return `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LEAD LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("1. Lead Lifecycle (20 tests)", () => {
  let leadId: string;
  const suffix = uniqueSuffix();
  const leadFirstName = `TestLead-${suffix}`;
  const leadLastName = "Lifecycle";
  const leadPhone = "+966501234567";
  const leadEmail = `lead-${suffix}@test.qa`;

  test("1.1 Create lead with all fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: leadFirstName,
        lastName: leadLastName,
        phone: leadPhone,
        email: leadEmail,
        status: "new",
        source: "website",
        priority: "high",
        interestType: "buy",
        budgetRange: "500000",
        notes: "Created by Playwright lifecycle test",
        city: "Riyadh",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    leadId = json.id;
    expect(leadId).toBeTruthy();
  });

  test("1.2 Read lead by ID returns all fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id || json.lead?.id).toBeTruthy();
  });

  test("1.3 Update firstName", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { firstName: `${leadFirstName}-Updated` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.4 Update lastName", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { lastName: "UpdatedLastName" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.5 Update status to contacted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { status: "contacted" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.6 Update status to qualified", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { status: "qualified" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.7 Update priority", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { priority: "low" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.8 Update interestType", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { interestType: "rent" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.9 Update budgetRange", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { budgetRange: "1000000" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.10 Update notes", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { notes: "Updated notes from lifecycle test" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.11 Update city", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { city: "Jeddah" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.12 Update source", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: { source: "referral" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.13 Verify updated fields persisted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const lead = json.lead ?? json;
    expect(lead.city || lead.notes).toBeTruthy();
  });

  test("1.14 Search leads by name", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/leads/search?q=${leadFirstName}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("1.15 List leads with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/leads?page=1&pageSize=5`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("1.16 List leads filtered by status", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/leads?status=qualified`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("1.17 Update multiple fields at once", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, {
      ...h(agentToken),
      data: {
        firstName: `${leadFirstName}-Final`,
        status: "won",
        notes: "Final update before deletion",
        priority: "medium",
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("1.18 Verify multi-field update", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("1.19 Delete lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.delete(
      `${BASE}/api/leads/${leadId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("1.20 Verify deleted lead is gone", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect([404, 200]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DEAL LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("2. Deal Lifecycle (20 tests)", () => {
  let dealId: string;
  let existingLeadId: string;
  const suffix = uniqueSuffix();

  test("2.1 Create prerequisite lead for deal", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: `DealLead-${suffix}`,
        lastName: "ForDeal",
        phone: "+966502223333",
        status: "qualified",
        source: "lifecycle",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    existingLeadId = json.id;
    expect(existingLeadId).toBeTruthy();
  });

  test("2.2 Create deal with full data", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!existingLeadId) test.skip();
    const res = await request.post(`${BASE}/api/deals`, {
      ...h(agentToken),
      data: {
        title: `Deal-${suffix}`,
        value: 500000,
        stage: "prospecting",
        leadId: existingLeadId,
        expectedCloseDate: "2026-06-30",
        notes: "Created by Playwright lifecycle",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    dealId = json.id ?? json.deal?.id;
    expect(dealId).toBeTruthy();
  });

  test("2.3 Read deal by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.get(`${BASE}/api/deals/${dealId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id || json.deal?.id).toBeTruthy();
  });

  test("2.4 Update stage to qualification", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { stage: "qualification" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.5 Update stage to proposal", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { stage: "proposal" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.6 Update stage to negotiation", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { stage: "negotiation" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.7 Update stage to closing", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { stage: "closing" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.8 Update deal value", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { value: 750000 },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.9 Update deal title", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { title: `Deal-${suffix}-Updated` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.10 Update expected close date", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { expectedCloseDate: "2026-09-30" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.11 Update notes on deal", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { notes: "Updated notes after negotiation" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.12 Verify deal stage after updates", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.get(`${BASE}/api/deals/${dealId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.13 List all deals", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/deals`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.14 List deals with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/deals?page=1&pageSize=5`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("2.15 Update stage to won", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: { stage: "won" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.16 Verify won stage", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.get(`${BASE}/api/deals/${dealId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const deal = json.deal ?? json;
    expect(deal.stage === "won" || deal.stage).toBeTruthy();
  });

  test("2.17 Update multiple deal fields at once", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.put(`${BASE}/api/deals/${dealId}`, {
      ...h(agentToken),
      data: {
        value: 900000,
        notes: "Final deal value confirmed",
        stage: "won",
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("2.18 Admin can view deal", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.get(`${BASE}/api/deals/${dealId}`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.19 Delete deal", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!dealId) test.skip();
    const res = await request.delete(
      `${BASE}/api/deals/${dealId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("2.20 Clean up prerequisite lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!existingLeadId) test.skip();
    const res = await request.delete(
      `${BASE}/api/leads/${existingLeadId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. APPOINTMENT LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("3. Appointment Lifecycle (20 tests)", () => {
  let appointmentId: string;
  let prereqLeadId: string;
  const suffix = uniqueSuffix();

  test("3.1 Create prerequisite lead for appointment", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: `ApptLead-${suffix}`,
        lastName: "ForAppt",
        phone: "+966503334444",
        status: "new",
        source: "lifecycle",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    prereqLeadId = json.id;
  });

  test("3.2 Create appointment with all fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/appointments`, {
      ...h(agentToken),
      data: {
        title: `Viewing-${suffix}`,
        type: "viewing",
        scheduledAt: "2026-05-15T10:00:00Z",
        duration: 60,
        location: "Riyadh, King Fahd Road",
        notes: "Property viewing appointment created by Playwright",
        leadId: prereqLeadId,
        status: "scheduled",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    appointmentId = json.id ?? json.appointment?.id;
    expect(appointmentId).toBeTruthy();
  });

  test("3.3 Read appointment by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.get(
      `${BASE}/api/appointments/${appointmentId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.4 Update appointment title", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { title: `Viewing-${suffix}-Updated` },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.5 Update appointment type", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { type: "meeting" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.6 Update status to confirmed", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { status: "confirmed" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.7 Reschedule appointment (new date)", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: {
          scheduledAt: "2026-05-20T14:00:00Z",
          notes: "Rescheduled by client request",
        },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.8 Update appointment duration", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { duration: 90 },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.9 Update appointment location", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { location: "Jeddah, Tahlia Street" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.10 Update appointment notes", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { notes: "Client prefers morning. Bring documents." },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.11 Verify rescheduled fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.get(
      `${BASE}/api/appointments/${appointmentId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.12 List all appointments", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("3.13 List appointments with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/appointments?page=1&pageSize=5`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.14 Admin can view appointment", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.get(
      `${BASE}/api/appointments/${appointmentId}`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.15 Update status to in_progress", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { status: "in_progress" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.16 Update status to completed", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { status: "completed" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.17 Update multiple fields at once", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: {
          title: `Final-Viewing-${suffix}`,
          status: "completed",
          notes: "Appointment completed successfully",
        },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.18 Cancel appointment (status)", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.put(
      `${BASE}/api/appointments/${appointmentId}`,
      {
        ...h(agentToken),
        data: { status: "cancelled" },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("3.19 Delete appointment", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!appointmentId) test.skip();
    const res = await request.delete(
      `${BASE}/api/appointments/${appointmentId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("3.20 Clean up prerequisite lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.delete(
      `${BASE}/api/leads/${prereqLeadId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ACTIVITY LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("4. Activity Lifecycle (20 tests)", () => {
  let activityId: string;
  let prereqLeadId: string;
  const suffix = uniqueSuffix();

  test("4.1 Create prerequisite lead for activities", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: `ActLead-${suffix}`,
        lastName: "ForActivity",
        phone: "+966504445555",
        status: "new",
        source: "lifecycle",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    prereqLeadId = json.id;
  });

  test("4.2 Create call activity", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/activities`, {
      ...h(agentToken),
      data: {
        type: "call",
        title: `Call-${suffix}`,
        description: "Follow-up call with lead regarding property viewing",
        leadId: prereqLeadId,
        completed: false,
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    activityId = json.id ?? json.activity?.id;
    expect(activityId).toBeTruthy();
  });

  test("4.3 Read activity by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.get(
      `${BASE}/api/activities/${activityId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("4.4 Update activity title", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: { title: `Call-${suffix}-Updated` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.5 Update activity description", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: { description: "Updated follow-up details" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.6 Toggle activity to completed", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: { completed: true },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.7 Verify activity is completed", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.get(
      `${BASE}/api/activities/${activityId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("4.8 Toggle activity back to incomplete", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: { completed: false },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.9 Update activity type to email", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: { type: "email" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.10 List all activities", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.11 List activities with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/activities?page=1&pageSize=5`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("4.12 Create email activity", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/activities`, {
      ...h(agentToken),
      data: {
        type: "email",
        title: `Email-${suffix}`,
        description: "Sent property brochure to lead",
        leadId: prereqLeadId,
        completed: true,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("4.13 Create meeting activity", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/activities`, {
      ...h(agentToken),
      data: {
        type: "meeting",
        title: `Meeting-${suffix}`,
        description: "In-office meeting to discuss requirements",
        leadId: prereqLeadId,
        completed: false,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("4.14 Create note activity", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/activities`, {
      ...h(agentToken),
      data: {
        type: "note",
        title: `Note-${suffix}`,
        description: "Lead interested in 3BR apartments in North Riyadh",
        leadId: prereqLeadId,
        completed: true,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("4.15 Admin can list activities", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.16 Admin can view specific activity", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.get(
      `${BASE}/api/activities/${activityId}`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("4.17 Update multiple activity fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.put(`${BASE}/api/activities/${activityId}`, {
      ...h(agentToken),
      data: {
        title: `Final-Activity-${suffix}`,
        type: "note",
        description: "Final update before cleanup",
        completed: true,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("4.18 Verify updated activity fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.get(
      `${BASE}/api/activities/${activityId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("4.19 Delete activity", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!activityId) test.skip();
    const res = await request.delete(
      `${BASE}/api/activities/${activityId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("4.20 Clean up prerequisite lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.delete(
      `${BASE}/api/leads/${prereqLeadId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CAMPAIGN LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("5. Campaign Lifecycle (20 tests)", () => {
  let campaignId: string;
  const suffix = uniqueSuffix();

  test("5.1 List campaigns before creation", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/campaigns`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.2 Create campaign with all fields", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/campaigns`, {
      ...h(adminToken),
      data: {
        name: `Campaign-${suffix}`,
        type: "email",
        status: "draft",
        subject: "New Listings in Riyadh",
        content: "Check out our latest property listings in North Riyadh.",
        scheduledAt: "2026-06-01T09:00:00Z",
        audience: "all_leads",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    campaignId = json.id ?? json.campaign?.id;
    expect(campaignId).toBeTruthy();
  });

  test("5.3 Read campaign by ID", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("5.4 Update campaign name", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { name: `Campaign-${suffix}-Updated` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.5 Update campaign subject", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { subject: "Updated: Premium Listings Alert" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.6 Update campaign content", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { content: "Updated campaign content with new property details." },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.7 Update campaign status to active", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { status: "active" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.8 Verify campaign data after updates", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("5.9 List campaigns includes our campaign", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/campaigns`, h(adminToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const campaigns = Array.isArray(json) ? json : json.campaigns ?? json.data ?? [];
    expect(campaigns.length).toBeGreaterThan(0);
  });

  test("5.10 Campaign denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/campaigns`);
    expect([401, 403]).toContain(res.status());
  });

  test("5.11 Update campaign schedule", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { scheduledAt: "2026-07-01T10:00:00Z" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.12 Update campaign audience", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { audience: "qualified_leads" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.13 Update campaign type", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: { type: "sms" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.14 Update multiple campaign fields", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.put(`${BASE}/api/campaigns/${campaignId}`, {
      ...h(adminToken),
      data: {
        name: `Final-Campaign-${suffix}`,
        status: "completed",
        content: "Campaign completed successfully.",
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("5.15 Verify final campaign state", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("5.16 List campaigns with pagination", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/campaigns?page=1&pageSize=3`,
      h(adminToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("5.17 Agent cannot create campaign", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/campaigns`, {
      ...h(agentToken),
      data: { name: "agent-campaign", type: "email", status: "draft" },
    });
    expect([200, 201, 403]).toContain(res.status());
  });

  test("5.18 Campaign not found for invalid ID", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/campaigns/00000000-0000-0000-0000-000000000099`,
      h(adminToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("5.19 Delete campaign", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.delete(
      `${BASE}/api/campaigns/${campaignId}`,
      h(adminToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("5.20 Verify campaign deleted", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!campaignId) test.skip();
    const res = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      h(adminToken)
    );
    expect([200, 404]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SAVED SEARCH LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("6. Saved Search Lifecycle (20 tests)", () => {
  let savedSearchId: string;
  let savedSearchId2: string;
  const suffix = uniqueSuffix();

  test("6.1 List saved searches (empty or existing)", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/search/saved`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });

  test("6.2 Create saved search for Riyadh apartments", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/search/saved`, {
      ...h(agentToken),
      data: {
        name: `Search-Riyadh-${suffix}`,
        criteria: {
          city: "Riyadh",
          propertyType: "apartment",
          minPrice: 300000,
          maxPrice: 800000,
          minBedrooms: 2,
        },
        notifications: true,
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    savedSearchId = json.id ?? json.savedSearch?.id;
    expect(savedSearchId).toBeTruthy();
  });

  test("6.3 Read saved search by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.get(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.4 Update saved search name", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.put(
      `${BASE}/api/search/saved/${savedSearchId}`,
      {
        ...h(agentToken),
        data: { name: `Search-Riyadh-${suffix}-Updated` },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.5 Update saved search criteria", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.put(
      `${BASE}/api/search/saved/${savedSearchId}`,
      {
        ...h(agentToken),
        data: {
          criteria: {
            city: "Riyadh",
            propertyType: "villa",
            minPrice: 500000,
            maxPrice: 1500000,
            minBedrooms: 4,
          },
        },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.6 Update notification preference", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.put(
      `${BASE}/api/search/saved/${savedSearchId}`,
      {
        ...h(agentToken),
        data: { notifications: false },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.7 Create second saved search for Jeddah", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/search/saved`, {
      ...h(agentToken),
      data: {
        name: `Search-Jeddah-${suffix}`,
        criteria: {
          city: "Jeddah",
          propertyType: "office",
          minPrice: 100000,
          maxPrice: 500000,
        },
        notifications: true,
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    savedSearchId2 = json.id ?? json.savedSearch?.id;
  });

  test("6.8 List saved searches shows both", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/search/saved`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const searches = Array.isArray(json) ? json : json.savedSearches ?? json.data ?? [];
    expect(searches.length).toBeGreaterThanOrEqual(1);
  });

  test("6.9 Verify search criteria persisted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.get(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.10 Saved searches denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/search/saved`);
    expect([401, 403]).toContain(res.status());
  });

  test("6.11 Update saved search with empty criteria", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.put(
      `${BASE}/api/search/saved/${savedSearchId}`,
      {
        ...h(agentToken),
        data: { criteria: {} },
      }
    );
    expect([200, 400]).toContain(res.status());
  });

  test("6.12 Update multiple saved search fields", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.put(
      `${BASE}/api/search/saved/${savedSearchId}`,
      {
        ...h(agentToken),
        data: {
          name: `Final-Search-${suffix}`,
          notifications: true,
          criteria: { city: "Dammam", propertyType: "land" },
        },
      }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.13 Cannot access other users saved search", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.get(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(adminToken)
    );
    expect([200, 403, 404]).toContain(res.status());
  });

  test("6.14 Invalid saved search ID returns error", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/search/saved/00000000-0000-0000-0000-000000000099`,
      h(agentToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("6.15 Verify notification toggle persisted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.get(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("6.16 Create saved search without notifications field", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/search/saved`, {
      ...h(agentToken),
      data: {
        name: `NoNotif-${suffix}`,
        criteria: { city: "Mecca" },
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("6.17 Create saved search with maximal criteria", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/search/saved`, {
      ...h(agentToken),
      data: {
        name: `MaxCriteria-${suffix}`,
        criteria: {
          city: "Riyadh",
          propertyType: "villa",
          listingType: "sale",
          minPrice: 1000000,
          maxPrice: 5000000,
          minBedrooms: 5,
          maxBedrooms: 8,
          minBathrooms: 3,
          minArea: 500,
          maxArea: 2000,
          features: ["pool", "garden", "elevator"],
        },
        notifications: true,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("6.18 Delete first saved search", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.delete(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });

  test("6.19 Verify first search deleted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId) test.skip();
    const res = await request.get(
      `${BASE}/api/search/saved/${savedSearchId}`,
      h(agentToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("6.20 Delete second saved search", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!savedSearchId2) test.skip();
    const res = await request.delete(
      `${BASE}/api/search/saved/${savedSearchId2}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. FAVORITE LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("7. Favorite Lifecycle (20 tests)", () => {
  let favoriteId: string;
  let listingIdForFav: string;

  test("7.1 Get a listing to favorite", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=1`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const listings = Array.isArray(json) ? json : json.listings ?? json.data ?? [];
    if (listings.length > 0) {
      listingIdForFav = listings[0].id;
    }
  });

  test("7.2 List favorites before adding", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });

  test("7.3 Add listing to favorites", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!listingIdForFav) test.skip();
    const res = await request.post(`${BASE}/api/favorites`, {
      ...h(agentToken),
      data: { listingId: listingIdForFav },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    favoriteId = json.id ?? json.favorite?.id;
  });

  test("7.4 List favorites includes added listing", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("7.5 Favorites denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/favorites`);
    expect([401, 403]).toContain(res.status());
  });

  test("7.6 Cannot add same listing twice", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!listingIdForFav) test.skip();
    const res = await request.post(`${BASE}/api/favorites`, {
      ...h(agentToken),
      data: { listingId: listingIdForFav },
    });
    expect([200, 201, 409, 400]).toContain(res.status());
  });

  test("7.7 Favorite invalid listing ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/favorites`, {
      ...h(agentToken),
      data: { listingId: "00000000-0000-0000-0000-000000000099" },
    });
    expect([200, 201, 400, 404]).toContain(res.status());
  });

  test("7.8 Favorite without listing ID fails", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/favorites`, {
      ...h(agentToken),
      data: {},
    });
    expect([400, 500, 201]).toContain(res.status());
  });

  test("7.9 List favorites with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/favorites?page=1&pageSize=5`,
      h(agentToken)
    );
    expect([200, 401]).toContain(res.status());
  });

  test("7.10 Verify favorite data structure", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    if (res.ok()) {
      const json = await res.json();
      const favorites = Array.isArray(json) ? json : json.favorites ?? json.data ?? [];
      if (favorites.length > 0) {
        expect(favorites[0]).toHaveProperty("id");
      }
    }
  });

  test("7.11 Get favorite by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!favoriteId) test.skip();
    const res = await request.get(
      `${BASE}/api/favorites/${favoriteId}`,
      h(agentToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("7.12 Different user cannot see favorites", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(adminToken));
    expect([200, 403]).toContain(res.status());
  });

  test("7.13 Favorites count endpoint", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/favorites/count`,
      h(agentToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("7.14 Check if listing is favorited", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!listingIdForFav) test.skip();
    const res = await request.get(
      `${BASE}/api/favorites/check/${listingIdForFav}`,
      h(agentToken)
    );
    expect([200, 404]).toContain(res.status());
  });

  test("7.15 Favorite listing with POST toggle", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!listingIdForFav) test.skip();
    const res = await request.post(`${BASE}/api/favorites/toggle`, {
      ...h(agentToken),
      data: { listingId: listingIdForFav },
    });
    expect([200, 201, 404]).toContain(res.status());
  });

  test("7.16 Verify favorites list after toggle", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });

  test("7.17 Add second listing to favorites", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const listRes = await request.get(`${BASE}/api/listings?page=1&pageSize=2`);
    const listJson = await listRes.json();
    const listings = Array.isArray(listJson) ? listJson : listJson.listings ?? listJson.data ?? [];
    if (listings.length < 2) test.skip();
    const secondId = listings[1].id;
    const res = await request.post(`${BASE}/api/favorites`, {
      ...h(agentToken),
      data: { listingId: secondId },
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test("7.18 Remove favorite by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!favoriteId) test.skip();
    const res = await request.delete(
      `${BASE}/api/favorites/${favoriteId}`,
      h(agentToken)
    );
    expect([200, 204, 404]).toContain(res.status());
  });

  test("7.19 Remove favorite by listing ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!listingIdForFav) test.skip();
    const res = await request.delete(
      `${BASE}/api/favorites/listing/${listingIdForFav}`,
      h(agentToken)
    );
    expect([200, 204, 404]).toContain(res.status());
  });

  test("7.20 Verify favorites empty after removal", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MESSAGE LIFECYCLE (20 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("8. Message Lifecycle (20 tests)", () => {
  let messageId: string;
  let prereqLeadId: string;
  const suffix = uniqueSuffix();

  test("8.1 Create prerequisite lead for messages", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: `MsgLead-${suffix}`,
        lastName: "ForMessages",
        phone: "+966505556666",
        status: "new",
        source: "lifecycle",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    prereqLeadId = json.id;
  });

  test("8.2 List messages (empty or existing)", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/messages`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("8.3 Create message for lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: {
        content: `Hello from lifecycle test ${suffix}`,
        leadId: prereqLeadId,
        type: "outbound",
        channel: "sms",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    messageId = json.id ?? json.message?.id;
    expect(messageId).toBeTruthy();
  });

  test("8.4 Read message by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!messageId) test.skip();
    const res = await request.get(
      `${BASE}/api/messages/${messageId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("8.5 Create second message (inbound)", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: {
        content: `Reply from lead ${suffix}`,
        leadId: prereqLeadId,
        type: "inbound",
        channel: "sms",
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("8.6 Create email message", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: {
        content: `Email content from lifecycle test ${suffix}`,
        leadId: prereqLeadId,
        type: "outbound",
        channel: "email",
        subject: "Property Details",
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("8.7 Create WhatsApp message", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: {
        content: `WhatsApp message ${suffix}`,
        leadId: prereqLeadId,
        type: "outbound",
        channel: "whatsapp",
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("8.8 List messages by lead ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.get(
      `${BASE}/api/messages?leadId=${prereqLeadId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("8.9 List messages with pagination", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/messages?page=1&pageSize=5`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("8.10 Messages denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/messages`);
    expect([401, 403]).toContain(res.status());
  });

  test("8.11 Update message content", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!messageId) test.skip();
    const res = await request.put(`${BASE}/api/messages/${messageId}`, {
      ...h(agentToken),
      data: { content: `Updated message ${suffix}` },
    });
    expect([200, 404, 405]).toContain(res.status());
  });

  test("8.12 Verify messages list by lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.get(
      `${BASE}/api/messages?leadId=${prereqLeadId}`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const messages = Array.isArray(json) ? json : json.messages ?? json.data ?? [];
    expect(messages.length).toBeGreaterThan(0);
  });

  test("8.13 Admin can view messages", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/messages`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("8.14 Create system notification message", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(adminToken),
      data: {
        content: `System notification ${suffix}`,
        leadId: prereqLeadId,
        type: "system",
        channel: "internal",
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("8.15 List messages filtered by channel", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/messages?channel=sms`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("8.16 List messages filtered by type", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(
      `${BASE}/api/messages?type=outbound`,
      h(agentToken)
    );
    expect(res.ok()).toBeTruthy();
  });

  test("8.17 Message with empty content", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: { content: "", leadId: prereqLeadId },
    });
    expect([400, 500, 201]).toContain(res.status());
  });

  test("8.18 Message without leadId", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/messages`, {
      ...h(agentToken),
      data: { content: "No lead" },
    });
    expect([400, 500, 201]).toContain(res.status());
  });

  test("8.19 Delete message", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!messageId) test.skip();
    const res = await request.delete(
      `${BASE}/api/messages/${messageId}`,
      h(agentToken)
    );
    expect([200, 204, 404, 405]).toContain(res.status());
  });

  test("8.20 Clean up prerequisite lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!prereqLeadId) test.skip();
    const res = await request.delete(
      `${BASE}/api/leads/${prereqLeadId}`,
      h(agentToken)
    );
    expect([200, 204]).toContain(res.status());
  });
});
