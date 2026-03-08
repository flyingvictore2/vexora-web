import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.updateMany({
        where: { email: 'admin@nexora.com' },
        data: { role: 'ADMIN' }
    })
    console.log('Updated user:', user)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
