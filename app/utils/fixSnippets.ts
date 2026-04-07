export interface FixSnippet {
  generic: string
  platforms?: Partial<Record<'nextjs' | 'nuxt' | 'nginx' | 'apache' | 'cloudflare', string>>
}

/**
 * Fix snippets keyed by issue title (exact match from check modules).
 * Structure: { generic, platforms? }
 */
export const FIX_SNIPPETS: Record<string, FixSnippet> = {

  // ─── SECURITY ──────────────────────────────────────────────────────────────

  'No HTTPS': {
    generic: `# Redirect all HTTP traffic to HTTPS at your server / host level.
# Then obtain a free TLS certificate via Let's Encrypt:
certbot --nginx -d yourdomain.com`,
    platforms: {
      nginx: `server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$host$request_uri;
}`,
      apache: `# .htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
      cloudflare: `# In Cloudflare Dashboard → SSL/TLS → Edge Certificates
# Set "Always Use HTTPS" = ON
# Set "Minimum TLS Version" = TLS 1.2`,
      nextjs: `// next.config.ts
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] }]
  }
}`,
    },
  },

  'Missing HSTS header': {
    generic: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
    platforms: {
      nextjs: `// next.config.ts → headers()
{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }`,
      nuxt: `// nuxt.config.ts
routeRules: { '/**': { headers: { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } } }`,
      nginx: `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`,
      apache: `Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"`,
      cloudflare: `# Cloudflare → SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)
# Enable with max-age=63072000, includeSubDomains, preload`,
    },
  },

  'Weak HSTS configuration': {
    generic: `# Increase max-age to at least 15768000 (6 months) and add includeSubDomains:
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
    platforms: {
      nginx: `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`,
      apache: `Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"`,
    },
  },

  'Missing Content-Security-Policy': {
    generic: `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'`,
    platforms: {
      nextjs: `// next.config.ts → headers()
{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none'" }`,
      nuxt: `// nuxt.config.ts
routeRules: { '/**': { headers: { 'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'" } } }`,
      nginx: `add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none'" always;`,
      cloudflare: `# Cloudflare → Rules → Transform Rules → Modify Response Header
# Add: Content-Security-Policy = default-src 'self'; frame-ancestors 'none'`,
    },
  },

  'Weak CSP configuration': {
    generic: `# Remove 'unsafe-inline', 'unsafe-eval', and wildcard (*) sources.
# Use nonces or hashes instead of 'unsafe-inline':
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'nonce-{RANDOM}'`,
    platforms: {
      nextjs: `// Generate a nonce per request in middleware.ts and pass via headers
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
export function middleware(req) {
  const nonce = randomBytes(16).toString('base64')
  const res = NextResponse.next()
  res.headers.set('Content-Security-Policy', \`script-src 'nonce-\${nonce}'\`)
  return res
}`,
    },
  },

  'Missing clickjacking protection': {
    generic: `X-Frame-Options: DENY
# Or via CSP (preferred):
Content-Security-Policy: frame-ancestors 'none'`,
    platforms: {
      nginx: `add_header X-Frame-Options "DENY" always;`,
      apache: `Header always set X-Frame-Options "DENY"`,
      nextjs: `{ key: 'X-Frame-Options', value: 'DENY' }`,
      cloudflare: `# Cloudflare → Rules → Transform Rules → Modify Response Header
# Add: X-Frame-Options = DENY`,
    },
  },

  'Missing X-Content-Type-Options': {
    generic: `X-Content-Type-Options: nosniff`,
    platforms: {
      nginx: `add_header X-Content-Type-Options "nosniff" always;`,
      apache: `Header always set X-Content-Type-Options "nosniff"`,
      nextjs: `{ key: 'X-Content-Type-Options', value: 'nosniff' }`,
    },
  },

  'Missing Referrer-Policy': {
    generic: `Referrer-Policy: strict-origin-when-cross-origin`,
    platforms: {
      nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
      nextjs: `{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }`,
    },
  },

  'Weak Referrer-Policy': {
    generic: `# Replace your current Referrer-Policy with a stricter value:
Referrer-Policy: strict-origin-when-cross-origin`,
    platforms: {
      nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    },
  },

  'Missing Permissions-Policy': {
    generic: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
    platforms: {
      nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
      apache: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"`,
      nextjs: `{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }`,
    },
  },

  'No COEP header': {
    generic: `Cross-Origin-Embedder-Policy: require-corp`,
    platforms: {
      nginx: `add_header Cross-Origin-Embedder-Policy "require-corp" always;`,
      nextjs: `{ key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }`,
    },
  },

  'No COOP header': {
    generic: `Cross-Origin-Opener-Policy: same-origin`,
    platforms: {
      nginx: `add_header Cross-Origin-Opener-Policy "same-origin" always;`,
      nextjs: `{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }`,
    },
  },

  'No Reporting-Endpoints configured': {
    generic: `# Add a Reporting-Endpoints header and reference it in your CSP report-to directive:
Reporting-Endpoints: default="https://yourdomain.report-uri.com/r/d/csp/enforce"
Content-Security-Policy: ...; report-to default`,
    platforms: {
      nginx: `add_header Reporting-Endpoints 'default="https://yourdomain.report-uri.com/r/d/csp/enforce"' always;`,
    },
  },

  'No Trusted Types': {
    generic: `# Add require-trusted-types-for to your CSP (advanced XSS mitigation):
Content-Security-Policy: ...; require-trusted-types-for 'script'`,
  },

  'Server header leaks version': {
    generic: `# Remove or obscure the Server header at your web server level.`,
    platforms: {
      nginx: `# nginx.conf (http block)
server_tokens off;`,
      apache: `# httpd.conf or .htaccess
ServerTokens Prod
ServerSignature Off`,
      cloudflare: `# Cloudflare automatically strips/replaces the Server header with "cloudflare".
# Enable Cloudflare proxy for your domain.`,
    },
  },

  'X-Powered-By header present': {
    generic: `# Remove X-Powered-By from your framework or server config.`,
    platforms: {
      nextjs: `// next.config.ts
const nextConfig = { poweredByHeader: false }`,
      nuxt: `// nuxt.config.ts — Nitro removes X-Powered-By by default.
// If not, add a server middleware to delete it.`,
      nginx: `# Nginx doesn't send X-Powered-By. If your app does, disable it in the framework.`,
      apache: `# httpd.conf
Header unset X-Powered-By`,
    },
  },

  'Insecure cookie flags': {
    generic: `# Ensure all cookies include Secure; HttpOnly; SameSite=Strict (or Lax):
Set-Cookie: session=abc; Secure; HttpOnly; SameSite=Strict; Path=/`,
    platforms: {
      nextjs: `// When setting cookies via next/headers or API routes:
res.setHeader('Set-Cookie', 'session=abc; Secure; HttpOnly; SameSite=Strict; Path=/')`,
    },
  },

  'Mixed content detected': {
    generic: `# Replace all http:// resource URLs with https:// in your HTML, CSS, and JS.
# Use protocol-relative URLs (//example.com/...) as a fallback.
# In WordPress: use the "Better Search Replace" plugin to update URLs in the DB.`,
    platforms: {
      cloudflare: `# Cloudflare → SSL/TLS → Edge Certificates
# Enable "Automatic HTTPS Rewrites" to fix mixed content automatically.`,
    },
  },

  'Missing Subresource Integrity': {
    generic: `# Generate an SRI hash and add integrity + crossorigin attributes:
# Use: https://www.srihash.org/
<script src="https://cdn.example.com/lib.js"
  integrity="sha384-<HASH>"
  crossorigin="anonymous"></script>`,
  },

  'CORS allows all origins': {
    generic: `# Replace wildcard with specific trusted origins:
Access-Control-Allow-Origin: https://yourdomain.com`,
    platforms: {
      nginx: `# Only allow specific origins:
add_header Access-Control-Allow-Origin "https://yourdomain.com" always;`,
      nextjs: `// In API route or middleware:
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com')`,
    },
  },

  'Long redirect chain': {
    generic: `# Reduce redirect hops to ≤ 2. Update internal links and canonical URLs to point
# directly to the final destination URL. Audit with:
curl -L -v https://yourdomain.com 2>&1 | grep "< HTTP"`,
  },

  'SSL certificate expiring soon': {
    generic: `# Renew your TLS certificate immediately.
# With Let's Encrypt (Certbot):
certbot renew --nginx
# Set up auto-renewal:
0 0,12 * * * /usr/bin/certbot renew --quiet`,
  },

  'SSL certificate expiring': {
    generic: `# Schedule renewal before expiry. With Let's Encrypt:
certbot renew --nginx
# Verify auto-renewal cron is active:
systemctl status certbot.timer`,
  },

  'Outdated TLS version': {
    generic: `# Disable TLS 1.0 and 1.1, enforce TLS 1.2+ at your server.`,
    platforms: {
      nginx: `# nginx.conf (ssl block)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;`,
      apache: `SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256`,
      cloudflare: `# Cloudflare → SSL/TLS → Edge Certificates
# Set "Minimum TLS Version" to TLS 1.2`,
    },
  },

  // ─── PERFORMANCE ────────────────────────────────────────────────────────────

  'Slow TTFB': {
    generic: `# Critical TTFB (>800ms). Investigate: slow DB queries, blocking middleware,
# no server-side caching, cold-start serverless functions.
# Add HTTP caching: Cache-Control: s-maxage=60, stale-while-revalidate=300`,
    platforms: {
      nginx: `# Enable proxy caching:
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=mycache:10m;
proxy_cache mycache;
proxy_cache_valid 200 1m;`,
      cloudflare: `# Enable Cloudflare Cache Rules to cache HTML responses at the edge.`,
    },
  },

  'High TTFB': {
    generic: `# TTFB >400ms. Add server-side caching (Redis/Memcached) or use a CDN.
Cache-Control: s-maxage=60, stale-while-revalidate=300`,
  },

  'No compression': {
    generic: `# Enable gzip or Brotli on your server.`,
    platforms: {
      nginx: `# nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
gzip_min_length 1000;
# For Brotli (requires ngx_brotli module):
brotli on;
brotli_types text/plain text/css application/json application/javascript;`,
      apache: `# .htaccess
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>`,
      nextjs: `// next.config.ts — compression is on by default.
// If using a custom server, install and use the 'compression' npm package.`,
      cloudflare: `# Cloudflare compresses responses automatically when proxying.
# Ensure your origin does NOT send pre-compressed responses unless using Brotli.`,
    },
  },

  'No HTTP/2+ detected': {
    generic: `# Enable HTTP/2 on your web server or use a CDN/proxy that supports it.`,
    platforms: {
      nginx: `# nginx.conf (server block)
listen 443 ssl http2;`,
      apache: `# httpd.conf or virtual host
Protocols h2 http/1.1`,
      cloudflare: `# Cloudflare enables HTTP/2 and HTTP/3 automatically for proxied domains.`,
    },
  },

  'Poor LCP': {
    generic: `# Largest Contentful Paint > 4s. Top fixes:
# 1. Add fetchpriority="high" to your LCP image element.
# 2. Use <link rel="preload" as="image"> for the LCP image.
# 3. Serve images in WebP/AVIF format.
# 4. Move your LCP image to a CDN.
<img src="/hero.webp" fetchpriority="high" loading="eager" alt="..." width="1200" height="600">`,
  },

  'Needs improvement: LCP': {
    generic: `# LCP between 2.5s–4s. Optimise the largest visible element:
# 1. Preload the LCP image: <link rel="preload" as="image" href="/hero.webp">
# 2. Ensure the LCP resource is not render-blocked.
# 3. Compress and convert images to WebP/AVIF.`,
  },

  'Poor INP': {
    generic: `# Interaction to Next Paint > 500ms. Fix long JavaScript tasks:
# 1. Break up long tasks with scheduler.yield() or setTimeout(fn, 0).
# 2. Defer non-critical JS with <script defer> or dynamic import().
# 3. Use a web worker for heavy computation.`,
    platforms: {
      nextjs: `// Dynamically import heavy components to reduce main-thread work:
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false })`,
    },
  },

  'Needs improvement: INP': {
    generic: `# INP between 200ms–500ms. Profile with Chrome DevTools → Performance panel.
# Look for long tasks (>50ms) blocking the main thread.`,
  },

  'Poor CLS': {
    generic: `# CLS > 0.25. Fix layout shifts by:
# 1. Always set explicit width/height on <img> and <video> elements.
# 2. Reserve space for ads/embeds with min-height.
# 3. Avoid inserting content above existing content on load.
<img src="..." width="800" height="450" alt="...">`,
  },

  'Needs improvement: CLS': {
    generic: `# CLS between 0.1–0.25. Add explicit dimensions to all media:
<img src="..." width="800" height="450" alt="...">
/* Or with aspect-ratio in CSS: */
img { aspect-ratio: 16/9; width: 100%; }`,
  },

  'Large HTML document': {
    generic: `# HTML > 100KB. Reduce by:
# 1. Move inline styles to external stylesheets.
# 2. Remove unused HTML (hidden elements, duplicate content).
# 3. Enable server-side compression (gzip/Brotli).
# 4. Lazy-load off-screen sections.`,
  },

  'Render-blocking scripts': {
    generic: `<!-- Add async or defer to <script> tags in <head>: -->
<script src="/app.js" defer></script>
<!-- Or use type="module" (implicitly deferred): -->
<script type="module" src="/app.js"></script>`,
  },

  'Unoptimized image formats': {
    generic: `<!-- Convert PNG/JPEG to WebP or AVIF for 25–50% smaller files: -->
<picture>
  <source srcset="/image.avif" type="image/avif">
  <source srcset="/image.webp" type="image/webp">
  <img src="/image.jpg" alt="..." width="800" height="450">
</picture>`,
    platforms: {
      nextjs: `// Use next/image — it auto-converts to WebP/AVIF:
import Image from 'next/image'
<Image src="/image.jpg" width={800} height={450} alt="..." />`,
      cloudflare: `# Cloudflare Polish (Pro+) automatically converts images to WebP.`,
    },
  },

  'Too many third-party scripts': {
    generic: `# > 10 third-party scripts. Audit and remove unused ones.
# Defer non-critical scripts:
<script src="https://analytics.example.com/script.js" defer></script>
# Self-host fonts and icons instead of loading from third-party CDNs.`,
  },

  'Images missing lazy loading': {
    generic: `<!-- Add loading="lazy" to below-fold images: -->
<img src="/image.webp" loading="lazy" alt="..." width="800" height="450">`,
    platforms: {
      nextjs: `// next/image uses lazy loading by default.
// For LCP image, add priority prop instead:
<Image src="/hero.webp" priority width={1200} height={600} alt="..." />`,
    },
  },

  'Images without dimensions': {
    generic: `<!-- Always set explicit width and height to prevent layout shifts (CLS): -->
<img src="/image.webp" width="800" height="450" alt="...">
/* Or via CSS aspect-ratio: */
img { aspect-ratio: 16/9; width: 100%; height: auto; }`,
  },

  'No Cache-Control header': {
    generic: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`,
    platforms: {
      nginx: `# For static assets:
location ~* \.(css|js|webp|woff2)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
# For HTML:
add_header Cache-Control "public, max-age=3600, stale-while-revalidate=86400";`,
      nextjs: `// next.config.ts — for API routes or server pages:
res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')`,
    },
  },

  'Cache-Control missing max-age': {
    generic: `# Add max-age or s-maxage to your Cache-Control header:
Cache-Control: public, max-age=3600, stale-while-revalidate=86400`,
  },

  'No fetchpriority="high" usage': {
    generic: `<!-- Add fetchpriority="high" to your LCP image: -->
<img src="/hero.webp" fetchpriority="high" loading="eager" alt="..." width="1200" height="600">`,
    platforms: {
      nextjs: `// Use the priority prop on next/image for the LCP element:
<Image src="/hero.webp" priority width={1200} height={600} alt="..." />`,
    },
  },

  'No resource hints': {
    generic: `<!-- Add preconnect for critical third-party origins: -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
<!-- Preload critical assets: -->
<link rel="preload" href="/hero.webp" as="image" type="image/webp">
<link rel="preload" href="/fonts/SpaceGrotesk.woff2" as="font" type="font/woff2" crossorigin>`,
  },

  'High carbon footprint': {
    generic: `# Reduce page weight to lower CO2 per pageview:
# 1. Enable Brotli compression (better than gzip for text).
# 2. Convert images to AVIF/WebP and lazy-load off-screen ones.
# 3. Remove unused CSS/JS (tree-shaking, PurgeCSS).
# 4. Self-host fonts and subset them to used glyphs only.`,
  },

  // ─── SEO ────────────────────────────────────────────────────────────────────

  'Missing <title> tag': {
    generic: `<head>
  <title>Page Title Here (30–60 chars)</title>
</head>`,
    platforms: {
      nextjs: `// app/layout.tsx or per-page:
export const metadata = { title: 'Page Title Here' }`,
      nuxt: `// pages/index.vue
useHead({ title: 'Page Title Here' })`,
    },
  },

  'Title length suboptimal': {
    generic: `# Aim for 30–60 characters. Current title is too short or too long.
<title>Concise, Descriptive Title — Brand Name</title>`,
  },

  'Missing meta description': {
    generic: `<meta name="description" content="A clear, concise description of this page (70–160 chars). Include your primary keyword naturally.">`,
    platforms: {
      nextjs: `export const metadata = {
  description: 'A clear description (70–160 chars) with your primary keyword.'
}`,
      nuxt: `useHead({ meta: [{ name: 'description', content: 'Your description here.' }] })`,
    },
  },

  'Meta description length suboptimal': {
    generic: `# Rewrite your meta description to be 70–160 characters.
<meta name="description" content="Your rewritten description (aim for 120–155 chars for best display in SERPs).">`,
  },

  'Missing H1 tag': {
    generic: `<!-- Add exactly one H1 per page — your primary keyword/topic: -->
<h1>Primary Topic of This Page</h1>`,
  },

  'Multiple H1 tags': {
    generic: `<!-- Keep only one H1. Change additional H1s to H2 or H3: -->
<h1>Main Topic</h1>       <!-- keep one -->
<h2>Sub-topic</h2>        <!-- was H1, now H2 -->`,
  },

  'Missing canonical URL': {
    generic: `<link rel="canonical" href="https://yourdomain.com/this-page/">`,
    platforms: {
      nextjs: `export const metadata = {
  alternates: { canonical: 'https://yourdomain.com/this-page/' }
}`,
      nuxt: `useHead({ link: [{ rel: 'canonical', href: 'https://yourdomain.com/this-page/' }] })`,
    },
  },

  'Missing viewport meta tag': {
    generic: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
  },

  'Incomplete Open Graph tags': {
    generic: `<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description (1–2 sentences).">
<meta property="og:image" content="https://yourdomain.com/og-image.jpg">
<meta property="og:url" content="https://yourdomain.com/this-page/">
<meta property="og:type" content="website">`,
    platforms: {
      nextjs: `export const metadata = {
  openGraph: {
    title: 'Page Title',
    description: 'Page description.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}`,
    },
  },

  'Incomplete Twitter Card tags': {
    generic: `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description.">
<meta name="twitter:image" content="https://yourdomain.com/og-image.jpg">`,
    platforms: {
      nextjs: `export const metadata = {
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title',
    description: 'Page description.',
    images: ['/og-image.jpg'],
  },
}`,
    },
  },

  'No structured data': {
    generic: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Title",
  "description": "Page description.",
  "url": "https://yourdomain.com/this-page/"
}
</script>`,
  },

  'No favicon detected': {
    generic: `<!-- Add to <head>: -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
  },

  'robots.txt not reachable': {
    generic: `# Create /public/robots.txt (or root of your web server):
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml`,
  },

  'sitemap.xml not reachable': {
    generic: `# Generate and serve a sitemap at /sitemap.xml.`,
    platforms: {
      nextjs: `// app/sitemap.ts
export default function sitemap() {
  return [
    { url: 'https://yourdomain.com', lastModified: new Date() },
    { url: 'https://yourdomain.com/about', lastModified: new Date() },
  ]
}`,
      nuxt: `// Use @nuxtjs/sitemap module:
// nuxt.config.ts
modules: ['@nuxtjs/sitemap'],
sitemap: { hostname: 'https://yourdomain.com' }`,
    },
  },

  'Page is noindexed': {
    generic: `<!-- Remove the noindex directive if this page should be indexed: -->
<!-- Remove or change: -->
<meta name="robots" content="noindex">
<!-- To: -->
<meta name="robots" content="index, follow">
<!-- Also check X-Robots-Tag response header for "noindex". -->`,
  },

  'WWW/non-WWW not redirecting': {
    generic: `# Choose one canonical version and 301-redirect the other.`,
    platforms: {
      nginx: `# Redirect www → non-www:
server {
  listen 443 ssl;
  server_name www.yourdomain.com;
  return 301 https://yourdomain.com$request_uri;
}`,
      apache: `# .htaccess — redirect www to non-www:
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]`,
      cloudflare: '# Cloudflare → Rules → Redirect Rules\n# Match: hostname eq "www.yourdomain.com"\n# Action: Redirect to https://yourdomain.com${REQUEST_URI} (301)',
    },
  },

  'Low image alt text coverage': {
    generic: `<!-- Add descriptive alt attributes to all <img> elements: -->
<img src="/product.webp" alt="Red running shoes size 10">
<!-- For decorative images use empty alt: -->
<img src="/divider.svg" alt="" role="presentation">`,
  },

  'Thin content': {
    generic: `# Page has < 300 words. Add meaningful, unique content:
# - Expand product/service descriptions
# - Add a FAQ section
# - Include case studies or testimonials
# - Aim for 500–1500 words for competitive queries`,
  },

  'No charset declaration': {
    generic: `<!-- Add to the top of <head>: -->
<meta charset="UTF-8">`,
  },

  'No author attribution': {
    generic: `<!-- Add meta author or Person schema: -->
<meta name="author" content="Your Name">
<!-- Or in JSON-LD: -->
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "Person", "name": "Your Name", "url": "https://yourdomain.com/about" }
</script>`,
  },

  'No publication dates': {
    generic: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "datePublished": "2026-01-01",
  "dateModified": "2026-04-01"
}
</script>`,
  },

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────

  'Missing lang attribute': {
    generic: `<!-- Add lang attribute to the <html> element: -->
