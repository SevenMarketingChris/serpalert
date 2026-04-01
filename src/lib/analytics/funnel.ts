import { and, gte, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/lib/db/schema'

type AnalyticsPrimitive = string | number | boolean | null

export type FunnelStageCounts = {
  visit: number
  signupStart: number
  signupComplete: number
  trialStarted: number
  checkoutStarted: number
  paidConversion: number
}

export type FunnelConversionRates = {
  visitToSignupStart: number
  signupStartToSignupComplete: number
  signupCompleteToTrialStarted: number
  trialStartedToCheckoutStarted: number
  checkoutStartedToPaidConversion: number
  visitToPaidConversion: number
}

export type PaidConversionAttributionSlice = {
  source: string
  medium: string
  campaign: string
  paidConversions: number
  shareOfPaidConversions: number
}

export type AuditSubFunnel = {
  auditCheckRequested: number
  auditReportRequested: number
  reportToSignupComplete: number
  checkToReportRate: number
  reportToSignupRate: number
}

export type CalculatorSubFunnel = {
  calculatorStart: number
  calculatorComplete: number
  completeToSignupComplete: number
  startToCompleteRate: number
  completeToSignupRate: number
}

export type FunnelWindowMetrics = {
  windowDays: number
  rangeStart: Date
  rangeEnd: Date
  counts: FunnelStageCounts
  conversionRates: FunnelConversionRates
  paidConversionAttribution: PaidConversionAttributionSlice[]
  auditSubFunnel: AuditSubFunnel
  calculatorSubFunnel: CalculatorSubFunnel
}

export type FunnelMetricsSummary = {
  asOf: Date
  last7Days: FunnelWindowMetrics
  last30Days: FunnelWindowMetrics
}

export type FunnelAggregationEvent = {
  eventName: string
  happenedAt: Date
  properties: Record<string, AnalyticsPrimitive> | null
  firstTouchSource: string | null
  firstTouchMedium: string | null
  firstTouchCampaign: string | null
  lastTouchSource: string | null
  lastTouchMedium: string | null
  lastTouchCampaign: string | null
}

const FUNNEL_RELEVANT_EVENT_NAMES = [
  'page_view',
  'audit_check_requested',
  'audit_report_requested',
  'signup_started',
  'signup_completed',
  'trial_started',
  'checkout_started',
  'paid_conversion',
  'cta_clicked',
] as const

function toRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number((numerator / denominator).toFixed(4))
}

function normalizeAttributionValue(value: string | null | undefined): string {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : 'unknown'
}

function subtractDays(anchor: Date, days: number): Date {
  return new Date(anchor.getTime() - days * 24 * 60 * 60 * 1000)
}

