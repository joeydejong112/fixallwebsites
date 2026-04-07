'use node'

import { action } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import * as nodeDns from 'dns/promises'
import * as nodeTls from 'tls'
import { runSecurityChecks } from './checks/security'
import { runPerformanceChecks } from './checks/performance'
import { runSeoChecks } from './checks/seo'
import { runAccessibilityChecks } from './checks/accessibility'
import { runDnsChecks } from './checks/dns'
import { runTrustChecks } from './checks/trust'
import { detectTechStack } from './checks/techDetect'
import { runAiChecks } from './checks/ai'
import type { TlsInfo, CwvData, DnsData } from './checks/types'

const DKIM_SELECTORS = ['google', 'default', 'selector1', 'selector2', 'k1', 'ses', 'mandrill', 'dkim']

async function headStatus(url: string): Promise<number | null> {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'manual' })
    return r.status
  } catch { return null }
}

async function fetchTlsInfo(hostname: string): Promise<TlsInfo> {
  return new Promise((resolve) => {
    const socket = nodeTls.connect({ host: hostname, port: 443, servername: hostname }, () => {
      const cert = socket.getPeerCertificate()
      const protocol = socket.getProtocol() ?? null
      socket.destroy()
      resolve({ validTo: cert?.valid_to ?? null, protocol, issuer: (cert?.issuer as { O?: string })?.O ?? null })
    })
    socket.setTimeout(5000)
    socket.on('error', () => resolve({ validTo: null, protocol: null, issuer: null }))
    socket.on('timeout', () => { socket.destroy(); resolve({ validTo: null, protocol: null, issuer: null }) })
  })
}

async function fetchDnsData(domain: string): Promise<DnsData> {
  const t0 = Date.now()
  const aResult = await nodeDns.resolve4(domain).catch(() => [] as string[])
  const resolveTimeMs = Date.now() - t0

  const results = await Promise.allSettled([
    nodeDns.resolve6(domain),
    nodeDns.resolveMx(domain),
    nodeDns.resolveTxt(domain),
    nodeDns.resolveTxt('_dmarc.' + domain),
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A&do=1`, { signal: AbortSignal.timeout(4000) }).then(r => r.json()),
    ...DKIM_SELECTORS.map(sel => nodeDns.resolveTxt(`${sel}._domainkey.${domain}`)),
  ])

  const [aaaaR, mxR, txtR, dmarcR, dnssecR, ...dkimRs] = results
  const txt = (txtR.status === 'fulfilled' ? (txtR.value as string[][]).flat() : [])
  const dmarc = (dmarcR.status === 'fulfilled' ? (dmarcR.value as string[][]).flat() : [])

  return {
    hasA: aResult.length > 0,
    hasAAAA: aaaaR.status === 'fulfilled' && (aaaaR.value as string[]).length > 0,
    mx: mxR.status === 'fulfilled' ? (mxR.value as { exchange: string }[]).map(r => r.exchange) : [],
    spf: txt.find(r => r.startsWith('v=spf1')) ?? null,
    dmarc: dmarc.find(r => r.startsWith('v=DMARC1')) ?? null,
    dkimFound: DKIM_SELECTORS.filter((_, i) => dkimRs[i]?.status === 'fulfilled'),
    dnssecValid: dnssecR.status === 'fulfilled' ? (dnssecR.value as Record<string, unknown>).AD === true : null,
    resolveTimeMs,
  }
}

async function fetchCwv(url: string): Promise<CwvData> {
  const key = process.env.GOOGLE_PSI_API_KEY
  if (!key) return { lcp: null, inp: null, cls: null, available: false }
  try {
    const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${key}`, { signal: AbortSignal.timeout(10000) })
    const d = await r.json() as Record<string, unknown>
    const m = ((d?.loadingExperience as Record<string, unknown>)?.metrics ?? {}) as Record<string, { percentile: number }>
    if (!Object.keys(m).length) return { lcp: null, inp: null, cls: null, available: false }
    return { lcp: m.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null, inp: m.INTERACTION_TO_NEXT_PAINT?.percentile ?? null, cls: m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? null, available: true }
  } catch { return { lcp: null, inp: null, cls: null, available: false } }
}

