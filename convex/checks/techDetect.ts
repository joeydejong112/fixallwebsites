export function detectTechStack(headers: Record<string, string>, html: string): string[] {
  const detected: string[] = []
  const lowerHtml = html.toLowerCase()
  const serverHeader = (headers['server'] ?? headers['Server'] ?? '').toLowerCase()

  // --- CMS ---
  if (/wp-content|wp-json|wp-includes/.test(lowerHtml) || /wordpress/.test(serverHeader)) detected.push('WordPress')
  if (/cdn\.shopify\.com|shopify\.com\/s\//.test(lowerHtml) || /shopify/i.test(headers['x-shopid'] ?? '')) detected.push('Shopify')
  if (/static\.wixstatic\.com|wix\.com\//.test(lowerHtml)) detected.push('Wix')
  if (/squarespace\.com|static1\.squarespace/.test(lowerHtml)) detected.push('Squarespace')
  if (/drupal\.js|drupal\.settings|\/sites\/default\/files/.test(lowerHtml)) detected.push('Drupal')
  if (/<meta[^>]+name=["']generator["'][^>]*content=["'][^"']*ghost/i.test(html)) detected.push('Ghost')
  if (/webflow\.js|assets\.website-files\.com/.test(lowerHtml)) detected.push('Webflow')

  // --- Frameworks ---
  if (/__next|_next\/static|_next\/image/.test(lowerHtml)) detected.push('Next.js')
  if (/__nuxt|_nuxt\/|nuxt\.config/.test(lowerHtml)) detected.push('Nuxt')
  if (/___gatsby|gatsby-chunk/.test(lowerHtml)) detected.push('Gatsby')
  if (/__sveltekit|_app\/immutable/.test(lowerHtml)) detected.push('SvelteKit')
  if (/ng-version|angular\.min\.js|angular\/core/.test(lowerHtml)) detected.push('Angular')
  if (/data-reactroot|react-dom|react\.development/.test(lowerHtml)) detected.push('React')
  if (/data-v-[a-f0-9]+|__vue__|vue\.runtime/.test(lowerHtml)) detected.push('Vue')

  // --- Servers (from Server header) ---
  if (/nginx/.test(serverHeader)) detected.push('Nginx')
  if (/apache/.test(serverHeader)) detected.push('Apache')
  if (/caddy/.test(serverHeader)) detected.push('Caddy')
  if (/microsoft-iis/.test(serverHeader)) detected.push('IIS')
  if (/litespeed/.test(serverHeader)) detected.push('LiteSpeed')

  // --- CDN / Hosting ---
  if (headers['cf-ray'] !== undefined) detected.push('Cloudflare')
  if (headers['x-vercel-id'] !== undefined) detected.push('Vercel')
  if (headers['x-nf-request-id'] !== undefined) detected.push('Netlify')
  if (headers['x-amz-cf-id'] !== undefined) detected.push('AWS CloudFront')
  if (headers['x-fastly-request-id'] !== undefined) detected.push('Fastly')
  if (headers['x-render-origin-server'] !== undefined) detected.push('Render')

  // --- Analytics ---
  if (/gtag\(|googletagmanager\.com|G-[A-Z0-9]{6,}/.test(lowerHtml)) detected.push('Google Analytics')
  if (/googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/.test(lowerHtml)) detected.push('Google Tag Manager')
  if (/plausible\.io\/js/.test(lowerHtml)) detected.push('Plausible')
  if (/usefathom\.com|cdn\.usefathom\.com/.test(lowerHtml)) detected.push('Fathom')
  if (/static\.hotjar\.com|hotjar\.com\/c\/hotjar/.test(lowerHtml)) detected.push('Hotjar')

  return [...new Set(detected)]
}
