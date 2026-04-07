interface ScanDoc {
  url: string
  status: string
  overallScore?: number
  securityScore?: number
  performanceScore?: number
  seoScore?: number
  accessibilityScore?: number
  aiScore?: number
  dnsScore?: number
  trustScore?: number
  issues?: Array<{ severity: string }>
  errorMessage?: string
}

export function exportBulkCsv(scans: ScanDoc[], fileName: string) {
  const headers = [
    'URL',
    'Status',
    'Overall',
    'Security',
    'Performance',
    'SEO',
    'Accessibility',
    'AI Readiness',
    'DNS',
    'Trust',
    'Critical Issues',
    'Warnings',
    'Error',
  ]

  const rows = scans.map(s => [
    s.url,
    s.status,
    s.overallScore ?? '',
    s.securityScore ?? '',
    s.performanceScore ?? '',
    s.seoScore ?? '',
    s.accessibilityScore ?? '',
    s.aiScore ?? '',
    s.dnsScore ?? '',
    s.trustScore ?? '',
    s.issues?.filter(i => i.severity === 'critical').length ?? '',
    s.issues?.filter(i => i.severity === 'warning').length ?? '',
    s.errorMessage ?? '',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${fileName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
