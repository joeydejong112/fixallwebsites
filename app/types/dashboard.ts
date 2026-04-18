import type { Id } from '../../convex/_generated/dataModel'

export type ScanStatus = 'pending' | 'running' | 'done' | 'error'

export type PillarKey =
  | 'security' | 'performance' | 'seo'
  | 'accessibility' | 'ai' | 'dns' | 'trust'

export type PillarScoreKey = `${PillarKey}Score`

export interface Scan {
  _id: Id<'scans'>
  _creationTime: number
  url: string
  status: ScanStatus
  overallScore?: number | null
  securityScore?: number | null
  performanceScore?: number | null
  seoScore?: number | null
  accessibilityScore?: number | null
  aiScore?: number | null
  dnsScore?: number | null
  trustScore?: number | null
}

export interface Monitor {
  _id: Id<'monitoredSites'>
  url: string
  frequency: 'daily' | 'weekly'
  lastScore?: number | null
  lastRunTime?: number | null
}

export interface BulkScan {
  _id: Id<'bulkScans'>
  name: string
  totalUrls: number
  completedUrls: number
  status: ScanStatus
}

export interface PillarMeta {
  key: PillarKey
  scoreKey: PillarScoreKey
  label: string
  color: string
}

export const PILLAR_KEYS = ['security', 'performance', 'seo', 'accessibility', 'ai', 'dns', 'trust'] as const
