// File: packages/types/src/index.ts
// Description: Shared Zod schemas, types, and constants used across web, api, and worker
// Why: Single source of truth so enums/IDs/queue names cannot drift between apps and the database
// RELEVANT FILES: prisma/schema.prisma, apps/api/src/services/notifications.ts, apps/worker/src/index.ts

import { z } from 'zod';

// Name of the BullMQ queue shared between the API (producer) and worker (consumer).
// Must match on both sides or jobs are never processed.
export const NOTIFICATION_QUEUE_NAME = 'notifications';

// E.164 phone format: leading + followed by 10-15 digits. Shared so public form,
// admin edit, and worker all validate phone numbers the same way.
export const PHONE_E164_REGEX = /^\+\d{10,15}$/;
export const PhoneE164Schema = z.string().regex(PHONE_E164_REGEX);

// Matches Prisma's TenantMode enum casing exactly.
export const TenantModeSchema = z.enum(['ZONE', 'STANDALONE']);
export type TenantMode = z.infer<typeof TenantModeSchema>;

export const PipelineStageSchema = z.enum([
  'NEW',
  'VERIFIED',
  'CONTACTED',
  'IN_PROGRESS',
  'FOUNDATION_ENROLLED',
  'FOUNDATION_IN_CLASS',
  'FOUNDATION_COMPLETED',
  'DEPARTMENT_ONBOARDING',
  'ACTIVE_MEMBER',
  'DORMANT'
]);
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const MinimalFirstTimerSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string().cuid(),
  churchId: z.string().cuid(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phoneE164: PhoneE164Schema.optional(),
  consent: z.boolean(),
  status: PipelineStageSchema
});
export type MinimalFirstTimer = z.infer<typeof MinimalFirstTimerSchema>;

export const RoleKeySchema = z.enum([
  'super_admin',
  'zonal_admin',
  'group_admin',
  'church_admin',
  'verifier',
  'followup_agent',
  'foundation_coordinator',
  'department_head'
]);
export type RoleKey = z.infer<typeof RoleKeySchema>;

