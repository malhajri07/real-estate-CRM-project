import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';

process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session';

const { prisma } = await import('../../prismaClient');
const authModule = await import('../../auth');
const authRoutesModule = await import('../auth');

const { hashPassword } = authModule;
const authRoutes = authRoutesModule.default;
const { __authTestHooks } = authRoutesModule;

interface UserRecord {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: string;
  organizationId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserWhere = { id?: string; username?: string; email?: string };

type SelectShape<T> = { [K in keyof T]?: boolean };

type FindUniqueArgs = { where: UserWhere; select?: SelectShape<UserRecord> };

type UpdateArgs = { where: UserWhere; data: Partial<UserRecord> };

type CreateArgs = { data: Partial<UserRecord> & { username: string; passwordHash: string } };

const mockDb = {
  users: new Map<string, UserRecord>(),
  auditLogs: [] as Array<Record<string, unknown>>
};

function structuredCloneRecord<T>(value: T): T {
  return structuredClone(value);
}

function applySelect(record: UserRecord, select?: SelectShape<UserRecord>) {
  if (!select) {
    return structuredCloneRecord(record);
  }
  const result: Partial<UserRecord> = {};
  for (const key of Object.keys(select) as Array<keyof UserRecord>) {
    if (select[key]) {
      result[key] = structuredCloneRecord(record[key]);
    }
  }
  return result;
}

function findUser(where: UserWhere): UserRecord | null {
  if (where.id) {
    return mockDb.users.get(where.id) ?? null;
  }
  if (where.username) {
    for (const user of mockDb.users.values()) {
      if (user.username === where.username) {
        return user;
      }
    }
  }
  if (where.email) {
    for (const user of mockDb.users.values()) {
      if (user.email === where.email) {
        return user;
      }
    }
  }
  return null;
}

function createUserRecord(data: CreateArgs['data']): UserRecord {
  const now = new Date();
  return {
    id: data.id ?? randomUUID(),
    username: data.username,
    email: data.email ?? null,
    passwordHash: data.passwordHash,
    firstName: data.firstName ?? 'Test',
    lastName: data.lastName ?? 'User',
    phone: data.phone ?? null,
    roles: data.roles ?? JSON.stringify(['BUYER']),
    organizationId: data.organizationId ?? null,
    isActive: data.isActive ?? true,
    lastLoginAt: data.lastLoginAt ?? null,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now
  };
}

const usersDelegate = {
  async findUnique(args: FindUniqueArgs) {
    const record = findUser(args.where);
    if (!record) return null;
    return applySelect(record, args.select);
  },
  async create(args: CreateArgs) {
    const record = createUserRecord(args.data);
    mockDb.users.set(record.id, record);
    return structuredCloneRecord(record);
  },
  async update(args: UpdateArgs) {
    const record = findUser(args.where);
    if (!record) {
      throw new Error('User not found');
    }
    const updated: UserRecord = {
      ...record,
      ...args.data,
      updatedAt: args.data.updatedAt ?? new Date()
    };
    mockDb.users.set(updated.id, updated);
    return structuredCloneRecord(updated);
  },
  async findMany() {
    return Array.from(mockDb.users.values()).map((user) => structuredCloneRecord(user));
  }
};

const auditLogsDelegate = {
  async create(args: { data: Record<string, unknown> }) {
    mockDb.auditLogs.push({ ...args.data });
    return structuredCloneRecord(args.data);
  }
};

Object.defineProperty(prisma, 'users', { value: usersDelegate, configurable: true });
Object.defineProperty(prisma, 'audit_logs', { value: auditLogsDelegate, configurable: true });

function resetState() {
  mockDb.users.clear();
  mockDb.auditLogs.length = 0;
  __authTestHooks.resetLoginAttempts();
}

async function seedUser(data: CreateArgs['data']) {
  const record = await usersDelegate.create({ data });
  return record;
}

class TestClient {
  private readonly baseUrl: string;
  private cookies: string[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private updateCookiesFrom(headers: Headers) {
    const setCookieEntries = typeof (headers as any).getSetCookie === 'function'
      ? (headers as any).getSetCookie()
      : (() => {
          const header = headers.get('set-cookie');
          return header ? [header] : [];
        })();

    for (const cookie of setCookieEntries as string[]) {
      const [cookiePair] = cookie.split(';');
      const [name] = cookiePair.split('=');
      this.cookies = this.cookies.filter((existing) => !existing.startsWith(`${name}=`));
      this.cookies.push(cookiePair);
    }
  }

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookies.length) {
      headers.set('cookie', this.cookies.join('; '));
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    this.updateCookiesFrom(response.headers);

    const contentType = response.headers.get('content-type') ?? '';
    let body: any = null;
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return { status: response.status, body, headers: response.headers };
  }

