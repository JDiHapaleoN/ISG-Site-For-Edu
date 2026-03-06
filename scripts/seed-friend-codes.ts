import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateFriendCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

async function main() {
    console.log('Seeding friend codes for existing users...')
    const usersWithoutCode = await prisma.user.findMany({
        where: { friendCode: null }
    })

    console.log(`Found ${usersWithoutCode.length} users without a friend code.`)

    let updatedCount = 0
    for (const user of usersWithoutCode) {
        let success = false
        while (!success) {
            try {
                const newCode = generateFriendCode()
                await prisma.user.update({
                    where: { id: user.id },
                    data: { friendCode: newCode }
                })
                success = true
                updatedCount++
            } catch (e: any) {
                // Simple retry if we accidentally hit a collision on the 6-character random string
                if (e.code === 'P2002') {
                    continue
                } else {
                    console.error(e)
                    break
                }
            }
        }
    }

    console.log(`Successfully assigned friend codes to ${updatedCount} users.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
