import { z } from 'zod';

export const TenantModeSchema = z.enum(['zone', 'standalone']);
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
  id: z.string().cuid2(),
  tenantId: z.string().cuid2(),
  churchId: z.string().cuid2(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phoneE164: z.string().regex(/^\+/).optional(),
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

