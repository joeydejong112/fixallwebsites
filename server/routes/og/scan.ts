// Generates a dynamic SVG OG image for scan result pages.
// Usage: /og/scan?url=example.com&score=87
// Referenced as ogImage in results/index.vue once scan data is loaded.

function scoreColor(score: number): string {
  if (score >= 80) return '#00d4aa'
  if (score >= 50) return '#ffaa00'
  return '#ff4757'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'GOOD'
  if (score >= 50) return 'NEEDS WORK'
  return 'CRITICAL'
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const rawUrl   = String(query.url   ?? 'your-site.com')
  const rawScore = parseInt(String(query.score ?? '0'), 10)
  const score    = Math.max(0, Math.min(100, rawScore))

  // Trim URL for display
  const displayUrl = rawUrl.replace(/^https?:\/\//, '').slice(0, 40)
  const color = scoreColor(score)
  const label = scoreLabel(score)

  // Score arc: circle r=80, circumference=502.65
  const circumference = 502.65
  const dash = (score / 100) * circumference

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#07070a"/>
      <stop offset="100%" stop-color="#0d0d16"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${color}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Top accent bar split by pillar colours -->
  <rect x="0"   y="0" width="400" height="4" fill="#00d4aa"/>
  <rect x="400" y="0" width="400" height="4" fill="#ffaa00"/>
  <rect x="800" y="0" width="400" height="4" fill="#6c5ce7"/>

  <!-- Border -->
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- ScanPulse wordmark -->
  <circle cx="55" cy="62" r="9" fill="none" stroke="#ec3586" stroke-width="2"/>
  <circle cx="55" cy="62" r="4" fill="#ec3586"/>
  <text x="74" y="70" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="22" fill="white" opacity="0.9">ScanPulse</text>

  <!-- Left content -->
  <text x="80" y="220" font-family="system-ui,-apple-system,sans-serif" font-weight="400" font-size="20" fill="rgba(255,255,255,0.4)" letter-spacing="1">WEBSITE HEALTH SCAN</text>

  <!-- URL -->
  <text x="80" y="295" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${displayUrl.length > 30 ? 40 : 48}" fill="white" letter-spacing="-0.5">${displayUrl}</text>

  <!-- Pillar scores strip -->
  <rect x="80" y="340" width="120" height="6" rx="3" fill="#00d4aa" fill-opacity="0.6"/>
  <text x="80" y="370" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="1">SECURITY</text>

  <rect x="220" y="340" width="120" height="6" rx="3" fill="#ffaa00" fill-opacity="0.6"/>
  <text x="220" y="370" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="1">PERFORMANCE</text>

  <rect x="380" y="340" width="120" height="6" rx="3" fill="#6c5ce7" fill-opacity="0.6"/>
  <text x="380" y="370" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="1">SEO</text>

  <!-- Score circle (right side) -->
  <g transform="translate(920, 315)">
    <!-- Track -->
    <circle cx="0" cy="0" r="80" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10"/>
    <!-- Progress arc -->
    <circle cx="0" cy="0" r="80" fill="none" stroke="${color}" stroke-width="10"
      stroke-dasharray="${dash} ${circumference}"
      stroke-dashoffset="${circumference / 4}"
      stroke-linecap="round"/>
    <!-- Score number -->
    <text x="0" y="14" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="64" fill="${color}" text-anchor="middle">${score}</text>
    <!-- /100 -->
    <text x="0" y="40" font-family="system-ui,-apple-system,sans-serif" font-weight="400" font-size="16" fill="rgba(255,255,255,0.35)" text-anchor="middle">/100</text>
    <!-- Label -->
    <rect x="${-label.length * 4 - 12}" y="60" width="${label.length * 8 + 24}" height="24" rx="4" fill="${color}20"/>
    <text x="0" y="77" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="11" fill="${color}" text-anchor="middle" letter-spacing="1.5">${label}</text>
  </g>

  <!-- Bottom rule -->
  <rect x="60" y="520" width="1080" height="1" fill="rgba(255,255,255,0.06)"/>
  <text x="60" y="558" font-family="system-ui,-apple-system,sans-serif" font-weight="400" font-size="18" fill="rgba(255,255,255,0.3)">94 checks across Security, Performance, SEO, Accessibility, AI Readiness, DNS &amp; Trust</text>
</svg>`

  setResponseHeader(event, 'Content-Type', 'image/svg+xml')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')
  return svg
})
