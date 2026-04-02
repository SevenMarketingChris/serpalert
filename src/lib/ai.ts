import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const haiku = anthropic('claude-haiku-4-5-20251001')
const sonnet = anthropic('claude-sonnet-4-6-20250116')

/**
 * Sanitize user/external data before passing to LLM prompts.
 * Strips characters that could be used for prompt injection,
 * truncates to a safe length, and removes instruction-like patterns.
 */
function sanitize(input: string | null | undefined, maxLength = 200): string {
  if (!input) return 'Unknown'
  return input
    .replace(/[\r\n]+/g, ' ')           // flatten newlines
    .replace(/[<>{}[\]]/g, '')           // strip brackets/braces
    .replace(/ignore\s+(all|previous|above)\s+instructions?/gi, '[filtered]')
    .replace(/you\s+are\s+(now|a)\s+/gi, '[filtered]')
    .replace(/system\s*:?\s*prompt/gi, '[filtered]')
    .replace(/\bdo\s+not\s+follow\b/gi, '[filtered]')
    .trim()
    .slice(0, maxLength)
}

export async function generateCompetitorSummary(
  brandName: string,
  competitorDomain: string,
  keyword: string,
  adHeadline: string | null,
  adDescription: string | null,
  timesSeenLast30d: number,
  firstSeenDate: string,
): Promise<string> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 200,
    prompt: `You are a brand protection analyst. Write a brief 2-3 sentence summary about this competitor ad detection.

Brand: ${sanitize(brandName)}
Competitor domain: ${sanitize(competitorDomain)}
Keyword they're bidding on: "${sanitize(keyword)}"
Their ad headline: ${sanitize(adHeadline)}
Their ad description: ${sanitize(adDescription)}
Times seen in last 30 days: ${timesSeenLast30d}
First detected: ${sanitize(firstSeenDate)}

Write a concise, professional summary explaining what this competitor is doing, their likely strategy based on the ad copy, and how active they are. No bullet points, just 2-3 sentences. Be specific about the competitor's angle based on their ad copy.`,
  })
  return text
}

export async function generateMonthlyInsights(
  brandName: string,
  data: {
    totalChecks: number
    competitors: { domain: string; count: number }[]
    previousMonthCompetitors: number
    keywordsMonitored: number
  },
): Promise<string> {
  const competitorList = data.competitors.length > 0
    ? data.competitors.map(c => `${c.domain} (${c.count}x)`).join(', ')
    : 'None detected'

  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 300,
    prompt: `You are a brand protection analyst writing a monthly summary for a client. Write 3-4 sentences summarising this month's brand keyword monitoring.

Brand: ${sanitize(brandName)}
Checks run this month: ${data.totalChecks}
Keywords monitored: ${data.keywordsMonitored}
Competitors detected this month: ${sanitize(competitorList, 500)}
Competitors detected last month: ${data.previousMonthCompetitors}

Write a professional, actionable summary. Compare to last month if relevant. Mention the most active competitor by name. If no competitors were detected, be positive about brand protection. End with a one-sentence recommendation. No bullet points.`,
  })
  return text
}

export async function generateAdCopyAnalysis(
  brandName: string,
  competitorDomain: string,
  headlines: string[],
  descriptions: string[],
): Promise<string> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 200,
    prompt: `You are a PPC strategist. Analyse this competitor's ad copy targeting the brand "${brandName}" and explain their strategy in 2-3 sentences.

Competitor: ${sanitize(competitorDomain)}
Their ad headlines: ${sanitize(headlines.filter(Boolean).join(' | ') || 'Unknown', 500)}
Their ad descriptions: ${sanitize(descriptions.filter(Boolean).join(' | ') || 'Unknown', 500)}

What angle are they taking? What are they offering vs the brand? What should the brand owner know? Be specific and concise.`,
  })
  return text
}

