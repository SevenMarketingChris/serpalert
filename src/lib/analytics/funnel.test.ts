import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}))

import { buildFunnelWindowMetricsFromEvents, type FunnelAggregationEvent } from '@/lib/analytics/funnel'

function event(input: {
  eventName: string
  happenedAt: string
  properties?: Record<string, string | number | boolean | null>
  firstTouchSource?: string | null
  firstTouchMedium?: string | null
  firstTouchCampaign?: string | null
  lastTouchSource?: string | null
  lastTouchMedium?: string | null
  lastTouchCampaign?: string | null
}): FunnelAggregationEvent {
  return {
    eventName: input.eventName,
    happenedAt: new Date(input.happenedAt),
    properties: input.properties ?? {},
    firstTouchSource: input.firstTouchSource ?? null,
    firstTouchMedium: input.firstTouchMedium ?? null,
    firstTouchCampaign: input.firstTouchCampaign ?? null,
    lastTouchSource: input.lastTouchSource ?? null,
    lastTouchMedium: input.lastTouchMedium ?? null,
    lastTouchCampaign: input.lastTouchCampaign ?? null,
  }
}

describe('buildFunnelWindowMetricsFromEvents', () => {
  it('returns zero-safe conversion rates for sparse streams', () => {
    const metrics = buildFunnelWindowMetricsFromEvents([], {
      windowDays: 7,
      rangeEnd: new Date('2026-04-01T12:00:00.000Z'),
    })

    expect(metrics.counts).toEqual({
      visit: 0,
      signupStart: 0,
      signupComplete: 0,
      trialStarted: 0,
      checkoutStarted: 0,
      paidConversion: 0,
    })
    expect(metrics.conversionRates.visitToSignupStart).toBe(0)
    expect(metrics.conversionRates.checkoutStartedToPaidConversion).toBe(0)
    expect(metrics.paidConversionAttribution).toEqual([])
    expect(metrics.auditSubFunnel.checkToReportRate).toBe(0)
    expect(metrics.calculatorSubFunnel.startToCompleteRate).toBe(0)
  })

  it('groups paid conversions with missing attribution into unknown buckets', () => {
    const metrics = buildFunnelWindowMetricsFromEvents([
      event({
        eventName: 'paid_conversion',
        happenedAt: '2026-03-31T10:00:00.000Z',
      }),
      event({
        eventName: 'paid_conversion',
        happenedAt: '2026-03-31T11:00:00.000Z',
        firstTouchSource: 'google',
        firstTouchMedium: 'cpc',
        firstTouchCampaign: 'brand-defense',
      }),
    ], {
      windowDays: 7,
      rangeEnd: new Date('2026-04-01T12:00:00.000Z'),
    })

    expect(metrics.counts.paidConversion).toBe(2)
    expect(metrics.paidConversionAttribution).toEqual([
      {
        source: 'unknown',
        medium: 'unknown',
        campaign: 'unknown',
        paidConversions: 1,
        shareOfPaidConversions: 0.5,
      },
      {
        source: 'google',
        medium: 'cpc',
        campaign: 'brand-defense',
        paidConversions: 1,
        shareOfPaidConversions: 0.5,
      },
    ])
  })

  it('includes events exactly at window start and excludes events outside the window', () => {
    const rangeEnd = new Date('2026-04-01T12:00:00.000Z')
    const metrics = buildFunnelWindowMetricsFromEvents([
      event({
        eventName: 'page_view',
        happenedAt: '2026-03-25T12:00:00.000Z',
      }),
      event({
        eventName: 'page_view',
        happenedAt: '2026-03-25T11:59:59.999Z',
      }),
      event({
        eventName: 'signup_started',
        happenedAt: '2026-04-01T12:00:00.000Z',
      }),
      event({
        eventName: 'signup_started',
        happenedAt: '2026-04-01T11:59:59.999Z',
      }),
      event({
        eventName: 'cta_clicked',
        happenedAt: '2026-03-29T10:00:00.000Z',
        properties: { funnelStage: 'calculator_start' },
      }),
      event({
        eventName: 'cta_clicked',
        happenedAt: '2026-03-30T10:00:00.000Z',
        properties: { funnelStage: 'calculator_complete' },
      }),
      event({
        eventName: 'audit_check_requested',
        happenedAt: '2026-03-30T12:00:00.000Z',
      }),
      event({
        eventName: 'audit_report_requested',
        happenedAt: '2026-03-31T12:00:00.000Z',
      }),
      event({
        eventName: 'signup_completed',
        happenedAt: '2026-03-31T12:30:00.000Z',
      }),
    ], {
      windowDays: 7,
      rangeEnd,
    })

    expect(metrics.counts.visit).toBe(1)
    expect(metrics.counts.signupStart).toBe(1)
    expect(metrics.auditSubFunnel.auditCheckRequested).toBe(1)
    expect(metrics.auditSubFunnel.auditReportRequested).toBe(1)
    expect(metrics.auditSubFunnel.checkToReportRate).toBe(1)
    expect(metrics.auditSubFunnel.reportToSignupRate).toBe(1)
    expect(metrics.calculatorSubFunnel.calculatorStart).toBe(1)
    expect(metrics.calculatorSubFunnel.calculatorComplete).toBe(1)
    expect(metrics.calculatorSubFunnel.startToCompleteRate).toBe(1)
  })
})
