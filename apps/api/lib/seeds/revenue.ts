/**
 * revenue.ts - Revenue Seed Data
 * 
 * Location: apps/api/ → Lib/ → seeds/ → revenue.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Revenue seed data generation. Provides:
 * - Invoice seeding
 * - Payment seeding
 * - Revenue entity data
 * 
 * Related Files:
 * - apps/api/lib/seeds/index.ts - Seed orchestrator
 */

import { createHash } from "crypto";
import { addDays, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { Prisma } from "@prisma/client";
import { SeedContext, SeedResult } from "./types";

const invoiceStatusWeights: Record<string, number> = {
  PAID: 0.55,
  OPEN: 0.25,
  PAST_DUE: 0.1,
  DRAFT: 0.1
};

const paymentTypeWeights: Record<string, number> = {
  CHARGE: 0.7,
  REFUND: 0.05,
  ADJUSTMENT: 0.1,
  PAYOUT: 0.15
};

const randomFromWeights = (weights: Record<string, number>): string => {
  const total = Object.values(weights).reduce((acc, value) => acc + value, 0);
  const threshold = Math.random() * total;
  let cursor = 0;
  for (const [key, value] of Object.entries(weights)) {
    cursor += value;
    if (threshold <= cursor) {
      return key;
    }
  }
  return Object.keys(weights)[0];
};

const deterministicId = (namespace: string, key: string) =>
  createHash("sha256").update(`${namespace}:${key}`).digest("hex").slice(0, 32);

const ensureReset = async (ctx: SeedContext) => {
  if (!ctx.reset) return;
  await ctx.prisma.$transaction([
    ctx.prisma.billing_payment_attempts.deleteMany({}),
    ctx.prisma.billing_payments.deleteMany({}),
    ctx.prisma.billing_invoice_items.deleteMany({}),
    ctx.prisma.billing_invoices.deleteMany({}),
    ctx.prisma.billing_usage_records.deleteMany({}),
    ctx.prisma.billing_subscriptions.deleteMany({}),
    ctx.prisma.billing_payment_methods.deleteMany({}),
    ctx.prisma.billing_payouts.deleteMany({}),
    ctx.prisma.billing_accounts.deleteMany({})
  ]);
};

const createPlatformAccount = async (
  ctx: SeedContext,
  org: { id: string; tradeName: string; billingEmail?: string | null; billingPhone?: string | null }
) => {
  const { faker } = ctx;
  const accountId = deterministicId("platform-account", org.id);
  return ctx.prisma.billing_accounts.upsert({
    where: { id: accountId },
    update: {
      billingEmail: org.billingEmail ?? `finance@${faker.internet.domainName()}`,
      billingPhone: org.billingPhone ?? faker.phone.number("+9661#######"),
      status: "ACTIVE"
    },
    create: {
      id: accountId,
      organizationId: org.id,
      status: "ACTIVE",
      currency: "SAR",
      billingEmail: org.billingEmail ?? `billing@${faker.internet.domainName()}`,
      billingPhone: org.billingPhone ?? faker.phone.number("+9661#######"),
      metadata: {
        type: "platform"
      }
    }
  });
};

const ensurePaymentMethod = async (ctx: SeedContext, accountId: string) => {
  const { faker } = ctx;
  const methodId = deterministicId("account-method", accountId);
  await ctx.prisma.billing_payment_methods.upsert({
    where: { id: methodId },
    update: {},
    create: {
      id: methodId,
      accountId,
      type: "CARD",
      status: "ACTIVE",
      vendor: faker.finance.creditCardIssuer(),
      reference: faker.finance.creditCardNumber(),
      maskedDetails: `**** **** **** ${faker.finance.creditCardCVV()}`,
      expiresAt: faker.date.future({ years: 2 }),
      isDefault: true,
      metadata: {
        brand: faker.finance.creditCardIssuer()
      }
    }
  });
  return methodId;
};

const createSellerAccount = async (
  ctx: SeedContext,
  orgId: string,
  customer: { id: string; email: string | null; phone: string },
  index: number
) => {
  const { faker } = ctx;
  const accountId = deterministicId("seller-account", `${orgId}:${customer.id}`);
  return ctx.prisma.billing_accounts.upsert({
    where: { id: accountId },
    update: {
      billingEmail: customer.email ?? `seller-${index}@tenant.sa`,
      billingPhone: customer.phone,
      status: "ACTIVE"
    },
    create: {
      id: accountId,
      organizationId: orgId,
      status: "ACTIVE",
      billingEmail: customer.email ?? `seller-${index}@tenant.sa`,
      billingPhone: customer.phone,
      currency: "SAR",
      metadata: {
        type: "seller",
        customerId: customer.id
      }
    }
  });
};

const pickInvoiceStatus = () => randomFromWeights(invoiceStatusWeights) as Prisma.InvoiceStatus;
const pickPaymentType = () => randomFromWeights(paymentTypeWeights);

const calculateTotals = (items: Prisma.billing_invoice_itemsCreateManyInput[]) =>
  items.reduce((acc, item) => acc.plus(item.total ?? 0), new Prisma.Decimal(0));

export const seedRevenue = async (ctx: SeedContext): Promise<SeedResult> => {
  await ensureReset(ctx);
  const { prisma, logger, faker } = ctx;


  const organizations = await prisma.organizations.findMany({
    select: {
      id: true,
      tradeName: true,
      billingEmail: true,
      billingPhone: true
    }
  });

  // Seed Pricing Plans
  const plans = [
    { id: "platform-starter", name: "Starter", price: 199, period: "monthly" },
    { id: "platform-pro", name: "Professional", price: 499, period: "monthly" },
    { id: "platform-enterprise", name: "Enterprise", price: 999, period: "monthly" }
  ];

  for (const plan of plans) {
    await prisma.pricing_plans.upsert({
      where: { id: plan.id },
      update: {},
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        description: `${plan.name} Plan`,
        currency: "SAR"
      }
    });
  }


  const summaryCounters: Record<string, number> = {
    billing_accounts: await prisma.billing_accounts.count(),
    billing_payment_methods: await prisma.billing_payment_methods.count(),
    billing_invoices: await prisma.billing_invoices.count(),
    billing_invoice_items: await prisma.billing_invoice_items.count(),
    billing_payments: await prisma.billing_payments.count(),
    billing_payment_attempts: await prisma.billing_payment_attempts.count(),
    billing_payouts: await prisma.billing_payouts.count(),
    billing_subscriptions: await prisma.billing_subscriptions.count(),
    billing_usage_records: await prisma.billing_usage_records.count()
  };

  for (const org of organizations) {
    logger(`Seeding revenue data for ${org.tradeName}...`);
    const platformAccount = await createPlatformAccount(ctx, org);
    await ensurePaymentMethod(ctx, platformAccount.id);

    const sellerCustomers = await prisma.customers.findMany({
      where: {
        organizationId: org.id,
        type: { in: ["SELLER", "BOTH"] }
      },
      select: {
        id: true,
        email: true,
        phone: true
      }
    });

    const sellerAccounts: { id: string; customerId: string }[] = [];
    let customerIndex = 0;
    for (const customer of sellerCustomers) {
      const account = await createSellerAccount(ctx, org.id, customer, customerIndex++);
      await ensurePaymentMethod(ctx, account.id);
      sellerAccounts.push({ id: account.id, customerId: customer.id });
    }

    summaryCounters.billing_accounts = await prisma.billing_accounts.count();
    summaryCounters.billing_payment_methods = await prisma.billing_payment_methods.count();

    const subscriptionId = deterministicId("subscription", org.id);
    await prisma.billing_subscriptions.upsert({
      where: { id: subscriptionId },
      update: {
        accountId: platformAccount.id,
        status: "ACTIVE",
        currentPeriodStart: startOfMonth(new Date()),
        currentPeriodEnd: endOfMonth(new Date())
      },
      create: {
        id: subscriptionId,
        accountId: platformAccount.id,
        planId: "platform-pro",
        status: "ACTIVE",
        trialEndsAt: addDays(new Date(), 14),
        startDate: subMonths(new Date(), 6),
        currentPeriodStart: startOfMonth(new Date()),
        currentPeriodEnd: endOfMonth(new Date())
      }
    });
    summaryCounters.billing_subscriptions = await prisma.billing_subscriptions.count();

    const usageRecords: Prisma.billing_usage_recordsCreateManyInput[] = [];
    for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
      const recordDate = endOfMonth(subMonths(new Date(), monthIndex));
      usageRecords.push({
        id: deterministicId("usage", `${subscriptionId}:${monthIndex}:contacts`),
        subscriptionId,
        metric: "contacts",
        quantity: new Prisma.Decimal(faker.number.int({ min: 60, max: 220 })),
        recordedAt: recordDate
      });
      usageRecords.push({
        id: deterministicId("usage", `${subscriptionId}:${monthIndex}:messages`),
        subscriptionId,
        metric: "messages",
        quantity: new Prisma.Decimal(faker.number.int({ min: 200, max: 1000 })),
        recordedAt: recordDate
      });
    }
    if (usageRecords.length) {
      await prisma.billing_usage_records.createMany({ data: usageRecords, skipDuplicates: true });
      summaryCounters.billing_usage_records += usageRecords.length;
    }

    const paymentsBuffer: Prisma.billing_paymentsCreateManyInput[] = [];
    const attemptsBuffer: Prisma.billing_payment_attemptsCreateManyInput[] = [];
    const payoutsBuffer: Prisma.billing_payoutsCreateManyInput[] = [];

    for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
      const monthDate = subMonths(new Date(), monthIndex);
      const periodStart = startOfMonth(monthDate);
      const periodEnd = endOfMonth(monthDate);
      const invoiceCount = faker.number.int({ min: 2, max: 5 });

      for (let invoiceIndex = 0; invoiceIndex < invoiceCount; invoiceIndex += 1) {
        const accountPick = Math.random() < 0.7 && sellerAccounts.length
          ? faker.helpers.arrayElement(sellerAccounts).id
          : platformAccount.id;

        const invoiceId = deterministicId("invoice", `${org.id}:${monthIndex}:${invoiceIndex}`);
        const status = pickInvoiceStatus();
        const issueDate = faker.date.between({ from: periodStart, to: periodEnd });
        const dueDate = addDays(issueDate, faker.number.int({ min: 7, max: 21 }));

        await prisma.billing_invoices.upsert({
          where: { id: invoiceId },
          update: {
            accountId: accountPick,
            status,
            issueDate,
            dueDate,
            updatedAt: new Date()
          },
          create: {
            id: invoiceId,
            accountId: accountPick,
            subscriptionId,
            number: `INV-${org.id.slice(0, 4).toUpperCase()}-${monthIndex}-${invoiceIndex}`,
            status,
            issueDate,
            dueDate,
            currency: "SAR",
            notes: Math.random() < 0.35 ? faker.lorem.sentence() : null
          }
        });

        await prisma.billing_invoice_items.deleteMany({ where: { invoiceId } });
        const itemCount = faker.number.int({ min: 1, max: 4 });
        const invoiceItems: Prisma.billing_invoice_itemsCreateManyInput[] = [];
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
          const quantity = new Prisma.Decimal(faker.number.int({ min: 1, max: 3 }));
          const unitAmount = new Prisma.Decimal(faker.number.int({ min: 900, max: 4200 }));
          invoiceItems.push({
            id: deterministicId("invoice-item", `${invoiceId}:${itemIndex}`),
            invoiceId,
            description: faker.helpers.arrayElement([
              "Listing Promotion",
              "Marketing Bundle",
              "Professional Photography",
              "Virtual Tour Package",
              "Transaction Support"
            ]),
            quantity,
            unitAmount,
            total: quantity.mul(unitAmount)
          });
        }
        await prisma.billing_invoice_items.createMany({ data: invoiceItems, skipDuplicates: true });

        const invoiceTotal = calculateTotals(invoiceItems);
        let amountPaid = new Prisma.Decimal(0);
        if (status === "PAID") {
          amountPaid = invoiceTotal;
        } else if (status === "OPEN") {
          amountPaid = invoiceTotal.mul(0.3);
        } else if (status === "PAST_DUE") {
          amountPaid = invoiceTotal.mul(0.5);
        }

        await prisma.billing_invoices.update({
          where: { id: invoiceId },
          data: {
            amountDue: invoiceTotal,
            amountPaid,
            updatedAt: new Date()
          }
        });

        if (status !== "DRAFT") {
          const paymentCount = Math.max(1, status === "PAID" ? faker.number.int({ min: 1, max: 2 }) : 1);
          const share = paymentCount > 0 ? amountPaid.div(paymentCount) : new Prisma.Decimal(0);

          const methodId = await ensurePaymentMethod(ctx, accountPick);
          for (let paymentIndex = 0; paymentIndex < paymentCount; paymentIndex += 1) {
            const paymentId = deterministicId("payment", `${invoiceId}:${paymentIndex}`);
            const type = pickPaymentType();
            const paymentStatus = type === "PAYOUT" ? "COMPLETED" : status === "PAID" ? "COMPLETED" : "PROCESSING";
            const processedAt = faker.date.between({ from: issueDate, to: dueDate });

            paymentsBuffer.push({
              id: paymentId,
              invoiceId,
              accountId: accountPick,
              methodId,
              status: paymentStatus as Prisma.PaymentStatus,
              amount: type === "REFUND" ? share.neg() : share,
              currency: "SAR",
              transactionReference: faker.string.alphanumeric(12).toUpperCase(),
              gateway: faker.helpers.arrayElement(["Mada", "STC-Pay", "Stripe", "Tap"]),
              processedAt,
              metadata: {
                type,
                description: `${type} processed for invoice ${invoiceId}`
              }
            });

            attemptsBuffer.push({
              id: deterministicId("attempt", paymentId),
              paymentId,
              methodId,
              status: paymentStatus as Prisma.PaymentStatus,
              amount: share,
              processedAt,
              failureReason: paymentStatus === "FAILED" ? "Gateway declined" : null
            });
          }
        }
      }

      const payoutCount = faker.number.int({ min: 1, max: 3 });
      for (let payoutIndex = 0; payoutIndex < payoutCount; payoutIndex += 1) {
        const payoutId = deterministicId("payout", `${org.id}:${monthIndex}:${payoutIndex}`);
        payoutsBuffer.push({
          id: payoutId,
          organizationId: org.id,
          accountId: platformAccount.id,
          amount: new Prisma.Decimal(faker.number.int({ min: 20_000, max: 90_000 })),
          currency: "SAR",
          status: "COMPLETED",
          reference: faker.string.alphanumeric(12).toUpperCase(),
          beneficiary: `${org.tradeName} Corporate`,
          processedAt: faker.date.between({ from: periodStart, to: periodEnd }),
          periodStart,
          periodEnd,
          metadata: {
            type: "monthly_payout"
          },
          createdAt: new Date()
        });
      }
    }

    if (paymentsBuffer.length) {
      await prisma.billing_payments.createMany({ data: paymentsBuffer, skipDuplicates: true });
      summaryCounters.billing_payments += paymentsBuffer.length;
    }

    if (attemptsBuffer.length) {
      await prisma.billing_payment_attempts.createMany({ data: attemptsBuffer, skipDuplicates: true });
      summaryCounters.billing_payment_attempts += attemptsBuffer.length;
    }

    if (payoutsBuffer.length) {
      await prisma.billing_payouts.createMany({ data: payoutsBuffer, skipDuplicates: true });
      summaryCounters.billing_payouts += payoutsBuffer.length;
    }
  }

  summaryCounters.billing_accounts = await prisma.billing_accounts.count();
  summaryCounters.billing_payment_methods = await prisma.billing_payment_methods.count();
  summaryCounters.billing_invoices = await prisma.billing_invoices.count();
  summaryCounters.billing_invoice_items = await prisma.billing_invoice_items.count();
  summaryCounters.billing_payments = await prisma.billing_payments.count();
  summaryCounters.billing_payment_attempts = await prisma.billing_payment_attempts.count();
  summaryCounters.billing_payouts = await prisma.billing_payouts.count();
  summaryCounters.billing_subscriptions = await prisma.billing_subscriptions.count();
  summaryCounters.billing_usage_records = await prisma.billing_usage_records.count();

  const summary = Object.entries(summaryCounters).map(([model, count]) => ({ model, count }));
  return { summary };
};

export default seedRevenue;
