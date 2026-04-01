# Analytics Funnel Metrics Contract

This document defines the internal reporting contract produced by `src/lib/analytics/funnel.ts`.

## Windows

- `last7Days`: rolling 7-day window ending at `asOf`
- `last30Days`: rolling 30-day window ending at `asOf`

Windows are `[rangeStart, rangeEnd)`:
- events at `rangeStart` are included
- events at `rangeEnd` are excluded

## Core Funnel Counts

- `visit`: `page_view`
- `signupStart`: `signup_started`
- `signupComplete`: `signup_completed`
- `trialStarted`: `trial_started`
- `checkoutStarted`: `checkout_started`
- `paidConversion`: `paid_conversion`

## Core Funnel Conversion Rates

- `visitToSignupStart = signupStart / visit`
- `signupStartToSignupComplete = signupComplete / signupStart`
- `signupCompleteToTrialStarted = trialStarted / signupComplete`
- `trialStartedToCheckoutStarted = checkoutStarted / trialStarted`
- `checkoutStartedToPaidConversion = paidConversion / checkoutStarted`
- `visitToPaidConversion = paidConversion / visit`

All rates are decimal fractions in `[0, 1]` rounded to 4 decimals.
Zero-denominator rates resolve to `0`.

## Paid Conversion Attribution

Each `paid_conversion` is bucketed by:

- `source`: `lastTouchSource` fallback `firstTouchSource` fallback `unknown`
- `medium`: `lastTouchMedium` fallback `firstTouchMedium` fallback `unknown`
- `campaign`: `lastTouchCampaign` fallback `firstTouchCampaign` fallback `unknown`

Reported fields:

- `paidConversions`: conversion count in this slice
- `shareOfPaidConversions`: `paidConversions / totalPaidConversions` (4 decimals)

## Sub-Funnels

### Audit

- `auditCheckRequested`: `audit_check_requested`
- `auditReportRequested`: `audit_report_requested`
- `checkToReportRate = auditReportRequested / auditCheckRequested`
- `reportToSignupComplete = min(auditReportRequested, signupComplete)`
- `reportToSignupRate = reportToSignupComplete / auditReportRequested`

### Calculator

- `calculatorStart`: `cta_clicked` where `properties.funnelStage = "calculator_start"`
- `calculatorComplete`: `cta_clicked` where `properties.funnelStage = "calculator_complete"`
- `startToCompleteRate = calculatorComplete / calculatorStart`
- `completeToSignupComplete = min(calculatorComplete, signupComplete)`
- `completeToSignupRate = completeToSignupComplete / calculatorComplete`
