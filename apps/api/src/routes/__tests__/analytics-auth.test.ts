import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret';

import { prisma } from '../../../prismaClient';
import { storage } from '../../../storage-prisma';
import { UserRole } from '@shared/rbac';

const createApp = async () => {
  const { default: analyticsRoutes } = await import('../analytics');
  const app = express();
  app.use(express.json());
  app.use('/api/analytics', analyticsRoutes);
  return app;
};

const withRunningServer = async (
  app: express.Express,
  run: (baseUrl: string) => Promise<void>,
) => {
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

test('analytics overview accepts a valid JWT via middleware', async (t) => {
  const app = await createApp();

  const stubUser = {
    id: 'user-123',
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    roles: JSON.stringify([UserRole.WEBSITE_ADMIN]),
    organizationId: 'org-1',
    isActive: true,
  };

  const originalFindUnique = prisma.users.findUnique;
  const originalGetAllUsers = storage.getAllUsers;
  const originalGetAllProperties = storage.getAllProperties;
  const originalGetAllLeads = storage.getAllLeads;

  prisma.users.findUnique = async () => ({ ...stubUser });
  storage.getAllUsers = async () => ([{ ...stubUser, isActive: true }]);
  storage.getAllProperties = async () => ([{ status: 'ACTIVE' }]);
  storage.getAllLeads = async () => ([{ status: 'open' }]);

  t.after(() => {
    prisma.users.findUnique = originalFindUnique;
    storage.getAllUsers = originalGetAllUsers;
    storage.getAllProperties = originalGetAllProperties;
    storage.getAllLeads = originalGetAllLeads;
  });

  const token = jwt.sign(
    {
      userId: stubUser.id,
      email: stubUser.email,
      username: stubUser.username,
      roles: stubUser.roles,
      organizationId: stubUser.organizationId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );

  await withRunningServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/overview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
    const body = await response.json();
    assert.equal(typeof body.totalUsers, 'number');
    assert.equal(body.totalUsers > 0, true);
  });
});

test('analytics overview blocks requests without a JWT', async () => {
  const app = await createApp();

  await withRunningServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/overview`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
    const body = await response.json();
    assert.match(body.message, /access token required/i);
  });
});
