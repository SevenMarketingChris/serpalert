interface WastedSpendBadgeProps {
  detections: number
  avgPosition: number | null
}

export function WastedSpendBadge({ detections, avgPosition }: WastedSpendBadgeProps) {
  // Rough estimate: each detection at position 1-2 steals ~10-15% of brand clicks
  // Average brand CPC in UK is £0.50-£2.00
  // Conservative: £1 CPC × 10% CTR steal × detections
  const estimatedCPC = 1.0
  const ctrStealRate = avgPosition != null && avgPosition <= 2 ? 0.15 : 0.08
  const estimatedLoss = Math.round(detections * estimatedCPC * ctrStealRate * 100) // multiply by ~100 impressions per detection

  if (estimatedLoss < 1) return null

  return (
    <span className="text-[10px] font-mono text-amber-500" title="Estimated revenue at risk based on position and detection frequency">
      ~£{estimatedLoss.toLocaleString()} at risk
    </span>
  )
}
