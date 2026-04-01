import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const model = anthropic('claude-haiku-4-5-20251001')

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
    model,
    maxOutputTokens: 200,
    prompt: `You are a brand protection analyst. Write a brief 2-3 sentence summary about this competitor ad detection.

Brand: ${brandName}
Competitor domain: ${competitorDomain}
Keyword they're bidding on: "${keyword}"
Their ad headline: ${adHeadline || 'Unknown'}
Their ad description: ${adDescription || 'Unknown'}
Times seen in last 30 days: ${timesSeenLast30d}
First detected: ${firstSeenDate}

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
    model,
    maxOutputTokens: 300,
    prompt: `You are a brand protection analyst writing a monthly summary for a client. Write 3-4 sentences summarising this month's brand keyword monitoring.

Brand: ${brandName}
Checks run this month: ${data.totalChecks}
Keywords monitored: ${data.keywordsMonitored}
Competitors detected this month: ${competitorList}
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
    model,
    maxOutputTokens: 200,
    prompt: `You are a PPC strategist. Analyse this competitor's ad copy targeting the brand "${brandName}" and explain their strategy in 2-3 sentences.

Competitor: ${competitorDomain}
Their ad headlines: ${headlines.filter(Boolean).join(' | ') || 'Unknown'}
Their ad descriptions: ${descriptions.filter(Boolean).join(' | ') || 'Unknown'}

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
    model,
    maxOutputTokens: 150,
    prompt: `You are a PPC strategist advising a brand using SerpAlert — a tool that monitors competitor ads on brand keywords. The product's core message is: you should NOT run brand campaigns unless competitors are actively bidding on your brand name.

Brand: ${brandName}
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
