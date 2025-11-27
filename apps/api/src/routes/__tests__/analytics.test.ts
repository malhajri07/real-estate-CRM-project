/**
 * analytics.test.ts - Analytics API Tests
 * 
 * Location: apps/api/ → Source/ → routes/ → __tests__/ → analytics.test.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Test suite for analytics API endpoints. Tests:
 * - Analytics data retrieval
 * - Authentication requirements
 * - Analytics calculations
 * 
 * Related Files:
 * - apps/api/src/routes/analytics.ts - Analytics routes
 */

// @ts-nocheck
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

import analyticsRouter from '../analytics';
import { prisma } from '../../../prismaClient';
import { storage } from '../../../storage-prisma';
import { JWT_SECRET as getJwtSecret } from '../../../config/env';

const RealDate = Date;

const dataset = {
  users: [
    {
      id: 'user-1',
      isActive: true,
      roles: JSON.stringify(['WEBSITE_ADMIN']),
      createdAt: new Date('2025-01-05T10:00:00Z'),
    },
    {
      id: 'user-2',
      isActive: true,
      roles: JSON.stringify(['INDIV_AGENT']),
      createdAt: new Date('2025-02-10T09:00:00Z'),
    },
    {
      id: 'user-3',
      isActive: false,
      roles: JSON.stringify(['INDIV_AGENT']),
      createdAt: new Date('2024-12-20T12:00:00Z'),
    },
  ],
  properties: [
    {
      id: 'property-1',
      status: 'ACTIVE',
      type: 'شقة',
      city: 'الرياض',
      price: 500000,
      createdAt: new Date('2025-02-01T00:00:00Z'),
    },
    {
      id: 'property-2',
      status: 'INACTIVE',
      type: 'فيلا',
      city: 'جدة',
      price: 1000000,
      createdAt: new Date('2025-01-15T00:00:00Z'),
    },
    {
      id: 'property-3',
      status: 'ACTIVE',
      type: 'شقة',
      city: 'الرياض',
      price: 750000,
      createdAt: new Date('2025-02-10T00:00:00Z'),
    },
  ],
  leads: [
    { id: 'lead-1', createdAt: new Date('2025-01-01T09:00:00Z') },
    { id: 'lead-2', createdAt: new Date('2025-02-05T08:00:00Z') },
    { id: 'lead-3', createdAt: new Date('2025-01-20T11:00:00Z') },
    { id: 'lead-4', createdAt: new Date('2025-02-15T10:00:00Z') },
  ],
  contactLogs: [
    {
      id: 'contact-1',
      leadId: 'lead-1',
      channel: 'WHATSAPP',
      contactedAt: new Date('2025-01-02T21:00:00Z'),
    },
    {
      id: 'contact-2',
      leadId: 'lead-2',
      channel: 'SMS',
      contactedAt: new Date('2025-02-06T08:00:00Z'),
    },
    {
      id: 'contact-3',
      leadId: 'lead-4',
      channel: 'EMAIL',
      contactedAt: new Date('2025-02-16T16:00:00Z'),
    },
  ],
  deals: [
    {
      id: 'deal-1',
      stage: 'WON',
      wonAt: new Date('2025-02-05T12:00:00Z'),
      agreedPrice: 900000,
      source: 'عمولات البيع',
    },
    {
      id: 'deal-2',
      stage: 'WON',
      wonAt: new Date('2025-01-18T12:00:00Z'),
      agreedPrice: 600000,
      source: 'عمولات الإيجار',
    },
    {
      id: 'deal-3',
      stage: 'LOST',
      wonAt: null,
      agreedPrice: 500000,
      source: 'عمولات البيع',
    },
  ],
  analyticsEvents: [
    {
      id: 'event-1',
      eventName: 'PROPERTY_VIEW',
      userId: 'user-1',
      occurredAt: new Date('2025-01-25T10:00:00Z'),
    },
    {
      id: 'event-2',
      eventName: 'PROPERTY_VIEW',
      userId: 'user-2',
      occurredAt: new Date('2025-02-06T08:00:00Z'),
    },
    {
      id: 'event-3',
      eventName: 'PROPERTY_VIEW',
      userId: 'user-1',
      occurredAt: new Date('2025-02-10T09:00:00Z'),
    },
    {
      id: 'event-4',
      eventName: 'SOCIAL_SHARE',
      userId: 'user-2',
      occurredAt: new Date('2025-02-12T09:00:00Z'),
    },
  ],
  listings: [
    { id: 'listing-1' },
    { id: 'listing-2' },
  ],
};

