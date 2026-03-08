const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'flyingvictor2006@gmail.com';
    const user = await prisma.user.update({
        where: { email: email },
        data: { role: 'ADMIN' }
    });
    console.log(`Usuario ${email} actualizado a ADMIN correctamente.`);
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
