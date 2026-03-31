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
    maxTokens: 200,
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
    maxTokens: 300,
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
    maxTokens: 200,
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
    maxTokens: 150,
    prompt: `You are a PPC strategist. Give a one-sentence recommendation based on current competitor activity.

Brand: ${brandName}
Active competitors this week: ${activeCompetitors}
Has Google Ads brand campaign: ${hasBrandCampaign ? 'Yes' : 'No'}
Brand campaign currently active: ${brandCampaignActive ? 'Yes' : 'No'}

Give ONE clear, actionable recommendation. Examples: "Keep brand campaign running — 3 active competitors." or "Safe to pause brand campaign — no competitor activity this week." or "Consider setting up a brand campaign — competitors are actively bidding." Be direct.`,
  })
  return text
}
