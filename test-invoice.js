const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Create a dummy user
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test Invoice User',
        },
    });
    console.log('Created User:', user.id);

    // 2. Create an invoice for that user
    const invoice = await prisma.invoice.create({
        data: {
            userId: user.id,
            amount: 12.99,
            currency: 'EUR',
            plan: 'Standard',
            status: 'PAID',
        },
    });
    console.log('Created Invoice:', invoice);

    // 3. Fetch user with invoices
    const userWithInvoices = await prisma.user.findUnique({
        where: { id: user.id },
        include: { invoices: true },
    });
    console.log('Fetched User with Invoices:', userWithInvoices);

    // Clean up
    await prisma.invoice.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Cleaned up test data');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