export async function generateActionRecommendation(
  brandName: string,
  activeCompetitors: number,
  hasBrandCampaign: boolean,
  brandCampaignActive: boolean,
): Promise<string> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 150,
    prompt: `You are a PPC strategist advising a brand using SerpAlert — a tool that monitors competitor ads on brand keywords. The product's core message is: you should NOT run brand campaigns unless competitors are actively bidding on your brand name.

Brand: ${sanitize(brandName)}
Active competitors this week: ${activeCompetitors}
Has Google Ads brand campaign set up: ${hasBrandCampaign ? 'Yes' : 'No'}
Brand campaign currently active: ${brandCampaignActive ? 'Yes' : 'No'}

Give ONE clear, actionable recommendation. Rules:
- If 0 competitors: recommend keeping brand campaign paused/off to save budget. Never suggest launching a brand campaign when there are no competitors.
- If 1+ competitors: recommend enabling/keeping brand campaign running to defend position.
- If they don't have a brand campaign set up and competitors are active: suggest setting one up to defend their position.
- If they don't have a brand campaign and no competitors: reassure them they're protected and saving money by not running brand ads.
Be direct, one sentence only.`,
  })
  return text
}

// --- New AI features ---

export async function triageAlert(
  brandName: string,
  competitorDomain: string,
  position: number | null,
  keyword: string,
): Promise<'urgent' | 'monitor' | 'ignore'> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 10,
    prompt: `Classify this competitor ad alert for the brand "${sanitize(brandName)}".

Competitor: ${sanitize(competitorDomain)}
Ad position: ${position ?? 'unknown'}
Keyword: "${sanitize(keyword)}"

Rules:
- "urgent": competitor is in position 1-2, or is a direct industry rival
- "monitor": competitor is in position 3+, or is a marketplace/aggregator (e.g. comparison sites)
- "ignore": competitor domain looks unrelated to the brand's industry

Reply with exactly one word: urgent, monitor, or ignore.`,
  })
  const cleaned = text.trim().toLowerCase()
  if (cleaned === 'urgent' || cleaned === 'monitor' || cleaned === 'ignore') return cleaned
  return 'monitor' // default if unexpected
}

export async function classifyCompetitorIntent(
  brandName: string,
  competitorDomain: string,
  adHeadline: string | null,
  adDescription: string | null,
): Promise<{ type: 'direct_rival' | 'marketplace' | 'unrelated'; confidence: string }> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 50,
    prompt: `Classify this competitor bidding on the brand "${sanitize(brandName)}".

Competitor domain: ${sanitize(competitorDomain)}
Their ad headline: ${sanitize(adHeadline)}
Their ad description: ${sanitize(adDescription)}

Categories:
- "direct_rival": a direct competitor offering a similar product/service
- "marketplace": an aggregator, comparison site, or marketplace listing multiple providers
- "unrelated": domain appears unrelated to the brand's industry

Reply in format: TYPE|CONFIDENCE
Example: direct_rival|high
or: marketplace|medium`,
  })
  const parts = text.trim().toLowerCase().split('|')
  const type = (['direct_rival', 'marketplace', 'unrelated'].includes(parts[0]) ? parts[0] : 'unrelated') as 'direct_rival' | 'marketplace' | 'unrelated'
  const confidence = parts[1] || 'medium'
  return { type, confidence }
}

export async function suggestKeyword(
  brandName: string,
  domain: string | null,
): Promise<string> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 50,
    prompt: `A user is setting up brand keyword monitoring for "${sanitize(brandName)}"${domain ? ` (website: ${sanitize(domain)})` : ''}.

Suggest the single best keyword to monitor for competitor ads. This should be the most common way customers search for this brand. Usually it's just the brand name itself.

Reply with only the keyword, nothing else.`,
  })
  return text.trim()
}

export async function generateWeeklyDigest(
  brandName: string,
  data: {
    checksThisWeek: number
    competitorsThisWeek: { domain: string; count: number }[]
    competitorsLastWeek: number
    newCompetitors: string[]
    stoppedCompetitors: string[]
  },
): Promise<string> {
  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 300,
    prompt: `You are a brand protection analyst writing a weekly email digest for "${sanitize(brandName)}". Write 3-4 sentences summarising this week's activity in a professional, reassuring tone.

Data:
- Checks run this week: ${data.checksThisWeek}
- Competitors detected this week: ${sanitize(data.competitorsThisWeek.map(c => `${c.domain} (${c.count}x)`).join(', ') || 'None', 500)}
- Competitors last week: ${data.competitorsLastWeek}
- New competitors (not seen before): ${sanitize(data.newCompetitors.join(', ') || 'None', 500)}
- Competitors that stopped bidding: ${sanitize(data.stoppedCompetitors.join(', ') || 'None', 500)}

Guidelines:
- Compare to last week (more/less/same activity)
- Highlight new competitors by name if any appeared
- Note if any stopped bidding (positive development)
- End with a clear action: "No action needed" or "Keep brand campaign active" etc
- Never suggest launching a brand campaign if no competitors are active
- Keep it concise and professional — this goes directly in an email`,
  })
  return text
}

