import { z } from 'zod'

export const analyticsEventNames = [
  'page_view',
  'cta_clicked',
  'audit_check_requested',
  'audit_result_viewed',
  'audit_report_requested',
  'signup_started',
  'signup_completed',
  'trial_started',
  'checkout_started',
  'subscription_activated',
  'paid_conversion',
  'first_keyword_created',
  'first_monitoring_result',
] as const

export const analyticsEventNameSchema = z.enum(analyticsEventNames)

export const analyticsEventPropertiesSchema = z.record(z.string(), z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]))

export const analyticsEventPayloadSchema = z.object({
  name: analyticsEventNameSchema,
  path: z.string().min(1).max(512),
  url: z.string().url().max(2048).optional(),
  userId: z.string().max(128).optional(),
  brandId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  properties: analyticsEventPropertiesSchema.optional(),
  happenedAt: z.string().datetime().optional(),
})

export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>
export type AnalyticsEventPayload = z.infer<typeof analyticsEventPayloadSchema>
