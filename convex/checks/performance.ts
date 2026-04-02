import type { ScanIssue, PillarResult, CwvData } from './types'

export function runPerformanceChecks(
  headers: Record<string, string>,
  html: string,
  url: string,
  ttfb: number,
  cwvData: CwvData | null,
  greenHosting: boolean | null
): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []
  const pageUrl = new URL(url)

  // 1. TTFB
  if (ttfb > 800) {
    checks.push(false)
    issues.push({ pillar: 'performance', severity: 'critical', title: 'Slow TTFB', description: `Time to first byte was ${ttfb}ms. Aim for under 400ms.` })
  } else if (ttfb > 400) {
    checks.push(false)
    issues.push({ pillar: 'performance', severity: 'warning', title: 'High TTFB', description: `TTFB is ${ttfb}ms. Consider server-side caching to improve response times.` })
  } else {
    checks.push(true)
    issues.push({ pillar: 'performance', severity: 'pass', title: 'Good TTFB', description: `Excellent! TTFB is ${ttfb}ms.` })
  }

  // 2. Compression enabled
  const encoding = headers['content-encoding'] ?? ''
  const hasCompression = encoding.includes('gzip') || encoding.includes('br')
  checks.push(hasCompression)
  if (!hasCompression) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'No compression', description: 'Enable gzip or Brotli compression to reduce page transfer size.' })
  }

  // 3. HTTP/2+ support
  const altSvc = headers['alt-svc'] ?? ''
  const hasHttp2Plus = altSvc.includes('h2') || altSvc.includes('h3')
  checks.push(hasHttp2Plus)
  if (!hasHttp2Plus) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'No HTTP/2+ detected', description: 'Enable HTTP/2 or HTTP/3 for multiplexed connections and faster page loads.' })
  }

  // 4–6. Core Web Vitals (skip if unavailable)
  if (cwvData && cwvData.available) {
    // 4. LCP
    if (cwvData.lcp !== null) {
      const lcpSec = cwvData.lcp / 1000
      if (cwvData.lcp > 4000) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'critical', title: 'Poor LCP', description: `Largest Contentful Paint is ${lcpSec.toFixed(1)}s. Aim for ≤ 2.5s.` })
      } else if (cwvData.lcp > 2500) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'warning', title: 'Needs improvement: LCP', description: `LCP is ${lcpSec.toFixed(1)}s. Target ≤ 2.5s for a good user experience.` })
      } else {
        checks.push(true)
        issues.push({ pillar: 'performance', severity: 'pass', title: 'Good LCP', description: `LCP is ${lcpSec.toFixed(1)}s — within the recommended threshold.` })
      }
    }

    // 5. INP
    if (cwvData.inp !== null) {
      if (cwvData.inp > 500) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'critical', title: 'Poor INP', description: `Interaction to Next Paint is ${cwvData.inp}ms. Aim for ≤ 200ms.` })
      } else if (cwvData.inp > 200) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'warning', title: 'Needs improvement: INP', description: `INP is ${cwvData.inp}ms. Target ≤ 200ms for responsive interactions.` })
      } else {
        checks.push(true)
        issues.push({ pillar: 'performance', severity: 'pass', title: 'Good INP', description: `INP is ${cwvData.inp}ms — interactions feel snappy.` })
      }
    }

    // 6. CLS
    if (cwvData.cls !== null) {
      if (cwvData.cls > 0.25) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'critical', title: 'Poor CLS', description: `Cumulative Layout Shift is ${cwvData.cls.toFixed(3)}. Aim for ≤ 0.1.` })
      } else if (cwvData.cls > 0.1) {
        checks.push(false)
        issues.push({ pillar: 'performance', severity: 'warning', title: 'Needs improvement: CLS', description: `CLS is ${cwvData.cls.toFixed(3)}. Target ≤ 0.1 to avoid layout jank.` })
      } else {
        checks.push(true)
        issues.push({ pillar: 'performance', severity: 'pass', title: 'Good CLS', description: `CLS is ${cwvData.cls.toFixed(3)} — stable layout.` })
      }
    }
  }

  // 7. Total HTML size
  const htmlSizeKb = Math.round(html.length / 1024)
  const htmlSmall = htmlSizeKb <= 100
  checks.push(htmlSmall)
  if (!htmlSmall) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Large HTML document', description: `HTML is ${htmlSizeKb}KB. Consider reducing inline styles/scripts or server-side rendering optimizations.` })
  }

  // 8. Render-blocking scripts in <head>
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  let blockingScripts = 0
  if (headMatch) {
    const headContent = headMatch[1]
    const headScripts = headContent.match(/<script[^>]*src=[^>]*>/gi) ?? []
    for (const tag of headScripts) {
      if (!/async|defer|type=["']module["']/i.test(tag)) blockingScripts++
    }
  }
  const noBlockingScripts = blockingScripts === 0
  checks.push(noBlockingScripts)
  if (!noBlockingScripts) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Render-blocking scripts', description: `${blockingScripts} script(s) in <head> without async or defer. They block page rendering.` })
  }

  // 9. Image format audit — flag PNG/JPEG/BMP/TIFF
  const imgSrcs = html.match(/<img[^>]+src=["']([^"']+)["']/gi) ?? []
  let legacyFormats = 0
  for (const tag of imgSrcs) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i)
    if (srcMatch) {
      const src = srcMatch[1].toLowerCase()
      if (/\.(png|jpe?g|bmp|tiff?)(\?|$)/i.test(src)) legacyFormats++
    }
  }
  const modernFormats = legacyFormats === 0 || imgSrcs.length === 0
  checks.push(modernFormats)
  if (!modernFormats) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Unoptimized image formats', description: `${legacyFormats} image(s) use PNG/JPEG/BMP. Convert to WebP or AVIF for smaller file sizes.` })
  }

  // 10. Third-party script count
  const scriptSrcs = html.match(/<script[^>]+src=["']([^"']+)["']/gi) ?? []
  let thirdPartyCount = 0
  for (const tag of scriptSrcs) {
    const srcMatch = tag.match(/src=["'](https?:\/\/[^"']+)["']/i)
    if (srcMatch) {
      try {
        const scriptHost = new URL(srcMatch[1]).hostname
        if (scriptHost !== pageUrl.hostname) thirdPartyCount++
      } catch { /* skip malformed URLs */ }
    }
  }
  const fewThirdParty = thirdPartyCount <= 10
  checks.push(fewThirdParty)
  if (!fewThirdParty) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Too many third-party scripts', description: `${thirdPartyCount} third-party scripts detected. Each adds DNS lookups, connections, and execution time.` })
  }

  // 11. Image lazy loading
  const allImgs = html.match(/<img[^>]*>/gi) ?? []
  let missingLazy = 0
  for (const tag of allImgs) {
    if (!/loading=["']lazy["']/i.test(tag)) missingLazy++
  }
  const lazyPass = allImgs.length === 0 || missingLazy <= Math.ceil(allImgs.length * 0.3) // allow top 30% without lazy
  checks.push(lazyPass)
  if (!lazyPass) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Images missing lazy loading', description: `${missingLazy} of ${allImgs.length} images lack loading="lazy". Add it to below-fold images.` })
  }

  // 12. Images with width/height attributes
  const imgWithoutDims = (html.match(/<img(?![^>]*width)[^>]*>/gi) ?? []).length
  const dimsPass = imgWithoutDims === 0
  checks.push(dimsPass)
  if (!dimsPass) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Images without dimensions', description: `${imgWithoutDims} image(s) are missing width/height attributes, causing layout shifts.` })
  }

  // 13. Cache-Control header
  const cacheControl = headers['cache-control'] ?? ''
  const hasCaching = /max-age|s-maxage/i.test(cacheControl)
  checks.push(hasCaching)
  if (!cacheControl) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'No Cache-Control header', description: 'Add a Cache-Control header to enable browser caching of this page.' })
  } else if (!hasCaching) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'Cache-Control missing max-age', description: 'Cache-Control header is set but has no max-age or s-maxage directive.' })
  }

  // 14. CDN detection (info only — always passes)
  const cdnHeaders: Record<string, string> = {
    'cf-ray': 'Cloudflare',
    'x-vercel-id': 'Vercel',
    'x-amz-cf-id': 'AWS CloudFront',
    'x-fastly-request-id': 'Fastly',
  }
  let detectedCdn: string | null = null
  for (const [header, name] of Object.entries(cdnHeaders)) {
    if (headers[header]) { detectedCdn = name; break }
  }
  if (!detectedCdn && headers['server']?.toLowerCase().includes('cloudflare')) {
    detectedCdn = 'Cloudflare'
  }
  checks.push(true) // info check, always passes
  issues.push({
    pillar: 'performance',
    severity: 'pass',
    title: detectedCdn ? `CDN detected: ${detectedCdn}` : 'No CDN detected',
    description: detectedCdn
      ? `Content is served via ${detectedCdn}.`
      : 'No CDN detected. Consider using a CDN for faster global delivery.',
  })

  // 15. fetchpriority attribute usage
  const hasFetchPriority = /fetchpriority=["']high["']/i.test(html)
  checks.push(hasFetchPriority)
  if (!hasFetchPriority) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'No fetchpriority="high" usage', description: 'Add fetchpriority="high" to your LCP image or critical resource for faster loading.' })
  }

  // 16. Resource hints (preconnect/preload for third-party origins)
  const hasPreconnect = /<link[^>]+rel=["']preconnect["']/i.test(html)
  const hasPreload = /<link[^>]+rel=["']preload["']/i.test(html)
  const hasResourceHints = hasPreconnect || hasPreload
  checks.push(hasResourceHints)
  if (!hasResourceHints) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'No resource hints', description: 'Add <link rel="preconnect"> or <link rel="preload"> for critical third-party origins.' })
  }

  // 17. Carbon footprint (estimate from HTML transfer size)
  // ~0.81g CO2 per uncached MB transferred (Sustainable Web Design model v4)
  const transferSizeMb = html.length / (1024 * 1024)
  const carbonGrams = parseFloat((transferSizeMb * 0.81).toFixed(3))
  const carbonPass = carbonGrams <= 0.5
  checks.push(carbonPass)
  if (!carbonPass) {
    issues.push({ pillar: 'performance', severity: 'warning', title: 'High carbon footprint', description: `Estimated ${carbonGrams}g CO2 per pageview. Reduce page weight to lower environmental impact.` })
  } else {
    issues.push({ pillar: 'performance', severity: 'pass', title: 'Low carbon footprint', description: `Estimated ${carbonGrams}g CO2 per pageview — efficient.` })
  }

  // 18. Green hosting (info only — always passes)
  checks.push(true)
  if (greenHosting === true) {
    issues.push({ pillar: 'performance', severity: 'pass', title: 'Green hosting detected', description: 'This site is hosted on green energy according to The Green Web Foundation.' })
  } else if (greenHosting === false) {
    issues.push({ pillar: 'performance', severity: 'pass', title: 'Not green hosted', description: 'Hosting provider not listed in The Green Web Foundation database. Consider switching to a green host.' })
  } else {
    issues.push({ pillar: 'performance', severity: 'pass', title: 'Green hosting unknown', description: 'Could not determine green hosting status.' })
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
