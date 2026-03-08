import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const result = await prisma.user.update({
        where: { email: 'admin@nexora.com' },
        data: { role: 'ADMIN' }
    })
    console.log('Successfully updated:', result.email, 'to', result.role)
}

main().catch(console.error).finally(() => prisma.$disconnect())
