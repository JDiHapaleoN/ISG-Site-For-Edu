const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    // Reset all German words
    const res1 = await prisma.germanWord.updateMany({
        data: { nextReview: now }
    });
    // Reset all English words
    const res2 = await prisma.englishWord.updateMany({
        data: { nextReview: now }
    });
    console.log(`Reset ${res1.count} German words and ${res2.count} English words to be due NOW.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