export async function generateAdCopySuggestion(
  brandName: string,
  competitorHeadlines: string[],
  competitorDescriptions: string[],
  brandDomain: string | null,
): Promise<{ headline: string; description: string }> {
  const { text } = await generateText({
    model: sonnet,
    maxOutputTokens: 200,
    prompt: `You are a Google Ads copywriter. A brand "${sanitize(brandName)}"${brandDomain ? ` (${sanitize(brandDomain)})` : ''} has competitors bidding on their brand keyword. Write a defensive brand ad that will win back clicks.

Competitor ad headlines: ${sanitize(competitorHeadlines.filter(Boolean).join(' | ') || 'Unknown', 500)}
Competitor ad descriptions: ${sanitize(competitorDescriptions.filter(Boolean).join(' | ') || 'Unknown', 500)}

Write ONE Google Ads responsive search ad for the brand to counter these competitors:
- Headline (max 30 characters): should emphasise being the official/original brand
- Description (max 90 characters): should highlight what makes the brand better than competitors

Reply in format:
HEADLINE: [your headline]
DESCRIPTION: [your description]`,
  })
  const headlineMatch = text.match(/HEADLINE:\s*(.+)/i)
  const descMatch = text.match(/DESCRIPTION:\s*(.+)/i)
  return {
    headline: headlineMatch?.[1]?.trim() || `${brandName} — Official Site`,
    description: descMatch?.[1]?.trim() || `The original ${brandName}. Don't settle for imitators.`,
  }
}

export async function generateCompetitiveLandscape(
  brandName: string,
  data: {
    totalChecks: number
    competitors: { domain: string; count: number; avgPosition: number | null; type?: string }[]
    keywordsMonitored: number
    monthName: string
  },
): Promise<string> {
  const cappedCompetitors = data.competitors.slice(0, 20)
  const competitorDetails = cappedCompetitors.length > 0
    ? cappedCompetitors.map(c => `${sanitize(c.domain)} (seen ${c.count}x, avg position ${c.avgPosition ?? 'N/A'}${c.type ? `, type: ${sanitize(c.type)}` : ''})`).join('\n')
    : 'No competitors detected'

  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 500,
    prompt: `You are a senior PPC analyst writing a competitive landscape report for "${sanitize(brandName)}" for ${sanitize(data.monthName)}.

Data:
- Total SERP checks: ${data.totalChecks}
- Keywords monitored: ${data.keywordsMonitored}
- Competitors detected:
${competitorDetails}

Write a 4-6 sentence executive summary covering:
1. Overall threat level (low/medium/high) based on competitor count and positions
2. Who the main threats are and their bidding strategy
3. Month-over-month trend if apparent
4. Specific recommendation (keep campaign paused, activate defence, adjust bids, etc)
5. Never recommend running brand campaigns if no competitors are active

Write in professional analyst tone. This will be included in a PDF report sent to the brand owner.`,
  })
  return text
}

export async function analyzeBidTiming(
  brandName: string,
  checkTimestamps: { domain: string; checkedAt: string }[],
): Promise<string> {
  const summary = checkTimestamps.reduce((acc, c) => {
    const hour = new Date(c.checkedAt).getUTCHours()
    const day = new Date(c.checkedAt).toLocaleDateString('en-GB', { weekday: 'long' })
    acc.push(`${c.domain} seen at ${hour}:00 UTC on ${day}`)
    return acc
  }, [] as string[]).slice(0, 50).join('\n')

  const { text } = await generateText({
    model: haiku,
    maxOutputTokens: 150,
    prompt: `Analyse when competitors bid on "${sanitize(brandName)}" brand keywords based on detection timestamps.

Recent detections:
${summary}

In 2-3 sentences, describe any patterns: Do they bid more on weekdays vs weekends? Morning vs evening? Are there specific days with more activity? If you can identify a pattern, suggest when the brand should schedule their defensive campaign.`,
  })
  return text
}
