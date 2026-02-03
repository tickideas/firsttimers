import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter with the pool
const adapter = new PrismaPg(pool)

export const prisma = prismaGlobal.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
    adapter,
  })

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}
