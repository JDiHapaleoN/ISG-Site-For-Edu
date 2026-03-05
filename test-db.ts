import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const words = await prisma.germanWord.findMany({
    where: { term: { contains: 'hinterlassen', mode: 'insensitive' } }
  })
  console.log(JSON.stringify(words, null, 2))
}
main()
