// Generates a branded SVG OG image for each tool page.
// Served at /og/tool/:slug — referenced as ogImage in ToolSeoSection.vue

const TOOLS: Record<string, { name: string; pillar: string; color: string }> = {
  'security-headers':  { name: 'Security Headers Generator', pillar: 'Security',      color: '#00d4aa' },
  'csp-builder':       { name: 'CSP Builder',                pillar: 'Security',      color: '#00d4aa' },
  'email-auth':        { name: 'Email Auth Checker',         pillar: 'Security',      color: '#00d4aa' },
  'image-optimizer':   { name: 'Image Optimizer',            pillar: 'Performance',   color: '#ffaa00' },
  'meta-generator':    { name: 'Meta Tag Generator',         pillar: 'SEO',           color: '#6c5ce7' },
  'robots-txt':        { name: 'Robots.txt Generator',       pillar: 'SEO',           color: '#6c5ce7' },
  'schema-generator':  { name: 'Schema Markup Generator',    pillar: 'SEO',           color: '#6c5ce7' },
  'favicon-generator': { name: 'Favicon Generator',          pillar: 'SEO',           color: '#6c5ce7' },
  'contrast-checker':  { name: 'WCAG Contrast Checker',      pillar: 'Accessibility', color: '#a29bfe' },
  'ai-optimizer':      { name: 'AI Readiness Optimizer',     pillar: 'AI Readiness',  color: '#ff7675' },
}

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const tool = TOOLS[slug] ?? { name: 'Free Website Tools', pillar: 'ScanPulse', color: '#ec3586' }

  // Truncate long names for layout
  const name = tool.name.length > 32 ? tool.name.slice(0, 30) + '…' : tool.name

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#07070a"/>
      <stop offset="100%" stop-color="#0f0f18"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${tool.color}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${tool.color}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Top glow blob -->
  <ellipse cx="600" cy="0" rx="500" ry="220" fill="url(#glow)"/>

  <!-- Top accent bar (pillar colour) -->
  <rect x="0" y="0" width="1200" height="4" fill="${tool.color}"/>

  <!-- Border -->
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- ScanPulse wordmark -->
  <text x="60" y="74" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="22" fill="white" opacity="0.9" letter-spacing="-0.3">ScanPulse</text>
  <circle cx="45" cy="62" r="7" fill="none" stroke="${tool.color}" stroke-width="1.5"/>
  <circle cx="45" cy="62" r="3" fill="${tool.color}"/>

  <!-- Pillar badge -->
  <rect x="60" y="220" width="${tool.pillar.length * 9 + 24}" height="30" rx="4" fill="${tool.color}18"/>
  <text x="72" y="240" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="12" fill="${tool.color}" letter-spacing="1.5">${tool.pillar.toUpperCase()}</text>

  <!-- Tool name -->
  <text x="60" y="330" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${name.length > 25 ? 52 : 60}" fill="white" letter-spacing="-1.5">${name}</text>

  <!-- Subline -->
  <text x="60" y="390" font-family="system-ui,-apple-system,sans-serif" font-weight="400" font-size="24" fill="rgba(255,255,255,0.4)">Free tool by ScanPulse — website health scanner</text>

  <!-- Bottom rule -->
  <rect x="60" y="520" width="1080" height="1" fill="rgba(255,255,255,0.06)"/>

  <!-- Bottom tagline -->
  <text x="60" y="558" font-family="system-ui,-apple-system,sans-serif" font-weight="400" font-size="18" fill="rgba(255,255,255,0.35)">scanpulse.io — 94 checks across 7 pillars</text>

  <!-- Bottom right CTA -->
  <text x="1140" y="558" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="16" fill="${tool.color}" text-anchor="end" letter-spacing="0.5">FREE →</text>

  <!-- Decorative right corner dots -->
  <circle cx="1100" cy="100" r="120" fill="${tool.color}" fill-opacity="0.04"/>
  <circle cx="1100" cy="100" r="70"  fill="${tool.color}" fill-opacity="0.05"/>
  <circle cx="1100" cy="100" r="30"  fill="${tool.color}" fill-opacity="0.1"/>
</svg>`

  setResponseHeader(event, 'Content-Type', 'image/svg+xml')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return svg
})
