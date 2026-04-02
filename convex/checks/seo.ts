import type { ScanIssue, PillarResult } from './types'

interface SeoExternalData {
  robotsTxtOk: boolean | null   // null if fetch failed
  sitemapOk: boolean | null
  wwwRedirects: boolean | null  // true if www/non-www properly 301s
  httpStatus: number
  faviconOk: boolean | null
}

export function runSeoChecks(
  headers: Record<string, string>,
  html: string,
  url: string,
  external: SeoExternalData
): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. Title tag present, 10–60 chars
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const titleText = titleMatch ? titleMatch[1].trim() : ''
  if (!titleMatch || !titleText) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing <title> tag', description: 'Every page needs a unique, descriptive title tag for search engines.' })
  } else if (titleText.length < 10 || titleText.length > 60) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Title length suboptimal', description: `Title is ${titleText.length} chars. Aim for 30–60 characters for best results.` })
  } else {
    checks.push(true)
    issues.push({ pillar: 'seo', severity: 'pass', title: 'Good title tag', description: `Title length is ${titleText.length} characters — well optimised.` })
  }

  // 2. Meta description present, 70–160 chars
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  const descText = descMatch ? descMatch[1].trim() : ''
  if (!descMatch || !descText) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing meta description', description: 'Add a meta description to improve click-through rates from search results.' })
  } else if (descText.length < 70 || descText.length > 160) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Meta description length suboptimal', description: `Description is ${descText.length} chars. Aim for 70–160 characters.` })
  } else {
    checks.push(true)
    issues.push({ pillar: 'seo', severity: 'pass', title: 'Good meta description', description: `Description length is ${descText.length} characters.` })
  }

  // 3. H1 count = 1
  const h1Count = (html.match(/<h1[^>]*>/gi) ?? []).length
  if (h1Count === 0) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing H1 tag', description: 'Every page should have exactly one H1 heading.' })
  } else if (h1Count > 1) {
    checks.push(false)
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Multiple H1 tags', description: `Found ${h1Count} H1 tags. Use only one per page for clear hierarchy.` })
  } else {
    checks.push(true)
    issues.push({ pillar: 'seo', severity: 'pass', title: 'H1 tag present', description: 'Page has exactly one H1 heading — good structure.' })
  }

  // 4. Canonical URL present
  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html)
  checks.push(hasCanonical)
  if (!hasCanonical) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Missing canonical URL', description: 'Add a canonical link element to prevent duplicate content issues.' })
  }

  // 5. Viewport meta tag
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html)
  checks.push(hasViewport)
  if (!hasViewport) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Missing viewport meta tag', description: 'Add <meta name="viewport"> for proper mobile rendering and mobile-first indexing.' })
  }

  // 6. Open Graph tags
  const hasOgTitle = /<meta[^>]*property=["']og:title["']/i.test(html)
  const hasOgDesc = /<meta[^>]*property=["']og:description["']/i.test(html)
  const hasOgImage = /<meta[^>]*property=["']og:image["']/i.test(html)
  const ogPass = hasOgTitle && hasOgDesc && hasOgImage
  checks.push(ogPass)
  if (!ogPass) {
    const missing = [!hasOgTitle && 'og:title', !hasOgDesc && 'og:description', !hasOgImage && 'og:image'].filter(Boolean).join(', ')
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Incomplete Open Graph tags', description: `Missing: ${missing}. These control how your page appears when shared on social media.` })
  }

  // 7. Twitter Card tags
  const hasTwitterCard = /<meta[^>]*name=["']twitter:card["']/i.test(html)
  const hasTwitterTitle = /<meta[^>]*name=["']twitter:title["']/i.test(html)
  const twitterPass = hasTwitterCard && hasTwitterTitle
  checks.push(twitterPass)
  if (!twitterPass) {
    const missing = [!hasTwitterCard && 'twitter:card', !hasTwitterTitle && 'twitter:title'].filter(Boolean).join(', ')
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Incomplete Twitter Card tags', description: `Missing: ${missing}. Add these for better Twitter/X sharing previews.` })
  }

  // 8. JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  let jsonLdType: string | null = null
  if (jsonLdMatch) {
    try {
      const content = jsonLdMatch[0].replace(/<\/?script[^>]*>/gi, '')
      const parsed = JSON.parse(content)
      jsonLdType = parsed['@type'] ?? (Array.isArray(parsed['@graph']) ? 'Graph' : null)
    } catch { /* malformed JSON-LD */ }
  }
  const hasJsonLd = !!jsonLdMatch
  checks.push(hasJsonLd)
  if (hasJsonLd) {
    issues.push({ pillar: 'seo', severity: 'pass', title: `Structured data found${jsonLdType ? `: ${jsonLdType}` : ''}`, description: 'JSON-LD structured data detected — helps search engines understand your content.' })
  } else {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'No structured data', description: 'Add JSON-LD structured data (Schema.org) for rich search results.' })
  }

  // 9. Favicon present
  const hasFaviconLink = /<link[^>]*rel=["'][^"']*icon[^"']*["']/i.test(html)
  const faviconPass = hasFaviconLink || external.faviconOk === true
  checks.push(faviconPass)
  if (!faviconPass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'No favicon detected', description: 'Add a favicon for brand recognition in browser tabs and bookmarks.' })
  }

  // 10. robots.txt reachable
  if (external.robotsTxtOk !== null) {
    checks.push(external.robotsTxtOk)
    if (!external.robotsTxtOk) {
      issues.push({ pillar: 'seo', severity: 'warning', title: 'robots.txt not reachable', description: 'robots.txt returned a non-200 status. Ensure it exists at the site root.' })
    }
  }

  // 11. sitemap.xml reachable
  if (external.sitemapOk !== null) {
    checks.push(external.sitemapOk)
    if (!external.sitemapOk) {
      issues.push({ pillar: 'seo', severity: 'warning', title: 'sitemap.xml not reachable', description: 'sitemap.xml returned a non-200 status. A sitemap helps search engines discover all pages.' })
    }
  }

  // 12. noindex detection
  const metaNoindex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["']/i.test(html)
  const headerNoindex = (headers['x-robots-tag'] ?? '').toLowerCase().includes('noindex')
  const hasNoindex = metaNoindex || headerNoindex
  checks.push(!hasNoindex)
  if (hasNoindex) {
    issues.push({ pillar: 'seo', severity: 'critical', title: 'Page is noindexed', description: 'This page has a noindex directive — search engines will not index it. Remove if unintentional.' })
  }

  // 13. WWW vs non-WWW consistency
  if (external.wwwRedirects !== null) {
    checks.push(external.wwwRedirects)
    if (!external.wwwRedirects) {
      issues.push({ pillar: 'seo', severity: 'warning', title: 'WWW/non-WWW not redirecting', description: 'Both www and non-www versions respond. One should 301 to the other to avoid duplicate content.' })
    }
  }

  // 14. Image alt text coverage
  const allImgs = html.match(/<img[^>]*>/gi) ?? []
  let imgsWithAlt = 0
  for (const tag of allImgs) {
    if (/\balt=["'][^"']*["']/i.test(tag) || /\balt=""/i.test(tag)) imgsWithAlt++
  }
  const altCoverage = allImgs.length > 0 ? imgsWithAlt / allImgs.length : 1
  const altPass = altCoverage >= 0.8
  checks.push(altPass)
  if (!altPass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Low image alt text coverage', description: `${imgsWithAlt} of ${allImgs.length} images have alt text (${Math.round(altCoverage * 100)}%). Aim for > 80%.` })
  }

  // 15. Page word count
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length
  const wordCountPass = wordCount >= 300
  checks.push(wordCountPass)
  if (!wordCountPass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'Thin content', description: `Page has ~${wordCount} words. Pages with < 300 words may rank poorly. Add meaningful content.` })
  }

  // 16. Charset declaration
  const hasMetaCharset = /<meta[^>]*charset=/i.test(html)
  const hasContentTypeCharset = (headers['content-type'] ?? '').toLowerCase().includes('charset')
  const charsetPass = hasMetaCharset || hasContentTypeCharset
  checks.push(charsetPass)
  if (!charsetPass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'No charset declaration', description: 'Add <meta charset="UTF-8"> to ensure correct character encoding.' })
  }

  // 17. HTTP status is 200
  const statusPass = external.httpStatus === 200
  checks.push(statusPass)
  if (!statusPass) {
    issues.push({ pillar: 'seo', severity: 'critical', title: `HTTP status ${external.httpStatus}`, description: `Page returned status ${external.httpStatus}. Search engines expect a 200 for indexable content.` })
  }

  // 18. Author attribution
  const hasMetaAuthor = /<meta[^>]*name=["']author["']/i.test(html)
  const hasPersonSchema = /"@type"\s*:\s*"Person"/i.test(html)
  const hasByline = /class=["'][^"']*(?:author|byline)[^"']*["']/i.test(html)
  const authorPass = hasMetaAuthor || hasPersonSchema || hasByline
  checks.push(authorPass)
  if (!authorPass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'No author attribution', description: 'Add a meta author tag, Person schema, or visible byline. Author signals support E-E-A-T.' })
  }

  // 19. Publication dates in JSON-LD
  const hasDatePublished = /"datePublished"\s*:/i.test(html)
  const hasDateModified = /"dateModified"\s*:/i.test(html)
  const datePass = hasDatePublished || hasDateModified
  checks.push(datePass)
  if (!datePass) {
    issues.push({ pillar: 'seo', severity: 'warning', title: 'No publication dates', description: 'Add datePublished/dateModified in JSON-LD. Freshness signals help rankings.' })
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