<html lang="en">`,
  },

  'Images without alt text': {
    generic: `<!-- Add descriptive alt attributes: -->
<img src="/photo.webp" alt="Team meeting in conference room">
<!-- Decorative images: -->
<img src="/bg.svg" alt="" role="presentation">`,
  },

  'Inputs without labels': {
    generic: `<!-- Associate labels with inputs via for/id: -->
<label for="email">Email address</label>
<input type="email" id="email" name="email">
<!-- Or nest the input inside the label: -->
<label>Email address <input type="email" name="email"></label>
<!-- Or use aria-label for icon-only inputs: -->
<input type="search" aria-label="Search site">`,
  },

  'Buttons without accessible name': {
    generic: `<!-- Add visible text or aria-label to all buttons: -->
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>`,
  },

  'Skipped heading levels': {
    generic: `<!-- Maintain a logical heading sequence (h1 → h2 → h3):
  Do NOT skip from h2 to h4. -->
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Sub-section</h3>`,
  },

  'Missing ARIA landmarks': {
    generic: `<!-- Use semantic HTML5 elements for landmark regions: -->
<header>...</header>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<footer>...</footer>`,
  },

  'Non-descriptive link text': {
    generic: `<!-- Replace vague link text with descriptive text: -->
<!-- ❌ Bad: -->
<a href="/blog/post">Read more</a>
<!-- ✅ Good: -->
<a href="/blog/post">Read our guide to website performance</a>`,
  },

  'Auto-playing media detected': {
    generic: `<!-- Remove autoplay or add muted + controls: -->
