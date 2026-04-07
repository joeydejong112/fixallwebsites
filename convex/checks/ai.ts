import type { ScanIssue, PillarResult } from './types'

/**
 * AI Readiness / AEO checks (10 checks).
 * Evaluates how well AI systems (ChatGPT, Perplexity, Google AI Overviews, Claude)
 * can discover, parse, and cite this website.
 */
export function runAiChecks(
  html: string,
  headers: Record<string, string>,
  robotsTxt: string,
  jsonLd: string,
  llmsTxtStatus: number | null,
  llmsFullTxtStatus: number | null,
): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. llms.txt present
  const hasLlmsTxt = llmsTxtStatus === 200
  checks.push(hasLlmsTxt)
  if (!hasLlmsTxt) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No llms.txt found',
      description: 'Create a /llms.txt file (or /.well-known/llms.txt) to give AI crawlers a curated summary of your site content and key URLs.',
    })
  }

  // 2. llms-full.txt present
  const hasLlmsFullTxt = llmsFullTxtStatus === 200
  checks.push(hasLlmsFullTxt)
  if (!hasLlmsFullTxt) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No llms-full.txt found',
      description: 'Create a /llms-full.txt with complete content for AI ingestion pipelines that need extended context.',
    })
  }

  // 3. AI crawler allow-list in robots.txt
  const aiCrawlers = [
    'GPTBot',
    'ChatGPT-User',
    'Google-Extended',
    'ClaudeBot',
    'PerplexityBot',
    'anthropic-ai',
  ]
  const blockedCrawlers: string[] = []
  for (const bot of aiCrawlers) {
    // Look for a User-agent block for this bot followed by Disallow: /
    const botPattern = new RegExp(
      `User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/(?:\\s|$)`,
      'i',
    )
    if (botPattern.test(robotsTxt)) {
      blockedCrawlers.push(bot)
    }
  }
  const crawlerPass = blockedCrawlers.length === 0
  checks.push(crawlerPass)
  if (!crawlerPass) {
    issues.push({
      pillar: 'ai',
      severity: 'critical',
      title: 'AI crawlers blocked in robots.txt',
      description: `${blockedCrawlers.join(', ')} ${blockedCrawlers.length === 1 ? 'is' : 'are'} blocked via robots.txt. This prevents AI systems from indexing your content.`,
    })
  }

  // 4. Answer-Engine Schema (FAQPage, HowTo, QAPage, Article)
  const aeSchemas = ['FAQPage', 'HowTo', 'QAPage', 'Article', 'NewsArticle', 'BlogPosting']
  const hasAeSchema = aeSchemas.some(type =>
    new RegExp(`"@type"\\s*:\\s*"${type}"`, 'i').test(jsonLd),
  )
  checks.push(hasAeSchema)
  if (!hasAeSchema) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No answer-engine schema markup',
      description: 'Add FAQPage, HowTo, QAPage, or Article JSON-LD. AI systems extract structured answers from these schema types for direct answers.',
    })
  }

  // 5. Author Authority (E-E-A-T)
  const hasAuthorJsonLd =
    /"@type"\s*:\s*"(?:Person|Organization)"/i.test(jsonLd)
  const hasAuthorMeta =
    /rel=["']author["']/i.test(html) ||
    /<meta[^>]+name=["']author["']/i.test(html)
  const authorPass = hasAuthorJsonLd || hasAuthorMeta
  checks.push(authorPass)
  if (!authorPass) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'Missing author authority signals',
      description: 'Add Person or Organization JSON-LD, or a rel="author" link. E-E-A-T signals help AI systems assess content credibility.',
    })
  }

  // 6. Semantic content isolation (<main>, <article>, <section>)
  const hasSemanticContent =
    /<main[^>]*>/i.test(html) ||
    /<article[^>]*>/i.test(html) ||
    /<section[^>]*>/i.test(html)
  checks.push(hasSemanticContent)
  if (!hasSemanticContent) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No semantic content elements',
      description: 'Use <main>, <article>, or <section> elements to help LLM parsers isolate content from navigation and boilerplate.',
    })
  }

  // 7. Content freshness (dateModified in JSON-LD or article:modified_time meta)
  const hasDateModified =
    /"dateModified"\s*:/i.test(jsonLd) ||
    /<meta[^>]+property=["']article:modified_time["']/i.test(html)
  checks.push(hasDateModified)
  if (!hasDateModified) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No content freshness signal',
      description: 'Add a dateModified field in JSON-LD or <meta property="article:modified_time">. RAG pipelines prefer recently updated content.',
    })
  }

  // 8. Heading continuity (no skipped heading levels)
  const headingMatches = html.match(/<h([1-6])[^>]*>/gi) ?? []
  const levels = headingMatches.map(h => parseInt(h.match(/<h([1-6])/i)![1], 10))
  let headingContinuity = true
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      headingContinuity = false
      break
    }
  }
  checks.push(headingContinuity)
  if (!headingContinuity) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'Broken heading continuity',
      description: 'Headings skip levels (e.g. H2 → H4). A continuous H1→H2→H3 hierarchy provides clean outlines for AI parsers to extract topics.',
    })
  }

  // 9. Citation-friendly formatting (ordered/unordered lists, definition lists, or tables)
  const hasCitationFormat =
    /<ol[^>]*>/i.test(html) ||
    /<ul[^>]*>/i.test(html) ||
    /<dl[^>]*>/i.test(html) ||
    /<table[^>]*>/i.test(html)
  checks.push(hasCitationFormat)
  if (!hasCitationFormat) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No citation-friendly formatting',
      description: 'Use lists (<ul>, <ol>), definition lists (<dl>), or tables to present factual content. LLMs prefer structured formats for factual extraction.',
    })
  }

  // 10. Open Graph article metadata
  const hasOgArticle =
    /<meta[^>]+property=["']article:published_time["']/i.test(html) ||
    /<meta[^>]+property=["']article:author["']/i.test(html) ||
    /<meta[^>]+property=["']article:section["']/i.test(html)
  checks.push(hasOgArticle)
  if (!hasOgArticle) {
    issues.push({
      pillar: 'ai',
      severity: 'warning',
      title: 'No Open Graph article metadata',
      description: 'Add article:published_time, article:author, and article:section OG tags to provide metadata context for AI browsing agents.',
    })
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
