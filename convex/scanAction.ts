'use node'

import { action } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

interface ScanIssue {
  pillar: string
  severity: 'critical' | 'warning' | 'pass'
  title: string
  description: string
}

export const runScan = action({
  args: { scanId: v.id('scans'), url: v.string() },
  handler: async (ctx, { scanId, url }) => {
    await ctx.runMutation(internal.scans.updateScan, { scanId, status: 'running' })

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const start = Date.now()
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ScanPulse/1.0' },
      })
      const ttfb = Date.now() - start
      clearTimeout(timeout)

      const html = await res.text()
      const headers = Object.fromEntries(res.headers.entries())
      const issues: ScanIssue[] = []

      // ── Security ─────────────────────────────────────────────
      const isHttps = url.startsWith('https://')
      if (!isHttps) {
        issues.push({ pillar: 'security', severity: 'critical', title: 'No HTTPS', description: 'Site is not served over HTTPS. All traffic is unencrypted.' })
      }
      if (!headers['strict-transport-security']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing HSTS header', description: 'Add Strict-Transport-Security to enforce HTTPS connections.' })
      }
      if (!headers['content-security-policy']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing Content-Security-Policy', description: 'CSP headers help prevent XSS and data injection attacks.' })
      }
      if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing X-Frame-Options', description: 'Site may be vulnerable to clickjacking attacks.' })
      }
      if (!headers['x-content-type-options']) {
        issues.push({ pillar: 'security', severity: 'warning', title: 'Missing X-Content-Type-Options', description: 'Add "nosniff" to prevent MIME-type sniffing attacks.' })
      }
      const secChecks = [isHttps, !!headers['strict-transport-security'], !!headers['content-security-policy'], !!headers['x-frame-options'] || headers['content-security-policy']?.includes('frame-ancestors'), !!headers['x-content-type-options']]
      const securityScore = Math.round((secChecks.filter(Boolean).length / secChecks.length) * 100)

      // ── Performance ───────────────────────────────────────────
      if (ttfb > 800) {
        issues.push({ pillar: 'performance', severity: 'critical', title: 'Slow TTFB', description: `Time to first byte was ${ttfb}ms. Aim for under 200ms for optimal performance.` })
      } else if (ttfb > 400) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'High TTFB', description: `TTFB is ${ttfb}ms. Consider server-side caching to improve response times.` })
      } else {
        issues.push({ pillar: 'performance', severity: 'pass', title: 'Good TTFB', description: `Excellent! TTFB is ${ttfb}ms.` })
      }
      const encoding = headers['content-encoding'] ?? ''
      const hasCompression = encoding.includes('gzip') || encoding.includes('br')
      if (!hasCompression) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'No compression', description: 'Enable gzip or Brotli compression to reduce page transfer size.' })
      }
      const imgWithoutDims = (html.match(/<img(?![^>]*width)[^>]*>/gi) ?? []).length
      if (imgWithoutDims > 0) {
        issues.push({ pillar: 'performance', severity: 'warning', title: 'Images without dimensions', description: `${imgWithoutDims} image(s) are missing width/height attributes, causing layout shifts.` })
      }
      const perfChecks = [ttfb <= 400, hasCompression, imgWithoutDims === 0]
      const performanceScore = Math.round((perfChecks.filter(Boolean).length / perfChecks.length) * 100)

      // ── SEO ───────────────────────────────────────────────────
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (!titleMatch) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing <title> tag', description: 'Every page needs a unique, descriptive title tag for search engines.' })
      } else if (titleMatch[1].length < 10 || titleMatch[1].length > 60) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Title length suboptimal', description: `Title is ${titleMatch[1].length} chars. Aim for 30–60 characters for best results.` })
      } else {
        issues.push({ pillar: 'seo', severity: 'pass', title: 'Good title tag', description: `Title length is ${titleMatch[1].length} characters — well optimised.` })
      }
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      if (!descMatch) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing meta description', description: 'Add a meta description to improve click-through rates from search results.' })
      }
      const h1Count = (html.match(/<h1[^>]*>/gi) ?? []).length
      if (h1Count === 0) {
        issues.push({ pillar: 'seo', severity: 'critical', title: 'Missing H1 tag', description: 'Every page should have exactly one H1 heading.' })
      } else if (h1Count > 1) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Multiple H1 tags', description: `Found ${h1Count} H1 tags. Use only one per page for clear hierarchy.` })
      } else {
        issues.push({ pillar: 'seo', severity: 'pass', title: 'H1 tag present', description: 'Page has exactly one H1 heading — good structure.' })
      }
      const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html)
      if (!hasCanonical) {
        issues.push({ pillar: 'seo', severity: 'warning', title: 'Missing canonical URL', description: 'Add a canonical link element to prevent duplicate content issues.' })
      }
      const seoChecks = [!!titleMatch && titleMatch[1].length >= 10 && titleMatch[1].length <= 60, !!descMatch, h1Count === 1, hasCanonical]
      const seoScore = Math.round((seoChecks.filter(Boolean).length / seoChecks.length) * 100)

      const overallScore = Math.round((securityScore + performanceScore + seoScore) / 3)

      await ctx.runMutation(internal.scans.updateScan, {
        scanId,
        status: 'done',
        securityScore,
        performanceScore,
        seoScore,
        overallScore,
        issues,
      })
    }
    catch (err) {
      try {
        await ctx.runMutation(internal.scans.updateScan, {
          scanId,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error occurred',
        })
      } catch {
        // Error mutation failed — scan stays in 'running' but there's nothing more we can do
        console.error('Failed to mark scan as errored:', scanId)
      }
    }
  },
})