const matchesCondition = (value: any, condition: Record<string, any>): boolean => {
  for (const [operator, operand] of Object.entries(condition)) {
    switch (operator) {
      case 'not':
        if (operand === null) {
          if (value === null || value === undefined) {
            return false;
          }
        } else if (typeof operand === 'object') {
          if (matchesCondition(value, operand)) {
            return false;
          }
        } else if (value === operand) {
          return false;
        }
        break;
      case 'gte':
        if (!value || new Date(value) < new Date(operand)) {
          return false;
        }
        break;
      case 'gt':
        if (!value || new Date(value) <= new Date(operand)) {
          return false;
        }
        break;
      case 'lt':
        if (!value || new Date(value) >= new Date(operand)) {
          return false;
        }
        break;
      case 'lte':
        if (!value || new Date(value) > new Date(operand)) {
          return false;
        }
        break;
      case 'in':
        if (!Array.isArray(operand) || !operand.includes(value)) {
          return false;
        }
        break;
      case 'equals':
        if (value !== operand) {
          return false;
        }
        break;
      default:
        break;
    }
  }
  return true;
};

const matchesWhere = (record: Record<string, any>, where?: Record<string, any>): boolean => {
  if (!where) {
    return true;
  }

  for (const [key, condition] of Object.entries(where)) {
    if (key === 'OR' && Array.isArray(condition)) {
      if (!condition.some((clause) => matchesWhere(record, clause))) {
        return false;
      }
      continue;
    }

    if (key === 'AND' && Array.isArray(condition)) {
      if (!condition.every((clause) => matchesWhere(record, clause))) {
        return false;
      }
      continue;
    }

    const value = record[key];
    if (condition && typeof condition === 'object' && !(condition instanceof Date) && !Array.isArray(condition)) {
      if (!matchesCondition(value, condition)) {
        return false;
      }
    } else if (value !== condition) {
      return false;
    }
  }

  return true;
};

const applyWhere = <T,>(records: T[], where?: Record<string, any>): T[] => {
  if (!where) {
    return [...records];
  }
  return records.filter((record) => matchesWhere(record as Record<string, any>, where));
};

const originalPrisma = {
  usersCount: prisma.users.count,
  usersFindMany: prisma.users.findMany,
  userFindUnique: prisma.user.findUnique,
  propertiesCount: prisma.properties.count,
  leadsCount: prisma.leads.count,
  leadsFindMany: prisma.leads.findMany,
  dealsCount: prisma.deals.count,
  dealsAggregate: prisma.deals.aggregate,
  dealsGroupBy: prisma.deals.groupBy,
  analyticsFindMany: prisma.analytics_event_logs.findMany,
  analyticsCount: prisma.analytics_event_logs.count,
  contactGroupBy: prisma.contact_logs.groupBy,
  contactFindMany: prisma.contact_logs.findMany,
  listingsCount: prisma.listings.count,
};

const originalStorage = {
  getAllUsers: storage.getAllUsers,
  getAllProperties: storage.getAllProperties,
  getAllLeads: storage.getAllLeads,
  getAllDeals: storage.getAllDeals,
  getAllMessages: storage.getAllMessages,
};

