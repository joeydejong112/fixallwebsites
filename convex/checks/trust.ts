import type { ScanIssue, PillarResult } from './types'

export function runTrustChecks(
  html: string,
  headers: Record<string, string>,
  gpcResult: boolean,
  custom404Result: { status: number; body: string },
): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. Privacy policy link — href or anchor text contains "privacy"
  const privacyLink = /<a[^>]+href=["'][^"']*privacy[^"']*["'][^>]*>|<a[^>]*>[\s\S]*?privacy[\s\S]*?<\/a>/i
  const hasPrivacy = privacyLink.test(html)
  checks.push(hasPrivacy)
  if (!hasPrivacy) {
    issues.push({
      pillar: 'trust',
      severity: 'critical',
      title: 'No privacy policy link found',
      description: 'A privacy policy is legally required in most jurisdictions (GDPR, CCPA). Add a visible link to your privacy policy page.',
    })
  }

  // 2. Terms of service link — href or anchor text contains "terms"
  const termsLink = /<a[^>]+href=["'][^"']*terms[^"']*["'][^>]*>|<a[^>]*>[\s\S]*?terms[\s\S]*?<\/a>/i
  const hasTerms = termsLink.test(html)
  checks.push(hasTerms)
  if (!hasTerms) {
    issues.push({
      pillar: 'trust',
      severity: 'warning',
      title: 'No terms of service link found',
      description: 'Add a link to your terms of service. It sets user expectations and limits legal liability.',
    })
  }

  // 3. Cookie consent mechanism
  const consentSignatures = [
    'onetrust',
    'cookiebot',
    'cookieyes',
    'osano',
    'civic',
    'cookieconsent',
    'cookie-consent',
    'gdpr-cookie',
    'tarteaucitron',
    'usercentrics',
  ]
  const lowerHtml = html.toLowerCase()
  const hasCookieConsent = consentSignatures.some(sig => lowerHtml.includes(sig))
  checks.push(hasCookieConsent)
  if (!hasCookieConsent) {
    // Only warn if cookies are actually being set
    const setsCookies = Object.keys(headers).some(h => h.toLowerCase() === 'set-cookie')
    issues.push({
      pillar: 'trust',
      severity: setsCookies ? 'warning' : 'warning',
      title: 'No cookie consent mechanism detected',
      description: 'No known cookie consent manager (OneTrust, Cookiebot, CookieYes, Osano, etc.) was detected. GDPR and ePrivacy Directive require informed consent before setting non-essential cookies.',
    })
  }

  // 4. Contact information — tel:, mailto:, or /contact link
  const hasContact =
    /href=["']tel:/i.test(html) ||
    /href=["']mailto:/i.test(html) ||
    /href=["'][^"']*\/contact[^"']*["']/i.test(html)
  checks.push(hasContact)
  if (!hasContact) {
    issues.push({
      pillar: 'trust',
      severity: 'warning',
      title: 'No contact information found',
      description: 'No phone number, email address, or contact page link was detected. Contact information builds user trust and may be legally required.',
    })
  }

  // 5. GPC support — /.well-known/gpc.json returned 200
  checks.push(gpcResult)
  if (!gpcResult) {
    issues.push({
      pillar: 'trust',
      severity: 'warning',
      title: 'GPC (Global Privacy Control) not supported',
      description: 'No /.well-known/gpc.json file found. GPC support signals respect for user opt-out preferences and is required by California law (CCPA) for covered businesses.',
    })
  }

  // 6. Custom 404 page — branded content vs bare server error
  const is404Branded = custom404Result.status !== 404 ||
    (custom404Result.body.length > 500 &&
      !/^(?:<html>)?\s*(?:404|not found|error)/i.test(custom404Result.body.trim()))
  checks.push(is404Branded)
  if (!is404Branded) {
    issues.push({
      pillar: 'trust',
      severity: 'warning',
      title: 'No custom 404 page',
      description: 'Missing pages return a bare server error instead of a branded page. A custom 404 page improves user experience and keeps visitors on your site.',
    })
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
