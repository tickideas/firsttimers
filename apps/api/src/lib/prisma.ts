import { PrismaClient } from '@prisma/client'

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

export const prisma = prismaGlobal.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}