const overrideDependencies = () => {
  prisma.users.count = async (args?: { where?: Record<string, any> }) => applyWhere(dataset.users, args?.where).length;
  prisma.users.findMany = async () => dataset.users.map((user) => ({ ...user }));
  prisma.user.findUnique = async (args: { where: { id?: string } }) => {
    if (!args?.where?.id) {
      return null;
    }
    const match = dataset.users.find((user) => user.id === args.where.id);
    return match ? { ...match } : null;
  };
  prisma.properties.count = async (args?: { where?: Record<string, any> }) => applyWhere(dataset.properties, args?.where).length;
  prisma.leads.count = async () => dataset.leads.length;
  prisma.leads.findMany = async (args?: { select?: Record<string, boolean> }) => {
    if (!args?.select) {
      return dataset.leads.map((lead) => ({ ...lead }));
    }
    return dataset.leads.map((lead) => {
      const selected: Record<string, any> = {};
      for (const key of Object.keys(args.select)) {
        if (args.select[key]) {
          selected[key] = (lead as Record<string, any>)[key];
        }
      }
      return selected;
    });
  };
  prisma.deals.count = async (args?: { where?: Record<string, any> }) => applyWhere(dataset.deals, args?.where).length;
  prisma.deals.aggregate = async (args: any) => {
    const filtered = applyWhere(dataset.deals, args.where);
    const sum = filtered.reduce((total, deal) => total + (deal.agreedPrice ?? 0), 0);
    const count = filtered.length;
    const avg = count ? sum / count : null;
    return {
      _sum: { agreedPrice: sum },
      _avg: { agreedPrice: avg },
      _count: { _all: count },
    };
  };
  prisma.deals.groupBy = async (args: any) => {
    const filtered = applyWhere(dataset.deals, args.where);
    const map = new Map<string, { source: string | null; _count: { _all: number } }>();
    filtered.forEach((deal) => {
      const key = deal.source ?? 'null';
      if (!map.has(key)) {
        map.set(key, { source: deal.source ?? null, _count: { _all: 0 } });
      }
      map.get(key)!._count._all += 1;
    });
    return Array.from(map.values());
  };
  prisma.analytics_event_logs.findMany = async (args: any) => {
    let filtered = applyWhere(dataset.analyticsEvents, args.where);
    if (args.distinct?.includes('userId')) {
      const seen = new Set<string>();
      filtered = filtered.filter((event) => {
        if (!event.userId) {
          return false;
        }
        if (seen.has(event.userId)) {
          return false;
        }
        seen.add(event.userId);
        return true;
      });
    }
    if (args.select) {
      return filtered.map((event) => {
        const selected: Record<string, any> = {};
        for (const key of Object.keys(args.select)) {
          if (args.select[key]) {
            selected[key] = (event as Record<string, any>)[key];
          }
        }
        return selected;
      });
    }
    return filtered.map((event) => ({ ...event }));
  };
  prisma.analytics_event_logs.count = async (args?: { where?: Record<string, any> }) =>
    applyWhere(dataset.analyticsEvents, args?.where).length;
  prisma.contact_logs.groupBy = async (args: any) => {
    const filtered = applyWhere(dataset.contactLogs, args.where);
    const map = new Map<string, any>();
    filtered.forEach((record) => {
      const key = args.by.map((field: string) => (record as Record<string, any>)[field] ?? 'null').join('::');
      if (!map.has(key)) {
        const base: Record<string, any> = {};
        args.by.forEach((field: string) => {
          base[field] = (record as Record<string, any>)[field] ?? null;
        });
        if (args._count) {
          base._count = { _all: 0 };
        }
        if (args._min) {
          base._min = {};
        }
        map.set(key, base);
      }
      const entry = map.get(key)!;
      if (entry._count) {
        entry._count._all += 1;
      }
      if (entry._min && args._min.contactedAt) {
        if (!entry._min.contactedAt || record.contactedAt < entry._min.contactedAt) {
          entry._min.contactedAt = record.contactedAt;
        }
      }
    });
    return Array.from(map.values());
  };
  prisma.contact_logs.findMany = async (args: any) => {
    let filtered = applyWhere(dataset.contactLogs, args.where);
    if (args.distinct?.includes('leadId')) {
      const seen = new Set<string>();
      filtered = filtered.filter((record) => {
        if (!record.leadId) {
          return false;
        }
        if (seen.has(record.leadId)) {
          return false;
        }
        seen.add(record.leadId);
        return true;
      });
    }
    if (args.select) {
      return filtered.map((record) => {
        const selected: Record<string, any> = {};
        for (const key of Object.keys(args.select)) {
          if (args.select[key]) {
            selected[key] = (record as Record<string, any>)[key];
          }
        }
        return selected;
      });
    }
    return filtered.map((record) => ({ ...record }));
  };
  prisma.listings.count = async () => dataset.listings.length;

  storage.getAllUsers = async () => dataset.users.map((user) => ({ ...user }));
  storage.getAllProperties = async () => dataset.properties.map((property) => ({ ...property }));
  storage.getAllLeads = async () => dataset.leads.map((lead) => ({ ...lead }));
  storage.getAllDeals = async () => dataset.deals.map((deal) => ({ ...deal }));
  storage.getAllMessages = async () => [];
};

