/**
 * Shared types for all scan check modules.
 * Each pillar module returns a PillarResult; the orchestrator collects them.
 */

export interface ScanIssue {
  pillar: string
  severity: 'critical' | 'warning' | 'pass'
  title: string
  description: string
}

export interface PillarResult {
  score: number
  issues: ScanIssue[]
}

export interface TlsInfo {
  validTo: string | null      // ISO date string
  protocol: string | null     // e.g. "TLSv1.3"
  issuer: string | null
}

export interface CwvData {
  lcp: number | null           // milliseconds
  inp: number | null           // milliseconds
  cls: number | null           // unitless ratio
  available: boolean           // false if PSI API fails or no CrUX data
}

export interface DnsData {
  hasA: boolean
  hasAAAA: boolean
  mx: string[]
  spf: string | null
  dmarc: string | null
  dkimFound: string[]          // selectors that resolved
  dnssecValid: boolean | null  // null if check failed
  resolveTimeMs: number
}
