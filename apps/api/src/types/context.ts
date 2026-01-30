import type { JwtPayload } from '../types/jwt.js'
import type { PrismaClient } from '@prisma/client'

export type AppBindings = {
  Variables: {
    requestId: string
    authUser?: JwtPayload
    prisma: PrismaClient
  }
}