const restoreDependencies = () => {
  prisma.users.count = originalPrisma.usersCount;
  prisma.users.findMany = originalPrisma.usersFindMany;
  prisma.user.findUnique = originalPrisma.userFindUnique;
  prisma.properties.count = originalPrisma.propertiesCount;
  prisma.leads.count = originalPrisma.leadsCount;
  prisma.leads.findMany = originalPrisma.leadsFindMany;
  prisma.deals.count = originalPrisma.dealsCount;
  prisma.deals.aggregate = originalPrisma.dealsAggregate;
  prisma.deals.groupBy = originalPrisma.dealsGroupBy;
  prisma.analytics_event_logs.findMany = originalPrisma.analyticsFindMany;
  prisma.analytics_event_logs.count = originalPrisma.analyticsCount;
  prisma.contact_logs.groupBy = originalPrisma.contactGroupBy;
  prisma.contact_logs.findMany = originalPrisma.contactFindMany;
  prisma.listings.count = originalPrisma.listingsCount;

  storage.getAllUsers = originalStorage.getAllUsers;
  storage.getAllProperties = originalStorage.getAllProperties;
  storage.getAllLeads = originalStorage.getAllLeads;
  storage.getAllDeals = originalStorage.getAllDeals;
  storage.getAllMessages = originalStorage.getAllMessages;

  globalThis.Date = RealDate;
};

const executeRequest = async (app: express.Express, token: string) => {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address !== 'object') {
    server.close();
    throw new Error('Failed to determine server address');
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/analytics/comprehensive`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

const run = async () => {
  overrideDependencies();
  const now = new Date('2025-02-20T00:00:00Z');
  globalThis.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return new RealDate(now.getTime());
      }
      return new RealDate(...(args as [any]));
    }
    static now() {
      return now.getTime();
    }
  } as unknown as DateConstructor;

  try {
    const app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRouter);

    const jwtSecret = getJwtSecret();
    const token = jwt.sign({ userId: dataset.users[0].id }, jwtSecret);

    const { status, body } = await executeRequest(app, token);

    assert.equal(status, 200);
    assert.equal(body.overview.totalUsers, 3);
    assert.equal(body.overview.activeUsers, 2);
    assert.equal(body.overview.totalProperties, 3);
    assert.equal(body.overview.totalListings, 2);
    assert.equal(body.overview.totalTransactions, 2);
    assert.equal(body.overview.totalRevenue, 1500000);
    assert.equal(body.overview.averageTransactionValue, 750000);
    assert.equal(body.overview.userGrowth, 0);
    assert.equal(body.overview.propertyGrowth, 100);
    assert.equal(body.overview.revenueGrowth, 50);

    assert.equal(body.userStats.byStatus.active, 2);
    assert.equal(body.userStats.byStatus.inactive, 1);
    assert.equal(body.userStats.newUsersThisMonth, 1);
    assert.equal(body.userStats.newUsersLastMonth, 1);
    assert.equal(body.userStats.byRole.WEBSITE_ADMIN, 1);
    assert.equal(body.userStats.byRole.INDIV_AGENT, 2);

    assert.equal(body.propertyStats.byType['شقة'], 2);
    assert.equal(body.propertyStats.byCity['الرياض'], 2);
    assert.equal(body.propertyStats.averagePrice, 750000);
    assert.equal(body.propertyStats.priceGrowth, 100);

    assert.equal(body.communicationStats.whatsappMessages, 1);
    assert.equal(body.communicationStats.smsSent, 1);
    assert.equal(body.communicationStats.emailsSent, 1);
    assert.equal(body.communicationStats.socialMediaShares, 1);
    assert(Math.abs(body.communicationStats.responseRate - 75) < 1e-6);

    assert.equal(body.revenueStats.averageTransactionValue, 750000);
    const recentMonths = body.revenueStats.monthly.slice(-2);
    assert.deepEqual(recentMonths[0], { month: '2025-01', revenue: 600000 });
    assert.deepEqual(recentMonths[1], { month: '2025-02', revenue: 900000 });
    assert.equal(body.revenueStats.bySource['عمولات البيع'], 50);
    assert.equal(body.revenueStats.bySource['عمولات الإيجار'], 50);

    console.log('Analytics comprehensive route test passed');
  } catch (error) {
    console.error('Analytics comprehensive route test failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    restoreDependencies();
  }
};

run();
