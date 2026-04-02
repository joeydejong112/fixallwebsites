import type { ScanIssue, PillarResult, DnsData } from './types'

export function runDnsChecks(dnsData: DnsData, domainExpiry: string | null): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. SPF record — present and not too permissive
  if (dnsData.spf === null) {
    checks.push(false)
    issues.push({
      pillar: 'dns',
      severity: 'critical',
      title: 'No SPF record found',
      description: 'Add a DNS TXT record "v=spf1 include:... -all" to your domain. Without SPF, spammers can forge email from your domain.',
    })
  } else if (dnsData.spf.includes('+all')) {
    checks.push(false)
    issues.push({
      pillar: 'dns',
      severity: 'warning',
      title: 'SPF record too permissive',
      description: 'Your SPF record uses "+all" which allows any server to send mail as your domain. Replace with "-all" for strict enforcement.',
    })
  } else {
    checks.push(true)
  }

  // 2. DMARC — present and enforcing policy
  if (dnsData.dmarc === null) {
    checks.push(false)
    issues.push({
      pillar: 'dns',
      severity: 'critical',
      title: 'No DMARC record found',
      description: 'Add a TXT record at _dmarc.yourdomain.com: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com" to prevent email spoofing.',
    })
  } else {
    const policyMatch = dnsData.dmarc.match(/p=([a-z]+)/i)
    const policy = policyMatch ? policyMatch[1].toLowerCase() : 'none'
    if (policy === 'none') {
      checks.push(false)
      issues.push({
        pillar: 'dns',
        severity: 'warning',
        title: 'DMARC policy not enforcing',
        description: 'Your DMARC policy is "p=none" (monitor only). Change to p=quarantine or p=reject to actively block spoofed emails.',
      })
    } else {
      checks.push(true)
    }
  }

  // 3. DKIM — at least one selector resolved
  const hasDkim = dnsData.dkimFound.length > 0
  checks.push(hasDkim)
  if (!hasDkim) {
    issues.push({
      pillar: 'dns',
      severity: 'warning',
      title: 'No DKIM record detected',
      description: 'No DKIM TXT records were found for common selectors (google, default, selector1, selector2, k1, ses, mandrill, dkim). Configure DKIM signing with your email provider.',
    })
  }

  // 4. MX records — at least one required
  const hasMx = dnsData.mx.length > 0
  checks.push(hasMx)
  if (!hasMx) {
    issues.push({
      pillar: 'dns',
      severity: 'critical',
      title: 'No MX records found',
      description: 'No mail exchange records found. This domain cannot receive email. Add MX records pointing to your mail provider.',
    })
  }

  // 5. Domain expiry — warn <30d, critical <7d (skip if RDAP unavailable)
  if (domainExpiry !== null) {
    const expiryDate = new Date(domainExpiry)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000)
    if (daysUntilExpiry <= 7) {
      checks.push(false)
      issues.push({
        pillar: 'dns',
        severity: 'critical',
        title: 'Domain expiring very soon',
        description: `Domain expires in ${daysUntilExpiry} day(s). Renew immediately to prevent service disruption.`,
      })
    } else if (daysUntilExpiry <= 30) {
      checks.push(false)
      issues.push({
        pillar: 'dns',
        severity: 'warning',
        title: 'Domain expiring soon',
        description: `Domain expires in ${daysUntilExpiry} days. Renew before it lapses to avoid downtime.`,
      })
    } else {
      checks.push(true)
    }
  }

  // 6. DNSSEC — skip check if probe failed (null)
  if (dnsData.dnssecValid !== null) {
    checks.push(dnsData.dnssecValid)
    if (!dnsData.dnssecValid) {
      issues.push({
        pillar: 'dns',
        severity: 'warning',
        title: 'DNSSEC not enabled',
        description: 'DNSSEC cryptographically signs DNS records, preventing DNS spoofing and cache poisoning. Enable it in your domain registrar.',
      })
    }
  }

  // 7. IPv6 support — AAAA record present
  checks.push(dnsData.hasAAAA)
  if (!dnsData.hasAAAA) {
    issues.push({
      pillar: 'dns',
      severity: 'warning',
      title: 'No IPv6 support (AAAA)',
      description: 'No AAAA record found. IPv6 improves performance on modern networks and future-proofs your infrastructure.',
    })
  }

  // 8. DNS response time — warn >300ms, critical >600ms
  const ms = dnsData.resolveTimeMs
  if (ms > 600) {
    checks.push(false)
    issues.push({
      pillar: 'dns',
      severity: 'critical',
      title: 'Very slow DNS response',
      description: `DNS resolved in ${ms}ms (critical >600ms). Slow DNS delays every visitor. Switch to a faster DNS provider or enable anycast.`,
    })
  } else if (ms > 300) {
    checks.push(false)
    issues.push({
      pillar: 'dns',
      severity: 'warning',
      title: 'Slow DNS response',
      description: `DNS resolved in ${ms}ms (warning >300ms). Consider a faster authoritative DNS provider for better global reach.`,
    })
  } else {
    checks.push(true)
  }

  const passing = checks.filter(Boolean).length
  const score = checks.length > 0 ? Math.round((passing / checks.length) * 100) : 100

  return { score, issues }
}