<!-- ❌ Bad: -->
<video autoplay src="/intro.mp4"></video>
<!-- ✅ Acceptable (muted autoplay for decoration): -->
<video autoplay muted loop playsinline aria-hidden="true" src="/bg.mp4"></video>
<!-- ✅ Best: user-initiated: -->
<video controls src="/intro.mp4"></video>`,
  },

  'No skip-navigation link': {
    generic: `<!-- Add as the very first element inside <body>: -->
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 z-50">
  Skip to main content
</a>
<main id="main-content">...</main>`,
  },

  'Positive tabindex values': {
    generic: `<!-- Replace tabindex > 0 with tabindex="0" (natural DOM order)
     or tabindex="-1" (programmatically focusable only): -->
<!-- ❌ Bad: -->
<button tabindex="3">Submit</button>
<!-- ✅ Good: -->
<button tabindex="0">Submit</button>`,
  },

  'Duplicate IDs': {
    generic: `<!-- IDs must be unique per page. Rename duplicates: -->
<!-- ❌ Bad: -->
<div id="section">First</div>
<div id="section">Second</div>  <!-- duplicate! -->
<!-- ✅ Good: -->
<div id="section-1">First</div>
<div id="section-2">Second</div>`,
  },

  'Focus outline removed': {
    generic: `/* Remove outline: none on :focus and use :focus-visible instead: */