export function buildFunnelWindowMetricsFromEvents(
  events: FunnelAggregationEvent[],
  input: {
    windowDays: number
    rangeEnd: Date
  },
): FunnelWindowMetrics {
  const rangeEnd = new Date(input.rangeEnd)
  const rangeStart = subtractDays(rangeEnd, input.windowDays)

  const counts: FunnelStageCounts = {
    visit: 0,
    signupStart: 0,
    signupComplete: 0,
    trialStarted: 0,
    checkoutStarted: 0,
    paidConversion: 0,
  }

  const auditSubFunnel: AuditSubFunnel = {
    auditCheckRequested: 0,
    auditReportRequested: 0,
    reportToSignupComplete: 0,
    checkToReportRate: 0,
    reportToSignupRate: 0,
  }

  const calculatorSubFunnel: CalculatorSubFunnel = {
    calculatorStart: 0,
    calculatorComplete: 0,
    completeToSignupComplete: 0,
    startToCompleteRate: 0,
    completeToSignupRate: 0,
  }

  const paidAttributionBuckets = new Map<string, PaidConversionAttributionSlice>()

  for (const event of events) {
    if (!(event.happenedAt >= rangeStart && event.happenedAt < rangeEnd)) continue

    if (event.eventName === 'page_view') counts.visit++
    if (event.eventName === 'signup_started') counts.signupStart++
    if (event.eventName === 'signup_completed') counts.signupComplete++
    if (event.eventName === 'trial_started') counts.trialStarted++
    if (event.eventName === 'checkout_started') counts.checkoutStarted++

    if (event.eventName === 'audit_check_requested') auditSubFunnel.auditCheckRequested++
    if (event.eventName === 'audit_report_requested') auditSubFunnel.auditReportRequested++

    const funnelStage = typeof event.properties?.funnelStage === 'string'
      ? event.properties.funnelStage
      : null
    if (event.eventName === 'cta_clicked' && funnelStage === 'calculator_start') {
      calculatorSubFunnel.calculatorStart++
    }
    if (event.eventName === 'cta_clicked' && funnelStage === 'calculator_complete') {
      calculatorSubFunnel.calculatorComplete++
    }

    if (event.eventName !== 'paid_conversion') continue

    counts.paidConversion++
    const source = normalizeAttributionValue(event.lastTouchSource ?? event.firstTouchSource)
    const medium = normalizeAttributionValue(event.lastTouchMedium ?? event.firstTouchMedium)
    const campaign = normalizeAttributionValue(event.lastTouchCampaign ?? event.firstTouchCampaign)
    const key = `${source}::${medium}::${campaign}`
    const existing = paidAttributionBuckets.get(key)
    if (existing) {
      existing.paidConversions += 1
    } else {
      paidAttributionBuckets.set(key, {
        source,
        medium,
        campaign,
        paidConversions: 1,
        shareOfPaidConversions: 0,
      })
    }
  }

  auditSubFunnel.reportToSignupComplete = Math.min(
    auditSubFunnel.auditReportRequested,
    counts.signupComplete,
  )
  calculatorSubFunnel.completeToSignupComplete = Math.min(
    calculatorSubFunnel.calculatorComplete,
    counts.signupComplete,
  )

  auditSubFunnel.checkToReportRate = toRatio(
    auditSubFunnel.auditReportRequested,
    auditSubFunnel.auditCheckRequested,
  )
  auditSubFunnel.reportToSignupRate = toRatio(
    auditSubFunnel.reportToSignupComplete,
    auditSubFunnel.auditReportRequested,
  )

  calculatorSubFunnel.startToCompleteRate = toRatio(
    calculatorSubFunnel.calculatorComplete,
    calculatorSubFunnel.calculatorStart,
  )
  calculatorSubFunnel.completeToSignupRate = toRatio(
    calculatorSubFunnel.completeToSignupComplete,
    calculatorSubFunnel.calculatorComplete,
  )

  const paidConversionAttribution = [...paidAttributionBuckets.values()]
    .sort((a, b) => b.paidConversions - a.paidConversions)
    .map((slice) => ({
      ...slice,
      shareOfPaidConversions: toRatio(slice.paidConversions, counts.paidConversion),
    }))

  const conversionRates: FunnelConversionRates = {
    visitToSignupStart: toRatio(counts.signupStart, counts.visit),
    signupStartToSignupComplete: toRatio(counts.signupComplete, counts.signupStart),
    signupCompleteToTrialStarted: toRatio(counts.trialStarted, counts.signupComplete),
    trialStartedToCheckoutStarted: toRatio(counts.checkoutStarted, counts.trialStarted),
    checkoutStartedToPaidConversion: toRatio(counts.paidConversion, counts.checkoutStarted),
    visitToPaidConversion: toRatio(counts.paidConversion, counts.visit),
  }

  return {
    windowDays: input.windowDays,
    rangeStart,
    rangeEnd,
    counts,
    conversionRates,
    paidConversionAttribution,
    auditSubFunnel,
    calculatorSubFunnel,
  }
}

export async function getFunnelMetricsSummary(asOf = new Date()): Promise<FunnelMetricsSummary> {
  const rangeEnd = new Date(asOf)
  const rangeStart = subtractDays(rangeEnd, 30)

  const events = await db.select({
    eventName: analyticsEvents.eventName,
    happenedAt: analyticsEvents.happenedAt,
    properties: analyticsEvents.properties,
    firstTouchSource: analyticsEvents.firstTouchSource,
    firstTouchMedium: analyticsEvents.firstTouchMedium,
    firstTouchCampaign: analyticsEvents.firstTouchCampaign,
    lastTouchSource: analyticsEvents.lastTouchSource,
    lastTouchMedium: analyticsEvents.lastTouchMedium,
    lastTouchCampaign: analyticsEvents.lastTouchCampaign,
  })
    .from(analyticsEvents)
    .where(and(
      gte(analyticsEvents.happenedAt, rangeStart),
      inArray(analyticsEvents.eventName, [...FUNNEL_RELEVANT_EVENT_NAMES]),
    ))

  return {
    asOf: rangeEnd,
    last7Days: buildFunnelWindowMetricsFromEvents(events, {
      windowDays: 7,
      rangeEnd,
    }),
    last30Days: buildFunnelWindowMetricsFromEvents(events, {
      windowDays: 30,
      rangeEnd,
    }),
  }
}
