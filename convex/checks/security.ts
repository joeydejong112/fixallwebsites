import type { ScanIssue, PillarResult, TlsInfo } from './types'

interface ExposureResult {
  path: string
  status: number | null // null if fetch failed
}

export function runSecurityChecks(
  headers: Record<string, string>,
  html: string,
  url: string,
  tlsInfo: TlsInfo | null,
  exposureResults: ExposureResult[]
): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. HTTPS enforced
  const isHttps = url.startsWith('https://')
  checks.push(isHttps)
  if (!isHttps) {
    issues.push({ pillar: 'security', severity: 'critical', title: 'No HTTPS', description: 'Site is not served over HTTPS. All traffic is unencrypted.' })
  }

  // 2. HSTS header present
  const hsts = headers['strict-transport-security'] ?? ''
  const hasHsts = !!hsts
  checks.push(hasHsts)
  if (!hasHsts) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing HSTS header', description: 'Add Strict-Transport-Security to enforce HTTPS connections.' })
  }

  // 3. HSTS quality (max-age ≥ 15768000, includeSubDomains)
  let hstsQuality = false
  if (hasHsts) {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i)
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0
    const hasSubdomains = /includeSubDomains/i.test(hsts)
    hstsQuality = maxAge >= 15768000 && hasSubdomains
  }
  checks.push(hstsQuality)
  if (hasHsts && !hstsQuality) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Weak HSTS configuration', description: 'HSTS max-age should be ≥ 6 months (15768000s) and include includeSubDomains.' })
  }

  // 4. CSP header present
  const csp = headers['content-security-policy'] ?? ''
  const hasCsp = !!csp
  checks.push(hasCsp)
  if (!hasCsp) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing Content-Security-Policy', description: 'CSP headers help prevent XSS and data injection attacks.' })
  }

  // 5. CSP quality (no unsafe-inline/unsafe-eval, no wildcard sources)
  let cspQuality = false
  if (hasCsp) {
    const hasUnsafe = /unsafe-inline|unsafe-eval/i.test(csp)
    const hasWildcard = /\s\*[\s;]|;\s*\*\s*;|;\s*\*$/i.test(csp) || / \* /i.test(csp)
    cspQuality = !hasUnsafe && !hasWildcard
  }
  checks.push(cspQuality)
  if (hasCsp && !cspQuality) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Weak CSP configuration', description: 'CSP contains unsafe-inline, unsafe-eval, or wildcard sources. Tighten directives.' })
  }

  // 6. X-Frame-Options or CSP frame-ancestors
  const hasFrameProtection = !!headers['x-frame-options'] || csp.includes('frame-ancestors')
  checks.push(hasFrameProtection)
  if (!hasFrameProtection) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing clickjacking protection', description: 'Add X-Frame-Options or CSP frame-ancestors to prevent clickjacking.' })
  }

  // 7. X-Content-Type-Options: nosniff
  const hasNoSniff = !!headers['x-content-type-options']
  checks.push(hasNoSniff)
  if (!hasNoSniff) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing X-Content-Type-Options', description: 'Add "nosniff" to prevent MIME-type sniffing attacks.' })
  }

  // 8. Referrer-Policy present and strict
  const referrerPolicy = headers['referrer-policy'] ?? ''
  const strictReferrerValues = ['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin']
  const hasStrictReferrer = strictReferrerValues.includes(referrerPolicy.trim().toLowerCase())
  checks.push(hasStrictReferrer)
  if (!referrerPolicy) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing Referrer-Policy', description: 'Add a Referrer-Policy header to control information leakage.' })
  } else if (!hasStrictReferrer) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Weak Referrer-Policy', description: `Referrer-Policy "${referrerPolicy}" is too permissive. Use strict-origin-when-cross-origin or stricter.` })
  }

  // 9. Permissions-Policy present
  const hasPermissionsPolicy = !!headers['permissions-policy']
  checks.push(hasPermissionsPolicy)
  if (!hasPermissionsPolicy) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing Permissions-Policy', description: 'Add Permissions-Policy to restrict browser feature access (camera, microphone, geolocation, etc.).' })
  }

  // 10. COEP header present
  const hasCoep = !!headers['cross-origin-embedder-policy']
  checks.push(hasCoep)
  if (!hasCoep) {
    issues.push({ pillar: 'security', severity: 'pass', title: 'No COEP header', description: 'Cross-Origin-Embedder-Policy not set. Required for SharedArrayBuffer and high-resolution timers.' })
  }

  // 11. COOP header present
  const hasCoop = !!headers['cross-origin-opener-policy']
  checks.push(hasCoop)
  if (!hasCoop) {
    issues.push({ pillar: 'security', severity: 'pass', title: 'No COOP header', description: 'Cross-Origin-Opener-Policy not set. Recommended for process isolation.' })
  }

  // 12. Reporting-Endpoints configured (when CSP exists)
  const hasReporting = !!headers['reporting-endpoints'] || !!headers['report-to']
  const reportingPass = !hasCsp || hasReporting
  checks.push(reportingPass)
  if (hasCsp && !hasReporting) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'No Reporting-Endpoints configured', description: 'CSP is set but no Reporting-Endpoints header found. You won\'t receive violation reports.' })
  }

  // 13. Trusted Types in CSP
  const hasTrustedTypes = csp.includes('require-trusted-types-for')
  checks.push(hasTrustedTypes)
  if (!hasTrustedTypes) {
    issues.push({ pillar: 'security', severity: 'pass', title: 'No Trusted Types', description: 'CSP does not enforce Trusted Types. This is an advanced XSS mitigation.' })
  }

  // 14. Server header not leaking version info
  const server = headers['server'] ?? ''
  const leaksVersion = /\d+\.\d+/i.test(server)
  checks.push(!leaksVersion)
  if (leaksVersion) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Server header leaks version', description: `Server header "${server}" reveals version info. Remove or obscure it.` })
  }

  // 15. X-Powered-By absent
  const hasPoweredBy = !!headers['x-powered-by']
  checks.push(!hasPoweredBy)
  if (hasPoweredBy) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'X-Powered-By header present', description: `X-Powered-By: "${headers['x-powered-by']}" reveals server technology. Remove it.` })
  }

  // 16. Cookie flags audit
  const setCookies = headers['set-cookie'] ?? ''
  let cookiePass = true
  if (setCookies) {
    const cookies = setCookies.split(/,(?=\s*\w+=)/)
    for (const cookie of cookies) {
      const lower = cookie.toLowerCase()
      if (!lower.includes('secure')) cookiePass = false
      if (!lower.includes('httponly')) cookiePass = false
      if (!lower.includes('samesite')) cookiePass = false
    }
  }
  checks.push(cookiePass)
  if (!cookiePass) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Insecure cookie flags', description: 'Some cookies are missing Secure, HttpOnly, or SameSite flags.' })
  }

  // 17. Mixed content — HTTP resources on HTTPS page
  let hasMixedContent = false
  if (isHttps) {
    const httpResources = html.match(/(?:src|href|action)=["']http:\/\//gi)
    hasMixedContent = !!httpResources && httpResources.length > 0
  }
  checks.push(!hasMixedContent)
  if (hasMixedContent) {
    issues.push({ pillar: 'security', severity: 'critical', title: 'Mixed content detected', description: 'HTTPS page loads resources over HTTP. Browsers may block these requests.' })
  }

  // 18. SRI on external scripts/stylesheets
  const externalScripts = html.match(/<script[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi) ?? []
  const externalStyles = html.match(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi) ?? []
  const externalResources = [...externalScripts, ...externalStyles]
  let sriMissing = 0
  for (const tag of externalResources) {
    if (!/integrity=/i.test(tag)) sriMissing++
  }
  const sriPass = sriMissing === 0
  checks.push(sriPass)
  if (!sriPass) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Missing Subresource Integrity', description: `${sriMissing} external script/stylesheet tag(s) lack SRI integrity attributes.` })
  }

  // 19. CORS misconfiguration
  const corsOrigin = headers['access-control-allow-origin'] ?? ''
  const corsWildcard = corsOrigin.trim() === '*'
  checks.push(!corsWildcard)
  if (corsWildcard) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'CORS allows all origins', description: 'Access-Control-Allow-Origin is set to "*". Restrict to trusted domains.' })
  }

  // 20. Sensitive file exposure
  let exposureCritical = false
  for (const result of exposureResults) {
    if (result.status === 200) {
      exposureCritical = true
      issues.push({ pillar: 'security', severity: 'critical', title: `Sensitive file exposed: ${result.path}`, description: `${result.path} returned HTTP 200. This file should not be publicly accessible.` })
    }
  }
  checks.push(!exposureCritical)

  // 21. Redirect chain (passed via exposureResults with path '__redirects')
  // This is evaluated by the orchestrator and passed as a simple count;
  // for now we check if redirect info is in exposure results
  // The orchestrator will add { path: '__redirect_hops', status: hopCount }
  const redirectEntry = exposureResults.find(r => r.path === '__redirect_hops')
  const redirectHops = redirectEntry?.status ?? 0
  const redirectPass = redirectHops <= 2
  checks.push(redirectPass)
  if (!redirectPass) {
    issues.push({ pillar: 'security', severity: 'warning', title: 'Long redirect chain', description: `${redirectHops} redirects detected before reaching the final URL. Keep redirect chains to ≤ 2 hops.` })
  }

  // TLS checks (bonus — graceful skip if tlsInfo is null)
  if (tlsInfo) {
    // Cert expiry
    if (tlsInfo.validTo) {
      const daysUntilExpiry = Math.floor((new Date(tlsInfo.validTo).getTime() - Date.now()) / 86400000)
      if (daysUntilExpiry < 7) {
        checks.push(false)
        issues.push({ pillar: 'security', severity: 'critical', title: 'SSL certificate expiring soon', description: `Certificate expires in ${daysUntilExpiry} day(s). Renew immediately.` })
      } else if (daysUntilExpiry < 30) {
        checks.push(false)
        issues.push({ pillar: 'security', severity: 'warning', title: 'SSL certificate expiring', description: `Certificate expires in ${daysUntilExpiry} days. Schedule renewal.` })
      } else {
        checks.push(true)
        issues.push({ pillar: 'security', severity: 'pass', title: 'SSL certificate valid', description: `Certificate valid for ${daysUntilExpiry} more days.` })
      }
    }

    // TLS version
    if (tlsInfo.protocol) {
      const isOldTls = /TLSv1\.[01]$/i.test(tlsInfo.protocol)
      const isTls13 = /TLSv1\.3/i.test(tlsInfo.protocol)
      checks.push(!isOldTls)
      if (isOldTls) {
        issues.push({ pillar: 'security', severity: 'critical', title: 'Outdated TLS version', description: `Server uses ${tlsInfo.protocol}. TLS 1.0/1.1 are deprecated — upgrade to TLS 1.2+.` })
      } else if (isTls13) {
        issues.push({ pillar: 'security', severity: 'pass', title: 'TLS 1.3 supported', description: 'Server uses TLS 1.3 — the latest and most secure version.' })
      }
    }
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