/* ❌ Bad: */
:focus { outline: none; }
/* ✅ Good: */
:focus { outline: 2px solid #ec3586; outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }`,
  },

  // ─── DNS & EMAIL ─────────────────────────────────────────────────────────────

  'No SPF record found': {
    generic: `# Add a TXT record to your DNS for yourdomain.com:
# Name: @  Type: TXT  Value:
"v=spf1 include:_spf.google.com include:sendgrid.net -all"
# Replace include: values with your actual email senders.`,
  },

  'SPF record too permissive': {
    generic: `# Change "+all" to "-all" (hard fail) or "~all" (soft fail):
# Current (bad):  v=spf1 ... +all
# Fixed (strict): v=spf1 include:_spf.google.com -all`,
  },

  'No DMARC record found': {
    generic: `# Add a TXT record at _dmarc.yourdomain.com:
# Name: _dmarc  Type: TXT  Value:
"v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; fo=1"`,
  },

  'DMARC policy not enforcing': {
    generic: `# Update your DMARC TXT record to use p=quarantine or p=reject:
# Current (monitor only): v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
# Recommended:           v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
# Strict:                v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com`,
  },

  'No DKIM record detected': {
    generic: `# Configure DKIM signing with your email provider and publish the public key:
# Example for Google Workspace:
# Name: google._domainkey  Type: TXT  Value: "v=DKIM1; k=rsa; p=<PUBLIC_KEY>"
# Get your key from your email provider's admin panel.`,
  },

  'No MX records found': {
    generic: `# Add MX records pointing to your mail provider:
# Example for Google Workspace:
# Name: @  Type: MX  Priority: 1   Value: ASPMX.L.GOOGLE.COM
# Name: @  Type: MX  Priority: 5   Value: ALT1.ASPMX.L.GOOGLE.COM
# Example for Zoho:
# Name: @  Type: MX  Priority: 10  Value: mx.zoho.com`,
  },

  'Domain expiring very soon': {
    generic: `# Renew your domain IMMEDIATELY via your registrar (e.g., Namecheap, GoDaddy, Cloudflare Registrar).
# After expiry, most registrars have a 30-day redemption grace period, but your site will go down.`,
  },

  'Domain expiring soon': {
    generic: `# Renew your domain before it expires. Log into your registrar and extend for 1–2 years.
# Enable auto-renewal to prevent future lapses.`,
  },

  'DNSSEC not enabled': {
    generic: `# Enable DNSSEC at your domain registrar:
# 1. In your DNS provider (e.g., Cloudflare): enable DNSSEC and copy the DS record.
# 2. At your registrar: paste the DS record to activate DNSSEC.
# With Cloudflare DNS: Dashboard → your domain → DNS → DNSSEC → Enable`,
  },

  'No IPv6 support (AAAA)': {
    generic: `# Add an AAAA record to your DNS:
# Name: @  Type: AAAA  Value: <your server's IPv6 address>
# Ask your hosting provider for your server's IPv6 address.
# Cloudflare proxy provides IPv6 automatically when "Proxy status" is orange.`,
  },

  'Very slow DNS response': {
    generic: `# DNS resolving > 600ms. Actions:
# 1. Switch to a faster authoritative DNS (Cloudflare DNS, Route 53, NS1).
# 2. Enable anycast DNS routing (included with Cloudflare, Route 53).
# 3. Check your TTL values — very low TTLs (< 300s) increase resolver load.`,
  },

  'Slow DNS response': {
    generic: `# DNS resolving > 300ms. Consider switching to a faster DNS provider:
# Cloudflare: cloudflare.com/dns  (typically <50ms globally)
# AWS Route 53: aws.amazon.com/route53  (global anycast)`,
  },

  // ─── TRUST & COMPLIANCE ──────────────────────────────────────────────────────

  'No privacy policy link found': {
    generic: `<!-- Add a visible link to your privacy policy in your footer: -->
<footer>
  <a href="/privacy-policy">Privacy Policy</a>
</footer>
# Create a /privacy-policy page. Use a generator if needed:
# https://www.privacypolicygenerator.info/`,
  },

  'No terms of service link found': {
    generic: `<!-- Add a link to your terms of service in your footer: -->
<footer>
  <a href="/terms">Terms of Service</a>
</footer>`,
  },

  'No cookie consent mechanism detected': {
    generic: `# Integrate a cookie consent manager before setting non-essential cookies.
# Free options:
#   CookieYes (cookieyes.com) — free tier available
#   Osano     (osano.com)     — free tier available
#   Klaro     (github.com/kiprotect/klaro) — open source
# Add the provided script snippet to your <head>.`,
  },

  'No contact information found': {
    generic: `<!-- Add contact info to your footer or a /contact page: -->
<a href="mailto:hello@yourdomain.com">hello@yourdomain.com</a>
<a href="tel:+1234567890">+1 234 567 890</a>
<a href="/contact">Contact us</a>`,
  },

  'GPC (Global Privacy Control) not supported': {
    generic: `# Create a /.well-known/gpc.json file at your web root:
{
  "gpc": true,
  "lastUpdate": "2026-01-01"
}
# Ensure it is publicly accessible at https://yourdomain.com/.well-known/gpc.json`,
    platforms: {
      nginx: `# nginx.conf: serve the static file from .well-known/:
location /.well-known/ {
  root /var/www/html;
  allow all;
}`,
    },
  },

  'No custom 404 page': {
    generic: `# Create a branded 404 page that keeps users on your site.`,
    platforms: {
      nextjs: `// app/not-found.tsx
export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>Sorry, we couldn't find that page.</p>
      <a href="/">Go home</a>
    </main>
  )
}`,
      nuxt: `<!-- app/error.vue -->
<template>
  <div>
    <h1>Page not found</h1>
    <NuxtLink to="/">Go home</NuxtLink>
  </div>
</template>`,
      nginx: `error_page 404 /404.html;
location = /404.html { root /var/www/html; internal; }`,
      apache: `# .htaccess
ErrorDocument 404 /404.html`,
    },
  },

  // ─── AI READINESS ──────────────────────────────────────────────────────────

  'No llms.txt found': {
    generic: `# Create /public/llms.txt (served at https://yourdomain.com/llms.txt)
# Format: plain markdown summarising your site for LLM ingestion

# Site Name
Your Site Name

## Summary
One-paragraph description of what your site does and who it serves.

## Key Pages
- /docs — Full documentation
- /pricing — Pricing tiers
- /blog — Latest articles
- /api — API reference

## Contact
support@yourdomain.com`,
    platforms: {
      nextjs: `// Place the file at: public/llms.txt
// It will be served automatically at /llms.txt`,
      nuxt: `// Place the file at: public/llms.txt
// Nuxt serves all files in public/ at the root path`,
      nginx: `# Place llms.txt in your web root
# No extra config needed — Nginx serves static files automatically`,
      cloudflare: `# For Cloudflare Pages / Workers, place llms.txt in your /public directory
# Or use a Cloudflare Worker to serve it at /llms.txt`,
    },
  },

  'No llms-full.txt found': {
    generic: `# Create /public/llms-full.txt for AI pipelines needing extended context
# This file can contain full page text, all docs, or structured content
# for RAG (Retrieval-Augmented Generation) systems.

# Site Name
Your Site Name

## About
Extended description of your site, products, and services...

## Documentation
[Full documentation content here]

## FAQ
Q: What is this product?
A: ...`,
    platforms: {
      nextjs: `// Place at: public/llms-full.txt`,
      nuxt: `// Place at: public/llms-full.txt`,
    },
  },

  'AI crawlers blocked in robots.txt': {
    generic: `# Remove Disallow: / rules for AI crawlers in robots.txt
# To allow all AI crawlers:

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /`,
    platforms: {
      nginx: `# Serve robots.txt as a static file from your web root
# Edit /var/www/html/robots.txt or equivalent`,
      cloudflare: `# Use a Cloudflare Worker to serve a dynamic robots.txt:
# Or simply edit your static robots.txt in the repo`,
      nextjs: `// app/robots.ts (Next.js 13+)
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}`,
      nuxt: `// nuxt.config.ts — use nuxt-simple-robots or a static file
// Place robots.txt in /public/robots.txt`,
    },
  },

  'No answer-engine schema markup': {
    generic: `<!-- Add FAQPage JSON-LD to answer questions directly in AI responses -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is your product?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A clear, concise answer that AI can cite directly."
      }
    }
  ]
}
</script>`,
    platforms: {
      nextjs: `// app/page.tsx
export default function Page() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is your product?',
        acceptedAnswer: { '@type': 'Answer', text: 'Your answer here.' },
      },
    ],
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* page content */}
    </>
  )
}`,
      nuxt: `<!-- pages/index.vue -->
<script setup>
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: 'What is your product?',
        acceptedAnswer: { '@type': 'Answer', text: 'Your answer here.' }
      }]
    })
  }]
})
</script>`,
    },
  },

  'Missing author authority signals': {
    generic: `<!-- Add Person or Organization JSON-LD for E-E-A-T signals -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Author Name",
  "url": "https://yourdomain.com/about",
  "sameAs": [
    "https://linkedin.com/in/yourprofile",
    "https://twitter.com/yourhandle"
  ]
}
</script>

<!-- Or add rel="author" to your page <head> -->
<link rel="author" href="/humans.txt">`,
    platforms: {
      nextjs: `// Include author JSON-LD in your layout or page component
// See the generic snippet above for the JSON-LD structure`,
      nuxt: `// Use useHead() to inject the JSON-LD script tag
// See the generic snippet above for the JSON-LD structure`,
    },
  },

  'No semantic content elements': {
    generic: `<!-- Wrap your main content in semantic HTML5 elements -->
<body>
  <header>...</header>
  <nav>...</nav>
  <main>
    <article>
      <h1>Page Title</h1>
      <section>
        <h2>Section Heading</h2>
        <p>Content paragraph...</p>
      </section>
    </article>
  </main>
  <footer>...</footer>
</body>`,
    platforms: {
      nextjs: `// Use semantic elements in your JSX
export default function Page() {
  return (
    <main>
      <article>
        <h1>Title</h1>
        <section>Content</section>
      </article>
    </main>
  )
}`,
      nuxt: `<!-- Use semantic elements in your Vue template -->
<template>
  <main>
    <article>
      <h1>Title</h1>
      <section>Content</section>
    </article>
  </main>
</template>`,
    },
  },

  'No content freshness signal': {
    generic: `<!-- Add dateModified to your JSON-LD schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "datePublished": "2024-01-01",
  "dateModified": "2024-06-15"
}
</script>

<!-- Or add Open Graph article:modified_time meta tag -->
<meta property="article:modified_time" content="2024-06-15T00:00:00+00:00">`,
    platforms: {
      nextjs: `// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)
  return {
    openGraph: {
      modifiedTime: post.updatedAt,
      publishedTime: post.createdAt,
    },
  }
}`,
      nuxt: `// pages/blog/[slug].vue
useSeoMeta({
  articleModifiedTime: post.updatedAt,
  articlePublishedTime: post.createdAt,
})`,
    },
  },

  'Broken heading continuity': {
    generic: `<!-- Ensure headings flow H1 → H2 → H3 without skipping levels -->

<!-- ✅ Correct -->
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

<!-- ❌ Avoid — skips H2 -->
<h1>Main Title</h1>
<h3>Subsection</h3>

Tip: Use only one H1 per page. Use H2 for major sections,
H3 for sub-topics within those sections.`,
  },

  'No citation-friendly formatting': {
    generic: `<!-- Use structured formats that LLMs can extract facts from -->

<!-- Ordered list for steps -->
<ol>
  <li>First step</li>
  <li>Second step</li>
</ol>

<!-- Unordered list for features -->
<ul>
  <li>Feature one</li>
  <li>Feature two</li>
</ul>

<!-- Table for comparisons -->
<table>
  <thead><tr><th>Plan</th><th>Price</th><th>Scans</th></tr></thead>
  <tbody>
    <tr><td>Free</td><td>$0</td><td>1</td></tr>
    <tr><td>Pro</td><td>$29/mo</td><td>Unlimited</td></tr>
  </tbody>
</table>`,
  },

  'No Open Graph article metadata': {
    generic: `<!-- Add Open Graph article metadata to your <head> -->
<meta property="article:published_time" content="2024-01-01T00:00:00+00:00">
<meta property="article:modified_time" content="2024-06-15T00:00:00+00:00">
<meta property="article:author" content="https://yourdomain.com/about/author-name">
<meta property="article:section" content="Technology">
<meta property="article:tag" content="web performance">`,
    platforms: {
      nextjs: `// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return {
    openGraph: {
      type: 'article',
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: ['https://yourdomain.com/about'],
      section: 'Technology',
      tags: ['web performance'],
    },
  }
}`,
      nuxt: `// pages/blog/[slug].vue
useSeoMeta({
  ogType: 'article',
  articlePublishedTime: post.createdAt,
  articleModifiedTime: post.updatedAt,
  articleAuthor: 'https://yourdomain.com/about',
  articleSection: 'Technology',
})`,
    },
  },
}
