
import { prisma } from '../prismaClient';

async function main() {
    console.log('Testing Prisma Access for Dashboard...');

    try {
        console.log('1. Checking billing_invoices...');
        // Type checking might fail here if types are wrong, but we want to see runtime behavior
        const invoiceCount = await (prisma as any).billing_invoices.count();
        console.log(`- billing_invoices count: ${invoiceCount}`);

        console.log('2. Checking aggregation...');
        const revenueAgg = await (prisma as any).billing_invoices.aggregate({
            _sum: {
                amountPaid: true,
                amountDue: true
            }
        });
        console.log(`- Revenue Agg:`, revenueAgg);

        console.log('3. Checking support_tickets...');
        const ticketCount = await (prisma as any).support_tickets.count();
        console.log(`- support_tickets count: ${ticketCount}`);

        console.log('4. Checking system_roles...');
        const roleCount = await (prisma as any).system_roles.count();
        console.log(`- system_roles count: ${roleCount}`);

        console.log('✅ Dashboard queries look promising (runtime-wise).');

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
