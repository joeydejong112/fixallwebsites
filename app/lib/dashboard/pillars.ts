import { PILLAR_COLORS } from '~/lib/dashboard/tools'
import { PILLAR_KEYS, type PillarMeta } from '~/types/dashboard'

export const PILLAR_LABELS: Record<string, string> = {
  security: 'Security',
  performance: 'Performance',
  seo: 'SEO',
  accessibility: 'Accessibility',
  ai: 'AI Readiness',
  dns: 'DNS',
  trust: 'Trust',
}

export const PILLAR_META: PillarMeta[] = PILLAR_KEYS.map(key => ({
  key,
  scoreKey: `${key}Score` as const,
  label: PILLAR_LABELS[key] ?? key,
  color: PILLAR_COLORS[key] ?? '#fff',
}))
