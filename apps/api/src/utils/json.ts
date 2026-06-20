// File: apps/api/src/utils/json.ts
// Description: Helper to cast validated Zod output into Prisma's InputJsonValue type
// Why: Single source of truth so route files don't each redefine the same cast (which drifts)
// RELEVANT FILES: apps/api/src/routes/foundation.ts, apps/api/src/routes/departments.ts

import type { Prisma } from '@prisma/client';

// Validated Zod records are safe JSON; this narrows the type for Prisma's Json fields.
export const toPrismaJson = (value: unknown): Prisma.InputJsonValue => {
  return value as Prisma.InputJsonValue;
};