async function fetchDomainExpiry(domain: string): Promise<string | null> {
  try {
    const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(5000) })
    const d = await r.json() as Record<string, unknown>
    const events = (d?.events as Array<{ eventAction: string; eventDate: string }>) ?? []
    return events.find(e => e.eventAction === 'expiration')?.eventDate ?? null
  } catch { return null }
}

async function fetchGreenHosting(domain: string): Promise<boolean | null> {
  try {
    const r = await fetch(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(5000) })
    const d = await r.json() as Record<string, unknown>
    return d?.green === true
  } catch { return null }
}

export const runScan = action({
  args: { scanId: v.id('scans'), url: v.string() },
  handler: async (ctx, { scanId, url }) => {
    const scan = await ctx.runQuery(internal.scans.getScanInternal, { scanId })
    const userId = scan?.userId ?? ''

    await ctx.runMutation(internal.scans.updateScan, { scanId, status: 'running' })

    try {
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 15000)
      const t0 = Date.now()
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ScanPulse/1.0' } })
      const ttfb = Date.now() - t0
      clearTimeout(fetchTimeout)

      const html = await res.text()
      const headers = Object.fromEntries(res.headers.entries())
      const parsed = new URL(url)
      const { hostname, origin } = parsed
      const domain = hostname.replace(/^www\./, '')
      const wwwVariant = hostname.startsWith('www.')
        ? `${parsed.protocol}//${hostname.slice(4)}${parsed.pathname}`
        : `${parsed.protocol}//www.${hostname}${parsed.pathname}`

      const [cwvR, tlsR, dnsR, rdapR, greenR, envR, gitR, phpR, robotsR, sitemapR, gpcR, notFoundR, wwwR, faviconR, llmsTxtR, llmsWellKnownR, llmsFullTxtR] = await Promise.allSettled([
        fetchCwv(url),
        url.startsWith('https') ? fetchTlsInfo(hostname) : Promise.resolve<TlsInfo>({ validTo: null, protocol: null, issuer: null }),
        fetchDnsData(domain),
        fetchDomainExpiry(domain),
        fetchGreenHosting(domain),
        headStatus(origin + '/.env'),
        headStatus(origin + '/.git/HEAD'),
        headStatus(origin + '/phpinfo.php'),
        fetch(origin + '/robots.txt', { signal: AbortSignal.timeout(5000) }).then(r => r.text().then(b => ({ status: r.status, body: b }))),
        headStatus(origin + '/sitemap.xml'),
        headStatus(origin + '/.well-known/gpc.json'),
        fetch(origin + '/this-path-does-not-exist-scanpulse-probe', { signal: AbortSignal.timeout(5000) }).then(r => r.text().then(b => ({ status: r.status, body: b }))),
        fetch(wwwVariant, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'manual' }).then(r => r.status >= 301 && r.status <= 308),
        headStatus(origin + '/favicon.ico'),
        headStatus(origin + '/llms.txt'),
        headStatus(origin + '/.well-known/llms.txt'),
        headStatus(origin + '/llms-full.txt'),
      ])

      const cwvData = cwvR.status === 'fulfilled' ? cwvR.value as CwvData : null
      const tlsInfo = tlsR.status === 'fulfilled' ? tlsR.value as TlsInfo : null
      const dnsData = dnsR.status === 'fulfilled' ? dnsR.value as DnsData : null
      const domainExpiry = rdapR.status === 'fulfilled' ? rdapR.value as string | null : null
      const greenHosting = greenR.status === 'fulfilled' ? greenR.value as boolean | null : null
      const gpcResult = gpcR.status === 'fulfilled' && gpcR.value === 200
      const custom404Result = notFoundR.status === 'fulfilled'
        ? notFoundR.value as { status: number; body: string }
        : { status: 0, body: '' }
      const wwwRedirects = wwwR.status === 'fulfilled' ? wwwR.value as boolean : null
      const robotsResult = robotsR.status === 'fulfilled' ? robotsR.value as { status: number; body: string } : null
      const robotsTxtOk = robotsResult?.status === 200
      const robotsTxtContent = robotsResult?.body ?? ''
      const sitemapOk = sitemapR.status === 'fulfilled' && sitemapR.value === 200
      const faviconOk = faviconR.status === 'fulfilled' && (faviconR.value === 200 || faviconR.value === 304)
      const exposureResults = [
        { path: '/.env', status: envR.status === 'fulfilled' ? envR.value as number | null : null },
        { path: '/.git/HEAD', status: gitR.status === 'fulfilled' ? gitR.value as number | null : null },
        { path: '/phpinfo.php', status: phpR.status === 'fulfilled' ? phpR.value as number | null : null },
      ]

      const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? []
      const jsonLd = jsonLdBlocks.join('\n')

      const llmsTxtStatus = llmsTxtR.status === 'fulfilled' ? llmsTxtR.value as number | null : null
      const llmsWellKnownStatus = llmsWellKnownR.status === 'fulfilled' ? llmsWellKnownR.value as number | null : null
      const llmsFullTxtStatus = llmsFullTxtR.status === 'fulfilled' ? llmsFullTxtR.value as number | null : null
      const effectiveLlmsTxtStatus = llmsTxtStatus === 200 || llmsWellKnownStatus === 200 ? 200 : null

      const security = runSecurityChecks(headers, html, url, tlsInfo, exposureResults)
      const performance = runPerformanceChecks(headers, html, url, ttfb, cwvData, greenHosting)
      const seo = runSeoChecks(headers, html, url, { robotsTxtOk, sitemapOk, wwwRedirects, httpStatus: res.status, faviconOk })
      const accessibility = runAccessibilityChecks(html)
      const ai = runAiChecks(html, headers, robotsTxtContent, jsonLd, effectiveLlmsTxtStatus, llmsFullTxtStatus)
      const dns = dnsData ? runDnsChecks(dnsData, domainExpiry) : null
      const trust = runTrustChecks(html, headers, gpcResult, custom404Result)
      const detectedTech = detectTechStack(headers, html)

      const carbonGrams = parseFloat((html.length / (1024 * 1024) * 0.81).toFixed(3))
      const overallScore = Math.round((security.score + performance.score + seo.score + accessibility.score + ai.score) / 5)
      const allIssues = [...security.issues, ...performance.issues, ...seo.issues, ...accessibility.issues, ...ai.issues, ...(dns?.issues ?? []), ...trust.issues]

      await ctx.runMutation(internal.scans.updateScan, {
        scanId,
        status: 'done',
        securityScore: security.score,
        performanceScore: performance.score,
        seoScore: seo.score,
        accessibilityScore: accessibility.score,
        aiScore: ai.score,
        dnsScore: dns?.score,
        trustScore: trust.score,
        overallScore,
        issues: allIssues,
        detectedTech,
        carbonGrams,
        greenHosting: greenHosting ?? undefined,
        domainExpiry: domainExpiry ?? undefined,
        certExpiry: tlsInfo?.validTo ?? undefined,
      })

      if (userId) {
        await ctx.runMutation(internal.scoreHistory.recordSnapshot, {
          userId,
          url,
          scanId,
          ts: Date.now(),
          overallScore,
          securityScore: security.score,
          performanceScore: performance.score,
          seoScore: seo.score,
          accessibilityScore: accessibility.score,
          aiScore: ai.score,
        })
      }
    } catch (err) {
      try {
        await ctx.runMutation(internal.scans.updateScan, {
          scanId,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error occurred',
        })
      } catch {
        console.error('Failed to mark scan as errored:', scanId)
      }
    }
  },
})
