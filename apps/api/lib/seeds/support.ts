
import { Prisma, SupportTicketStatus, SupportTicketPriority } from "@prisma/client";
import { SeedContext, SeedResult } from "./types";

const TICKET_CATEGORIES = ['BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'ACCOUNT_ACCESS', 'OTHER'];
const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const seedSupport = async (ctx: SeedContext): Promise<SeedResult> => {
    const { prisma, logger, faker } = ctx;

    if (ctx.reset) {
        await prisma.support_tickets.deleteMany();
    }

    // Only pick users belonging to an organization
    const users = await prisma.users.findMany({
        where: { organizationId: { not: null } },
        select: { id: true, organizationId: true }
    });

    if (users.length === 0) {
        logger("No users found to assign support tickets to.");
        return { summary: [] };
    }

    logger("Seeding support tickets...");
    const tickets: Prisma.support_ticketsCreateManyInput[] = [];

    for (let i = 0; i < 30; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const category = TICKET_CATEGORIES[Math.floor(Math.random() * TICKET_CATEGORIES.length)];
        const priority = TICKET_PRIORITIES[Math.floor(Math.random() * TICKET_PRIORITIES.length)];
        const ticketStatus = TICKET_STATUSES[Math.floor(Math.random() * TICKET_STATUSES.length)];

        // Create logical start times within last 60 days
        const createdDate = faker.date.recent({ days: 60 });

        tickets.push({
            id: faker.string.uuid(),
            createdByUserId: user.id,
            organizationId: user.organizationId!,
            subject: faker.helpers.arrayElement([
                "Issue with login", "Billing discrepancy", "Feature request: Dark mode",
                "API documentation error", "How to export reports?", "Payment failed",
                "Slow dashboard performance", "Mobile app crash"
            ]),
            description: faker.lorem.paragraph(),
            priority: priority as any,
            status: ticketStatus as any,
            openedAt: createdDate,
            updatedAt: createdDate
        });
    }

    await prisma.support_tickets.createMany({
        data: tickets,
        skipDuplicates: true
    });

    return {
        summary: [{ model: "support_tickets", count: tickets.length }]
    };
};

export default seedSupport;