  post(path: string, data: unknown, headers: Record<string, string> = {}) {
    return this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
  }

  get(path: string, headers: Record<string, string> = {}) {
    return this.request(path, { method: 'GET', headers });
  }
}

async function withTestApp(callback: (client: TestClient) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: false
    })
  );
  app.use((req, _res, next) => {
    if (!req.headers.authorization && req.session?.user) {
      (req as any).user = req.session.user;
    }
    next();
  });
  app.use('/api/auth', authRoutes);

  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine server address');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const client = new TestClient(baseUrl);

  try {
    await callback(client);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function testLoginPersistsSession() {
  resetState();
  const passwordHash = await hashPassword('secret123');
  await seedUser({
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash,
    roles: JSON.stringify(['WEBSITE_ADMIN'])
  });

  await withTestApp(async (client) => {
    const loginResponse = await client.post('/api/auth/login', {
      username: 'admin',
      password: 'secret123'
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.success, true);
    assert.equal(loginResponse.body.user.username, 'admin');
    assert.deepEqual(loginResponse.body.user.roles, ['WEBSITE_ADMIN']);
    assert.ok(loginResponse.body.token);

    const meResponse = await client.get('/api/auth/me');
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.success, true);
    assert.equal(meResponse.body.user.username, 'admin');
    assert.deepEqual(meResponse.body.user.roles, ['WEBSITE_ADMIN']);
  });
}

async function testImpersonationFlow() {
  resetState();
  const adminPassword = await hashPassword('secret123');
  const agentPassword = await hashPassword('agentpass');

  await seedUser({
    id: 'admin-1',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash: adminPassword,
    roles: JSON.stringify(['WEBSITE_ADMIN'])
  });

  const agentUser = await seedUser({
    id: 'agent-1',
    username: 'agent',
    email: 'agent@example.com',
    firstName: 'Agent',
    lastName: 'Example',
    passwordHash: agentPassword,
    roles: JSON.stringify(['INDIV_AGENT'])
  });

  await withTestApp(async (client) => {
    const loginResponse = await client.post('/api/auth/login', {
      username: 'admin',
      password: 'secret123'
    });
    assert.equal(loginResponse.status, 200);

    const impersonation = await client.post('/api/auth/impersonate', {
      targetUserId: agentUser.id
    });

    assert.equal(impersonation.status, 200);
    assert.equal(impersonation.body.success, true);
    assert.ok(typeof impersonation.body.token === 'string');

    const meAsAgent = await client.get('/api/auth/me', {
      Authorization: `Bearer ${impersonation.body.token}`
    });

    assert.equal(meAsAgent.status, 200);
    assert.equal(meAsAgent.body.success, true);
    assert.equal(meAsAgent.body.user.username, 'agent');
    assert.deepEqual(meAsAgent.body.user.roles, ['INDIV_AGENT']);
    assert.equal(mockDb.auditLogs.length, 1);
    assert.equal(mockDb.auditLogs[0]?.action, 'IMPERSONATE');
  });
}

async function testMeResolvesFromSession() {
  resetState();
  const passwordHash = await hashPassword('secret123');
  await seedUser({
    id: 'buyer-1',
    username: 'buyer',
    email: 'buyer@example.com',
    firstName: 'Buyer',
    lastName: 'Person',
    passwordHash,
    roles: JSON.stringify(['BUYER'])
  });

  await withTestApp(async (client) => {
    const loginResponse = await client.post('/api/auth/login', {
      username: 'buyer',
      password: 'secret123'
    });
    assert.equal(loginResponse.status, 200);

    const meResponse = await client.get('/api/auth/me');
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.success, true);
    assert.equal(meResponse.body.user.username, 'buyer');
    assert.deepEqual(meResponse.body.user.roles, ['BUYER']);
  });
}

async function run() {
  await testLoginPersistsSession();
  await testImpersonationFlow();
  await testMeResolvesFromSession();
  console.log('Auth route regression tests completed successfully');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
