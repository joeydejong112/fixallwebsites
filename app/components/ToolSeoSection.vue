<script setup lang="ts">
const props = defineProps<{ slug?: string }>()
const route  = useRoute()
const { origin } = useRequestURL()

const resolvedSlug = computed(() =>
  props.slug ?? String(route.params.slug ?? route.path.split('/').pop())
)

const ogImageUrl = computed(() => `${origin}/og/tool/${resolvedSlug.value}`)

useSeoMeta(computed(() => ({
  ogImage:      ogImageUrl.value,
  twitterImage: ogImageUrl.value,
  twitterCard:  'summary_large_image',
})))

interface ToolSeo {
  intro:   string
  faq:     { q: string; a: string }[]
  related: { title: string; href: string; color: string }[]
}

interface ToolDetail {
  steps: { n: number; title: string; desc: string }[]
  example: {
    bad:  { label: string; lines: string[]; note: string }
    good: { label: string; lines: string[]; note: string }
  }
}

const DATA: Record<string, ToolSeo> = {
  'security-headers': {
    intro: 'HTTP security headers are response headers your web server sends alongside every page — browser instructions that control what content is trusted, where scripts may load from, and how connections are handled. Without them your site is exposed to cross-site scripting (XSS), clickjacking, SSL-stripping, and MIME-type confusion attacks. The most impactful headers are Strict-Transport-Security, which forces HTTPS even when a user types http://; Content-Security-Policy, which restricts the origins allowed to serve scripts and styles; X-Frame-Options or CSP frame-ancestors, which blocks your page being embedded in malicious iframes; Referrer-Policy, which limits URL leakage to third parties; and Permissions-Policy, which revokes access to browser APIs (camera, mic, geolocation) you don\'t need. ScanPulse checks 21 security signals as part of its free website scan — this generator lets you configure every recommended header and copy the full block straight into your Nginx, Apache, Cloudflare, or Vercel config.',
    faq: [
      { q: 'What are HTTP security headers?', a: 'HTTP security headers are response headers sent by your web server that tell the browser how to handle the page. They prevent common attacks like XSS, clickjacking, and protocol downgrade without changing any application code.' },
      { q: 'Which security headers are most important?', a: 'The highest-impact headers are Strict-Transport-Security (enforces HTTPS), Content-Security-Policy (restricts script/style origins), X-Frame-Options (blocks iframe embedding), Referrer-Policy (limits URL leakage), and X-Content-Type-Options: nosniff (prevents MIME sniffing).' },
      { q: 'Do security headers affect site performance?', a: 'No. Security headers are tiny strings in the HTTP response and add effectively zero latency. A strict CSP can actually improve performance by blocking unwanted third-party scripts from loading.' },
      { q: 'How do I add security headers to my site?', a: 'The method depends on your stack. For Nginx, add add_header directives in your server block. For Apache, use Header set in .htaccess. Cloudflare and Vercel support header rules via their dashboards or config files. Use this generator to get the exact values, then paste them in.' },
    ],
    related: [
      { title: 'CSP Header Builder', href: '/tools/csp-builder', color: '#00d4aa' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'csp-builder': {
    intro: 'A Content-Security-Policy (CSP) header is a browser instruction that defines exactly which origins are allowed to load scripts, styles, images, fonts, and other resources on your page. It is the single most effective defence against cross-site scripting (XSS) — the #1 vulnerability on the OWASP Top 10. A weak CSP (one that includes unsafe-inline, unsafe-eval, or wildcard * sources) gives attackers the same execution surface as having no CSP at all. Building CSP manually is error-prone because any typo blocks legitimate resources. This visual builder lets you add sources per directive, see real-time warnings when unsafe values are detected, and copy the final header in one click. ScanPulse checks both CSP presence and CSP quality — presence alone scores one check, but a tight policy with no unsafe-inline and no wildcards earns a second passing check in the security pillar.',
    faq: [
      { q: 'What is a Content-Security-Policy header?', a: 'CSP is an HTTP response header that tells the browser which origins are allowed to load each type of resource. If a script or style from an unlisted origin tries to load, the browser blocks it, preventing XSS attacks.' },
      { q: 'What does unsafe-inline mean in CSP?', a: "unsafe-inline allows inline <script> and <style> blocks to execute. This defeats most of CSP's XSS protection because attackers who inject inline script can still run arbitrary code. Avoid it if possible; use nonces or hashes instead." },
      { q: 'What is a CSP nonce?', a: "A nonce is a one-time random token added to both the script tag (nonce=\"abc123\") and the CSP header (script-src 'nonce-abc123'). Only scripts with the matching nonce execute, allowing inline scripts while blocking injected ones." },
      { q: 'Will CSP break my site?', a: "A strict CSP will block resources not in the allowlist — including third-party scripts, analytics, and fonts. Start with Content-Security-Policy-Report-Only mode to log violations without blocking, audit the report, then tighten the policy." },
    ],
    related: [
      { title: 'Security Headers Generator', href: '/tools/security-headers', color: '#00d4aa' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'image-optimizer': {
    intro: 'WebP is a modern image format developed by Google that produces files 25–34% smaller than JPEG and up to 26% smaller than PNG at equivalent visual quality. Switching from PNG or JPEG to WebP is one of the highest-ROI performance improvements available: it directly reduces page weight, shortens Largest Contentful Paint (LCP), and improves Time to First Byte (TTFB) for image-heavy pages. LCP is a Core Web Vital that Google uses as a ranking signal — images that take more than 2.5 seconds to load earn a failing grade. This converter runs entirely in your browser using the HTML Canvas API, so your images are never uploaded to any server. Drag in a PNG, JPEG, BMP, or GIF, adjust the quality slider, and download the WebP result. The converter also outputs a ready-to-paste img tag with the correct width, height, and loading="lazy" attributes — the exact attributes ScanPulse checks for in its performance audit.',
    faq: [
      { q: 'What is WebP and why should I use it?', a: 'WebP is a modern image format by Google that is 25–34% smaller than JPEG and PNG at equivalent quality. Smaller images mean faster page loads, better Core Web Vitals, and lower bandwidth costs. Chrome, Firefox, Safari, and Edge all support WebP.' },
      { q: 'Does WebP conversion reduce image quality?', a: 'WebP is lossy by default but you control the quality. At quality 80–85 the visual difference from JPEG is imperceptible to most users while file sizes drop 30%+. The live before/after preview in this tool lets you judge the trade-off yourself.' },
      { q: 'What image formats does this converter accept?', a: 'PNG, JPEG, BMP, GIF (first frame only), and TIFF. The conversion runs in your browser using the Canvas API — no server upload, no account required.' },
      { q: 'Should I also add width and height attributes to my img tags?', a: 'Yes. Explicit width and height attributes prevent layout shift (CLS) because the browser can reserve the correct space before the image loads. This tool generates an img snippet with both attributes pre-filled.' },
    ],
    related: [
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'meta-generator': {
    intro: 'HTML meta tags are snippets in your page\'s <head> that communicate the page\'s topic, author, and intent to search engines, social platforms, and browsers. The <title> tag is the most important on-page SEO element after content — it appears as the blue link in Google results and influences click-through rates heavily. A <meta name="description"> controls the snippet Google shows under the title; while it doesn\'t directly affect rankings, a compelling description lifts CTR and therefore organic traffic. Open Graph (og:title, og:description, og:image) and Twitter Card tags control how your page appears when shared on LinkedIn, Facebook, Slack, and X — a missing og:image means ugly text-only previews. A <link rel="canonical"> prevents duplicate-content penalties when the same page is accessible at multiple URLs. ScanPulse checks all of these in its SEO pillar — this generator outputs the complete <head> block with a live Google SERP preview so you can see exactly how your page will appear before publishing.',
    faq: [
      { q: 'What is the ideal title tag length?', a: 'Google typically displays 50–60 characters before truncating. Aim for a unique, descriptive title with your primary keyword near the front and your brand name at the end. Shorter is rarely a problem; longer usually gets cut.' },
      { q: 'Does the meta description affect SEO rankings?', a: 'Not directly — Google confirmed it is not a ranking factor. However a well-written description improves click-through rate from search results, and higher CTR can indirectly improve rankings.' },
      { q: 'What is Open Graph and do I need it?', a: "Open Graph (og:) tags control how your page appears when shared on social platforms. Without og:title and og:image, Facebook, LinkedIn, and Slack will guess — often picking the wrong content. Always set them." },
      { q: 'What is a canonical URL and why does it matter?', a: 'A canonical URL tells Google which version of a page is the "original" when the same content is accessible at multiple URLs (e.g., with/without trailing slash, http vs https, www vs non-www). Without it, Google may split ranking signals across duplicates.' },
    ],
    related: [
      { title: 'Schema Markup Generator', href: '/tools/schema-generator', color: '#6c5ce7' },
      { title: 'Robots.txt Generator', href: '/tools/robots-txt', color: '#6c5ce7' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'robots-txt': {
    intro: 'The robots.txt file sits at the root of your domain (e.g., https://example.com/robots.txt) and is the first file most search engine crawlers fetch. It instructs crawlers which paths they can and cannot index using allow and disallow directives. Getting it right is critical: a single erroneous Disallow: / blocks your entire site from Google — a mistake that can tank organic traffic overnight without any error message in the browser. It should also reference your sitemap.xml so crawlers can discover all your pages. Beyond traditional search engines, the robots.txt has become the standard mechanism for controlling AI crawler access. Bots like GPTBot (OpenAI), ClaudeBot (Anthropic), Perplexity, and Google-Extended all respect robots.txt. ScanPulse checks both that your robots.txt is reachable (returning a 200 status) and that it references your sitemap. This generator provides a visual editor with user-agent presets and one-click download.',
    faq: [
      { q: 'What is a robots.txt file?', a: 'robots.txt is a text file at the root of your domain that tells crawlers (Googlebot, Bingbot, GPTBot) which paths they are allowed or disallowed from fetching. It follows the Robots Exclusion Standard.' },
      { q: 'Can I block AI crawlers with robots.txt?', a: 'Yes. Add a User-agent: GPTBot block with Disallow: / to block OpenAI. Other AI bots to consider: ClaudeBot (Anthropic), PerplexityBot, Google-Extended, CCBot (Common Crawl). Use the AI Optimizer tool for a visual AI crawler manager.' },
      { q: 'Does robots.txt prevent pages from being indexed?', a: 'Disallow stops crawlers from fetching the page, but Google can still index a URL it discovers from links even without crawling it. To prevent indexing, use a noindex meta tag or X-Robots-Tag header — robots.txt alone is insufficient.' },
      { q: 'Should I add my sitemap to robots.txt?', a: 'Yes. Adding Sitemap: https://example.com/sitemap.xml in robots.txt tells any crawler where to find your full site structure, improving crawl coverage. ScanPulse flags the absence of a sitemap reference as a warning.' },
    ],
    related: [
      { title: 'AI Optimizer & llms.txt', href: '/tools/ai-optimizer', color: '#ff7675' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'favicon-generator': {
    intro: 'A favicon is the small icon displayed in the browser tab, bookmarks bar, browser history, and on mobile home screens. Without one, browsers show a generic placeholder icon and make an extra HTTP request for /favicon.ico that returns a 404, adding noise to your server logs and a tiny but real performance penalty. A missing favicon also triggers a failing check in ScanPulse\'s SEO audit. The modern minimum is two files: a favicon.ico (containing 16×16 and 32×32 bitmaps for desktop browsers) and an apple-touch-icon.png (180×180 for iOS home screen bookmarks). This generator converts any uploaded image to both formats entirely in your browser using the Canvas API — no file is ever sent to a server. The tool also outputs the exact <head> snippet to paste into your HTML, and provides a live browser-tab preview so you can see how your favicon will look before downloading.',
    faq: [
      { q: 'What size should a favicon be?', a: 'The minimum is a 16×16 and 32×32 favicon.ico for desktop browsers, and a 180×180 apple-touch-icon.png for iOS. This generator produces all three from your source image. For best results use a square source image at least 512×512 pixels.' },
      { q: 'What format should a favicon be in?', a: 'favicon.ico is the universal format supported by all browsers. Modern browsers also support PNG favicons via <link rel="icon" type="image/png">. Safari iOS requires apple-touch-icon.png at 180×180 for home screen bookmarks.' },
      { q: 'How do I add a favicon to my site?', a: 'Place favicon.ico and apple-touch-icon.png in the root of your domain, then add these tags in your <head>: <link rel="icon" href="/favicon.ico"> and <link rel="apple-touch-icon" href="/apple-touch-icon.png">. The generator provides the exact snippet.' },
      { q: 'Will a missing favicon hurt my SEO?', a: 'Not directly as a ranking factor, but ScanPulse flags it as a failing SEO check because Google uses favicons in mobile search results. A missing favicon makes your listing look less professional and can reduce click-through rate.' },
    ],
    related: [
      { title: 'Meta Tag Generator', href: '/tools/meta-generator', color: '#6c5ce7' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'schema-generator': {
    intro: 'JSON-LD (JavaScript Object Notation for Linked Data) is Google\'s preferred format for structured data markup. When you embed a JSON-LD block in your page\'s <head>, you\'re giving search engines a machine-readable description of your content — who wrote it, when it was published, what organisation it belongs to, and what type of content it is. This enables rich results: Google can display author bylines, star ratings, event dates, and breadcrumbs directly in search results, which increases click-through rates by 20–30% compared to plain blue links. Google\'s E-E-A-T guidelines (Experience, Expertise, Authoritativeness, Trustworthiness) heavily weight proper author attribution and publication dates — both of which ScanPulse checks as SEO signals. This generator produces valid Article, BlogPosting, and Organization JSON-LD from a guided form, with a live preview of the output and one-click copy or download.',
    faq: [
      { q: 'What is JSON-LD structured data?', a: 'JSON-LD is a script block in your page <head> that describes your content in a format search engines understand. It enables rich results (author, date, star ratings) in Google and is also used by AI systems to understand your content.' },
      { q: 'Which schema type should I use?', a: 'Use Article or BlogPosting for editorial content (blog posts, news). Use Organization for your company homepage — it establishes your brand entity in the Knowledge Graph. Product and FAQ schemas are useful for e-commerce and support pages.' },
      { q: 'Does structured data improve rankings?', a: 'Not directly. Structured data helps Google display rich results, which improve click-through rates from search. Higher CTR can indirectly improve rankings. For AI search (Perplexity, ChatGPT), structured data significantly improves citation accuracy.' },
      { q: 'How do I validate my JSON-LD?', a: "Use Google's Rich Results Test (search.google.com/test/rich-results) to validate and preview your schema. ScanPulse also checks for JSON-LD presence and identifies the schema type as part of its SEO audit." },
    ],
    related: [
      { title: 'Meta Tag Generator', href: '/tools/meta-generator', color: '#6c5ce7' },
      { title: 'AI Optimizer & llms.txt', href: '/tools/ai-optimizer', color: '#ff7675' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'contrast-checker': {
    intro: 'WCAG 2.1 (Web Content Accessibility Guidelines) defines minimum contrast ratios between text and its background to ensure readability for users with low vision or colour blindness. Level AA requires a 4.5:1 ratio for normal text (under 18pt) and 3:1 for large text (18pt+ or 14pt bold). Level AAA requires 7:1 for normal text. Low contrast is consistently one of the most common accessibility failures — WebAIM\'s annual survey finds it present on over 80% of home pages. Failing contrast also signals poor user experience to search engines and can affect SEO indirectly. This checker computes the WCAG contrast ratio in real time for any foreground/background colour combination, shows pass/fail status across all four WCAG levels, and provides a live text preview at both normal and large sizes. Input colours in Hex, RGB, or HSL. ScanPulse\'s accessibility pillar includes an outline:none check for focus visibility — use this tool alongside it to meet full WCAG compliance.',
    faq: [
      { q: 'What is a WCAG contrast ratio?', a: 'The WCAG contrast ratio measures the relative luminance difference between two colours on a scale from 1:1 (identical) to 21:1 (black on white). The formula is defined in WCAG 2.1 and is calculated from the relative luminance of each colour.' },
      { q: 'What contrast ratio do I need to pass WCAG AA?', a: 'WCAG 2.1 Level AA requires 4.5:1 for normal text (under 18pt or 14pt bold) and 3:1 for large text. This is the standard required by most accessibility legislation including ADA, EN 301 549, and the UK Equality Act.' },
      { q: 'What is the difference between WCAG AA and AAA?', a: 'AA is the minimum standard required by most legislation. AAA (7:1 for normal text, 4.5:1 for large text) is the enhanced level — aim for it where possible but it is not required for compliance.' },
      { q: 'Does colour contrast affect SEO?', a: "Not directly as a ranking factor, but Google's Page Experience signals include accessibility factors. Poor contrast reduces user engagement and time-on-site, which can indirectly signal poor quality to search engines." },
    ],
    related: [
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'email-auth': {
    intro: 'SPF, DKIM, and DMARC are three DNS records that together prove to receiving mail servers that email sent from your domain is legitimate — and not a spoof from a scammer impersonating you. Without them, your domain can be used by anyone to send phishing emails, your legitimate emails land in spam, and you have no visibility into who is sending on your behalf. SPF (Sender Policy Framework) lists the IP addresses and mail servers authorised to send from your domain. DKIM (DomainKeys Identified Mail) adds a cryptographic signature to every email so recipients can verify it hasn\'t been tampered with in transit. DMARC (Domain-based Message Authentication, Reporting & Conformance) ties SPF and DKIM together and tells receivers what to do with messages that fail authentication — quarantine them, reject them, or monitor and report. ScanPulse checks SPF, DKIM, and DMARC as part of its DNS & Email pillar. This generator creates the exact DNS TXT records you need for all three.',
    faq: [
      { q: 'What is SPF and why do I need it?', a: 'SPF is a DNS TXT record that lists the mail servers allowed to send email from your domain. Receiving servers check SPF before accepting email — without it, anyone can send email pretending to be from your domain.' },
      { q: 'What is the difference between SPF, DKIM, and DMARC?', a: 'SPF verifies the sending server is authorised. DKIM verifies the message content has not been tampered with (using a cryptographic signature). DMARC ties both together and tells receivers how to handle failures — and sends you reports.' },
      { q: 'What DMARC policy should I start with?', a: 'Start with p=none (monitoring mode) to receive reports without affecting email delivery. Once you confirm all legitimate senders pass SPF and DKIM, move to p=quarantine, then p=reject for maximum protection.' },
      { q: 'Will adding these records break my email?', a: "SPF and DMARC won't break anything if configured correctly. DKIM requires your email provider to generate and host the signing key — check your provider's dashboard (Google Workspace, Mailchimp, SendGrid) for their specific DKIM setup instructions." },
    ],
    related: [
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },

  'ai-optimizer': {
    intro: 'llms.txt is an emerging standard (proposed by fast.ai, modelled on robots.txt) that tells AI crawlers — GPTBot, ClaudeBot, Perplexity-Bot, Google-Extended — what your site contains, what they are allowed to read, and how it should be summarised. Sites that adopt llms.txt are more likely to appear as cited sources in ChatGPT, Perplexity, and Google AI Overviews because they make ingestion easier and signal content quality. Answer Engine Optimization (AEO) is the practice of structuring content so AI systems can extract, understand, and cite it accurately. Key signals include a well-formed llms.txt, explicit AI crawler allow-list rules in robots.txt, answer-engine-optimized schema markup (FAQPage, HowTo, Speakable), clear author authority (E-E-A-T), and content structured in question-answer format. ScanPulse checks 10 AI Readiness signals as part of its free scan — this tool generates a valid llms.txt file and the corresponding robots.txt entries for all major AI crawlers.',
    faq: [
      { q: 'What is llms.txt?', a: "llms.txt is a plain-text file at yoursite.com/llms.txt that tells AI language models what your site is about, what content they can use, and how to summarise it. It's modelled on robots.txt and is becoming a de facto standard for AI crawler communication." },
      { q: 'Will llms.txt help me rank in AI search?', a: 'It signals to AI systems that you want to be cited and provides structured context about your content. Sites without llms.txt are harder to parse and less likely to be selected as citation sources in Perplexity, ChatGPT, and Google AI Overviews.' },
      { q: 'How do I block AI crawlers from my site?', a: 'Add a User-agent: GPTBot block with Disallow: / in robots.txt to block OpenAI. Do the same for ClaudeBot, PerplexityBot, Google-Extended, and CCBot. This tool generates those blocks with toggles per crawler.' },
      { q: 'What is Answer Engine Optimization (AEO)?', a: 'AEO is the practice of structuring your content so AI systems can accurately extract and cite it. Key tactics: FAQPage JSON-LD schema, clear H2 headings that match common questions, explicit author attribution, and an up-to-date llms.txt.' },
    ],
    related: [
      { title: 'Robots.txt Generator', href: '/tools/robots-txt', color: '#6c5ce7' },
      { title: 'Schema Markup Generator', href: '/tools/schema-generator', color: '#6c5ce7' },
      { title: 'Run a full scan', href: '/', color: '#ec3586' },
    ],
  },
}

const DETAILS: Record<string, ToolDetail> = {
  'security-headers': {
    steps: [
      { n: 1, title: 'Toggle the headers you want', desc: 'Enable or disable each header for your use case — critical headers are pre-enabled.' },
      { n: 2, title: 'Customise values for your stack', desc: 'Edit header values for Nginx, Apache, Cloudflare, or Vercel — the builder shows the exact syntax.' },
      { n: 3, title: 'Click "Copy All"', desc: 'Copy the full header block in one click — formatted and ready to paste.' },
      { n: 4, title: 'Paste into your server config', desc: 'Drop the block into your server config and redeploy — changes take effect immediately.' },
    ],
    example: {
      bad: {
        label: 'HTTP response — no security headers',
        lines: ['HTTP/1.1 200 OK', 'Content-Type: text/html', 'Server: nginx/1.18.0', '', '# ← No security headers at all'],
        note: 'Browser has zero instructions — clickjacking, MIME attacks, protocol downgrades all possible',
      },
      good: {
        label: 'HTTP response — hardened headers',
        lines: [
          'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          'X-Content-Type-Options: nosniff',
          'X-Frame-Options: DENY',
          'Referrer-Policy: strict-origin-when-cross-origin',
          'Permissions-Policy: camera=(), microphone=()',
        ],
        note: 'Browser enforces HTTPS, blocks iframe embedding, stops MIME sniffing',
      },
    },
  },

  'csp-builder': {
    steps: [
      { n: 1, title: 'Add directives you need', desc: 'Select script-src, style-src, img-src, and any other directives your page uses.' },
      { n: 2, title: 'Enter allowed sources', desc: 'Specify exact origins, \'self\', or nonces per directive — no guesswork.' },
      { n: 3, title: 'Fix real-time warnings', desc: 'The builder flags unsafe-inline, unsafe-eval, and wildcard * instantly as you type.' },
      { n: 4, title: 'Copy the finished header', desc: 'Click Copy and paste the header into your server response or Vercel config.' },
    ],
    example: {
      bad: {
        label: "Weak CSP — all origins allowed",
        lines: [
          'Content-Security-Policy:',
          "  default-src *",
          "  script-src * 'unsafe-inline' 'unsafe-eval'",
          "  style-src * 'unsafe-inline'",
          '',
          '# Wildcard + unsafe-inline = no XSS protection',
        ],
        note: 'Attackers can inject scripts from any domain — CSP is effectively disabled',
      },
      good: {
        label: 'Strict CSP — locked down',
        lines: [
          'Content-Security-Policy:',
          "  default-src 'self'",
          "  script-src 'self' cdn.mysite.com 'nonce-r4nd0m'",
          "  style-src 'self' fonts.googleapis.com",
          '  img-src \'self\' data: https:',
          "  frame-ancestors 'none'",
        ],
        note: 'Only explicitly listed origins can load resources — XSS is contained',
      },
    },
  },

  'image-optimizer': {
    steps: [
      { n: 1, title: 'Upload your image', desc: 'Drag or click to upload a PNG, JPEG, BMP, or GIF — no server upload required.' },
      { n: 2, title: 'Adjust quality', desc: 'Move the quality slider — 80–85 is the sweet spot for most images.' },
      { n: 3, title: 'See live savings', desc: 'Before/after file sizes and savings percentage update instantly.' },
      { n: 4, title: 'Download WebP', desc: 'Click Download to save the optimised WebP — everything runs in your browser.' },
    ],
    example: {
      bad: {
        label: 'Original PNG — unoptimized',
        lines: [
          'logo.png',
          'Format     : PNG (lossless)',
          'Dimensions : 1200 × 630 px',
          'File size  : 2,847 KB',
          '',
          'LCP time estimate : ~4.2 s on 3G ❌',
        ],
        note: 'Image is 18× larger than it needs to be — fails Core Web Vitals LCP threshold',
      },
      good: {
        label: 'Converted to WebP — optimized',
        lines: [
          'logo.webp',
          'Format     : WebP (quality 82)',
          'Dimensions : 1200 × 630 px',
          'File size  : 156 KB  (-94.5%)',
          '',
          'LCP time estimate : ~0.3 s on 3G ✓',
        ],
        note: 'Same visual quality, fraction of the size — passes LCP under 2.5 s',
      },
    },
  },

  'meta-generator': {
    steps: [
      { n: 1, title: 'Fill in title and description', desc: 'The character counter turns green at the ideal length — 50–60 chars for title, 120–160 for description.' },
      { n: 2, title: 'Add Open Graph fields', desc: 'Set og:title, og:image, and og:description for rich social sharing previews.' },
      { n: 3, title: 'Watch the SERP preview', desc: 'The live Google SERP preview updates as you type — see exactly how your listing looks.' },
      { n: 4, title: 'Copy all tags', desc: 'Click "Copy all tags" and paste the block straight into your HTML <head>.' },
    ],
    example: {
      bad: {
        label: 'Minimal — missing critical tags',
        lines: [
          '<title>Home</title>',
          '',
          '<!-- No description -->',
          '<!-- No og:title -->',
          '<!-- No og:image -->',
          '<!-- No canonical -->',
        ],
        note: 'Google shows "Home" as the blue link with no snippet — near-zero CTR',
      },
      good: {
        label: 'Complete meta block',
        lines: [
          '<title>ScanPulse — Free Website Health Scanner</title>',
          '<meta name="description" content="Scan any URL for security, performance and SEO issues in seconds.">',
          '<link rel="canonical" href="https://scanpulse.io/">',
          '<meta property="og:title" content="ScanPulse — Free Website Health Scanner">',
          '<meta property="og:image" content="https://scanpulse.io/og.png">',
        ],
        note: 'Rich SERP listing with image when shared on social — CTR +25–40%',
      },
    },
  },

  'robots-txt': {
    steps: [
      { n: 1, title: 'Add user-agent blocks', desc: 'Use * for all bots or specific names like Googlebot, GPTBot, or ClaudeBot.' },
      { n: 2, title: 'Set Disallow and Allow rules', desc: 'Define which paths each crawler can and cannot fetch.' },
      { n: 3, title: 'Paste your sitemap URL', desc: 'Add your sitemap so all crawlers can discover every page on your site.' },
      { n: 4, title: 'Download and deploy', desc: 'Download robots.txt and place it at the root of your domain.' },
    ],
    example: {
      bad: {
        label: 'Catastrophic robots.txt',
        lines: [
          'User-agent: *',
          'Disallow: /',
          '',
          '# This blocks Google from crawling',
          '# your entire site — pages disappear',
          '# from search results within days',
        ],
        note: 'A single typo here removed a 500-page site from Google in 72 hours',
      },
      good: {
        label: 'Correct robots.txt',
        lines: [
          'User-agent: *',
          'Disallow: /admin/',
          'Disallow: /private/',
          'Allow: /',
          '',
          'Sitemap: https://example.com/sitemap.xml',
        ],
        note: 'Blocks private paths, allows everything else, tells Google where the sitemap is',
      },
    },
  },

  'favicon-generator': {
    steps: [
      { n: 1, title: 'Upload a square image', desc: 'PNG works best — use at least 512×512 pixels for sharp results across all sizes.' },
      { n: 2, title: 'Preview in browser tab', desc: 'See exactly how the icon looks in the simulated browser tab before downloading.' },
      { n: 3, title: 'Download both files', desc: 'Download favicon.ico and apple-touch-icon.png — both are generated in your browser.' },
      { n: 4, title: 'Add the head snippet', desc: 'Copy the <head> snippet and deploy both files to your site root.' },
    ],
    example: {
      bad: {
        label: 'Missing favicon — browser fallback',
        lines: [
          'GET /favicon.ico → 404 Not Found',
          '',
          '<!-- No <link rel="icon"> in <head> -->',
          '',
          '# Browser shows generic placeholder',
          '# Extra failing HTTP request per page load',
          '# Google mobile SERP shows blank icon',
        ],
        note: '404 on favicon.ico adds a failed request to every page load and hurts mobile SERP presentation',
      },
      good: {
        label: 'Favicon properly configured',
        lines: [
          'GET /favicon.ico → 200 OK (1.1 KB)',
          '',
          '<link rel="icon" href="/favicon.ico">',
          '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
          '',
          '# Tab shows brand icon',
          '# iOS home screen bookmark works',
          '# Google SERP mobile shows brand',
        ],
        note: 'Brand icon in browser tabs, bookmarks, and Google mobile search results',
      },
    },
  },

  'schema-generator': {
    steps: [
      { n: 1, title: 'Choose your schema type', desc: 'Select Article/BlogPosting for content pages, or Organization for your homepage.' },
      { n: 2, title: 'Fill in the guided form', desc: 'Enter author, dates, publisher logo, and headline — the form validates as you go.' },
      { n: 3, title: 'Preview JSON-LD in real time', desc: 'The generated script block updates live so you can check the output before copying.' },
      { n: 4, title: 'Paste into your HTML head', desc: 'Copy or download the script and paste it inside your page\'s <head> tag.' },
    ],
    example: {
      bad: {
        label: 'No structured data',
        lines: [
          '<!-- No JSON-LD in <head> -->',
          '',
          'Google sees   : plain article',
          'AI search sees: unstructured content',
          'Rich results  : none',
          'Author        : unknown',
          'Date          : unknown',
        ],
        note: 'Google cannot verify authorship, dates, or entity — E-E-A-T signals are missing',
      },
      good: {
        label: 'Article JSON-LD schema',
        lines: [
          '{',
          '  "@type": "Article",',
          '  "headline": "How to Secure Your Website",',
          '  "author": { "@type": "Person", "name": "Jane Smith" },',
          '  "datePublished": "2024-01-15",',
          '  "publisher": { "@type": "Organization", "name": "ScanPulse" }',
          '}',
        ],
        note: 'Google displays author byline, date, and breadcrumbs — eligibility for rich results',
      },
    },
  },

  'contrast-checker': {
    steps: [
      { n: 1, title: 'Pick foreground and background colours', desc: 'Use the colour pickers or type hex values directly — the ratio updates instantly.' },
      { n: 2, title: 'Read the contrast ratio', desc: 'The ratio and pass/fail badges update in real time as you change colours.' },
      { n: 3, title: 'Check WCAG levels', desc: 'Green badges = pass, red badges = fail — with the exact failing level highlighted.' },
      { n: 4, title: 'Adjust until you pass', desc: 'Tweak colours until your target level passes, then copy the hex values.' },
    ],
    example: {
      bad: {
        label: 'Failing contrast — common mistake',
        lines: [
          'Foreground : #9ca3af  (gray-400)',
          'Background : #ffffff  (white)',
          '',
          'Contrast ratio : 2.85 : 1',
          '',
          'WCAG AA  Normal : ✗ FAIL  (need 4.5:1)',
          'WCAG AA  Large  : ✗ FAIL  (need 3.0:1)',
          'WCAG AAA        : ✗ FAIL',
        ],
        note: 'Light gray placeholder text on white — used on 80%+ of sites, fails all WCAG levels',
      },
      good: {
        label: 'Passing contrast — accessible',
        lines: [
          'Foreground : #374151  (gray-700)',
          'Background : #ffffff  (white)',
          '',
          'Contrast ratio : 10.36 : 1',
          '',
          'WCAG AA  Normal : ✓ PASS  (need 4.5:1)',
          'WCAG AA  Large  : ✓ PASS  (need 3.0:1)',
          'WCAG AAA        : ✓ PASS  (need 7.0:1)',
        ],
        note: 'Dark gray on white — passes all levels including AAA for full ADA compliance',
      },
    },
  },

  'email-auth': {
    steps: [
      { n: 1, title: 'Select your email providers', desc: 'Pick Google Workspace, Mailchimp, SendGrid, etc. — SPF include: values are auto-populated.' },
      { n: 2, title: 'Choose your DMARC policy', desc: 'Start with p=none for monitoring; upgrade to p=reject once all senders are verified.' },
      { n: 3, title: 'Copy the DNS TXT records', desc: 'Three records — SPF, DKIM, DMARC — ready to paste into your domain\'s DNS.' },
      { n: 4, title: 'Activate DKIM signing', desc: 'Follow the per-provider instructions to generate and activate your DKIM signing key.' },
    ],
    example: {
      bad: {
        label: 'Domain with no email authentication',
        lines: [
          '@ TXT       → (no SPF record)',
          '_dmarc TXT  → (no DMARC record)',
          '',
          'Result: anyone can send email from',
          'your domain — phishing trivial.',
          'Your own emails → spam folder.',
          'No visibility into spoofing attempts.',
        ],
        note: 'Any attacker can send email that appears to be from yourcompany.com',
      },
      good: {
        label: 'Fully authenticated domain',
        lines: [
          '@ TXT         "v=spf1 include:_spf.google.com ~all"',
          'mail._domainkey TXT  "v=DKIM1; k=rsa; p=MIGf..."',
          '_dmarc TXT    "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"',
          '',
          'SPF  : ✓  Authorised senders listed',
          'DKIM : ✓  Emails cryptographically signed',
          'DMARC: ✓  Spoofed emails rejected',
        ],
        note: 'Spoofed emails are rejected before delivery — inbox reputation protected',
      },
    },
  },

  'ai-optimizer': {
    steps: [
      { n: 1, title: 'Enter your site details', desc: 'Add your site name, description, and URL to populate the llms.txt header block.' },
      { n: 2, title: 'Add your key pages', desc: 'List docs, blog, and about pages so AI crawlers know exactly what content to ingest.' },
      { n: 3, title: 'Configure per-crawler rules', desc: 'Toggle access for GPTBot, ClaudeBot, and PerplexityBot individually in robots.txt.' },
      { n: 4, title: 'Download and deploy', desc: 'Deploy llms.txt to your site root and merge the robots.txt snippet into your existing file.' },
    ],
    example: {
      bad: {
        label: 'Site invisible to AI search',
        lines: [
          'GET /llms.txt → 404 Not Found',
          '',
          'robots.txt:',
          'User-agent: GPTBot',
          'Disallow: /',
          'User-agent: ClaudeBot',
          'Disallow: /',
          '',
          '# AI systems cannot read your content',
        ],
        note: 'Blocking all AI crawlers means zero citations in ChatGPT, Perplexity, or Google AI Overviews',
      },
      good: {
        label: 'AI-ready site configuration',
        lines: [
          'GET /llms.txt → 200 OK',
          '# Site: Example Co — Cloud software docs',
          '# Focus: API reference, tutorials, blog',
          '> /docs  Full API documentation',
          '> /blog  Engineering articles',
          '',
          'robots.txt: GPTBot, ClaudeBot → Allow: /',
        ],
        note: 'AI crawlers can ingest and cite your content — appearing in AI-generated answers',
      },
    },
  },
}

const seo    = computed(() => DATA[resolvedSlug.value] ?? null)
const detail = computed(() => DETAILS[resolvedSlug.value] ?? null)

// Inject FAQ JSON-LD
useHead(computed(() => {
  if (!seo.value) return {}
  return {
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seo.value.faq.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }),
    }],
  }
}))

const openIndex = ref<number | null>(null)
function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

const dashboardNavigate = inject<((href: string) => void) | null>('dashboardNavigate', null)
function navigateRelated(href: string) {
  if (dashboardNavigate) dashboardNavigate(href)
  else navigateTo(href)
}
</script>

<template>
  <div v-if="seo" class="seo-section">

    <!-- ── Documentation header ─────────────────────────────── -->
    <div class="seo-doc-header">
      <div class="seo-doc-header-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Documentation</span>
      </div>
    </div>

    <!-- ── About ─────────────────────────────────────────────── -->
    <div class="seo-intro">
      <div class="seo-heading">
        <div class="seo-heading-line" />
        <span>About</span>
      </div>
      <p class="seo-intro-text">{{ seo.intro }}</p>
    </div>

    <!-- ── How to use ─────────────────────────────────────────── -->
    <div v-if="detail" class="seo-steps">
      <div class="seo-heading">
        <div class="seo-heading-line" />
        <span>How to use</span>
      </div>
      <div class="steps-grid">
        <div v-for="step in detail.steps" :key="step.n" class="step-card">
          <div class="step-num">{{ step.n }}</div>
          <div class="step-body">
            <p class="step-title">{{ step.title }}</p>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Live example ───────────────────────────────────────── -->
    <div v-if="detail" class="seo-example">
      <div class="seo-heading">
        <div class="seo-heading-line" />
        <span>Live example</span>
      </div>
      <div class="example-cols">
        <!-- BAD -->
        <div class="ex-panel ex-panel--bad">
          <div class="ex-top">
            <span class="ex-badge ex-badge--bad">✗ Before</span>
            <span class="ex-label">{{ detail.example.bad.label }}</span>
          </div>
          <div class="ex-code">
            <div v-for="(line, i) in detail.example.bad.lines" :key="i" class="ex-line">{{ line || '\u00a0' }}</div>
          </div>
          <p class="ex-note ex-note--bad">{{ detail.example.bad.note }}</p>
        </div>
        <!-- GOOD -->
        <div class="ex-panel ex-panel--good">
          <div class="ex-top">
            <span class="ex-badge ex-badge--good">✓ After</span>
            <span class="ex-label">{{ detail.example.good.label }}</span>
          </div>
          <div class="ex-code">
            <div v-for="(line, i) in detail.example.good.lines" :key="i" class="ex-line">{{ line || '\u00a0' }}</div>
          </div>
          <p class="ex-note ex-note--good">{{ detail.example.good.note }}</p>
        </div>
      </div>
    </div>

    <!-- ── FAQ ───────────────────────────────────────────────── -->
    <div class="seo-faq">
      <div class="seo-heading">
        <div class="seo-heading-line" />
        <span>Frequently asked questions</span>
      </div>
      <div class="seo-faq-list">
        <div
          v-for="(item, i) in seo.faq"
          :key="i"
          class="seo-faq-item"
          @click="toggle(i)"
        >
          <div class="seo-faq-q">
            <span>{{ item.q }}</span>
            <svg
              class="seo-faq-chevron"
              :class="{ open: openIndex === i }"
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="seo-faq-a" :class="{ visible: openIndex === i }">
            <p>{{ item.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Related tools ─────────────────────────────────────── -->
    <div v-if="seo.related.length" class="seo-related">
      <span class="seo-related-label">See also</span>
      <div class="seo-related-links">
        <button
          v-for="r in seo.related"
          :key="r.href"
          class="seo-related-link"
          :style="`--rc: ${r.color}`"
          @click="navigateRelated(r.href)"
        >{{ r.title }} →</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.seo-section {
  margin-top: 64px; padding-top: 40px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; gap: 36px;
}

/* ── Documentation header ── */
.seo-doc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: -8px;
}
.seo-doc-header-left {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Space Grotesk', sans-serif; font-size: 13px;
  font-weight: 700; color: rgba(255,255,255,0.65);
}
.seo-doc-header-left svg { color: rgba(255,255,255,0.35); }

/* ── Intro ── */
.seo-intro { display: flex; flex-direction: column; gap: 12px; }
.seo-intro-text {
  font-family: 'DM Sans', sans-serif; font-size: 14px;
  color: rgba(255,255,255,0.58); line-height: 1.8;
  max-width: 720px; margin: 0;
}

/* ── Shared heading ── */
.seo-heading {
  display: flex; align-items: center; gap: 12px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px;
  font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,0.28); margin-bottom: 4px;
}
.seo-heading-line { width: 24px; height: 1px; background: rgba(255,255,255,0.12); flex-shrink: 0; }

/* ── FAQ ── */
.seo-faq-list { display: flex; flex-direction: column; }
.seo-faq-item { border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; user-select: none; }
.seo-faq-q {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 13px 0; font-family: 'Space Grotesk', sans-serif; font-size: 13px;
  font-weight: 600; color: rgba(255,255,255,0.65); transition: color 0.15s;
}
.seo-faq-item:hover .seo-faq-q { color: rgba(255,255,255,0.88); }
.seo-faq-chevron { flex-shrink: 0; color: rgba(255,255,255,0.25); transition: transform 0.2s cubic-bezier(0.4,0,0.2,1); }
.seo-faq-chevron.open { transform: rotate(180deg); color: rgba(255,255,255,0.55); }
.seo-faq-a { overflow: hidden; max-height: 0; opacity: 0; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease; }
.seo-faq-a.visible { max-height: 400px; opacity: 1; }
.seo-faq-a p { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.72; margin: 0 0 14px; padding-right: 24px; }

/* ── Steps ── */
.steps-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
@media (max-width: 600px) { .steps-grid { grid-template-columns: 1fr; } }

.step-card {
  display: flex; gap: 14px; align-items: flex-start;
  background: #0d0d14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 16px;
}
.step-num {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  background: #ec3586; display: flex; align-items: center; justify-content: center;
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 800;
  color: white; line-height: 1;
}
.step-body { display: flex; flex-direction: column; gap: 4px; }
.step-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.82); margin: 0; }
.step-desc  { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.6; margin: 0; }

/* ── Good vs Bad ── */
.example-cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
@media (max-width: 680px) { .example-cols { grid-template-columns: 1fr; } }

.ex-panel {
  border-radius: 10px; border: 1px solid; overflow: hidden;
  display: flex; flex-direction: column;
}
.ex-panel--bad  { border-color: rgba(255,71,87,0.3); }
.ex-panel--good { border-color: rgba(0,212,170,0.3); }

.ex-top {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}
.ex-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 4px; flex-shrink: 0;
}
.ex-badge--bad  { color: #ff4757; background: rgba(255,71,87,0.12); border: 1px solid rgba(255,71,87,0.25); }
.ex-badge--good { color: #00d4aa; background: rgba(0,212,170,0.12); border: 1px solid rgba(0,212,170,0.25); }
.ex-label { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.45); }

.ex-code {
  background: #0a0a10; padding: 12px 14px; flex: 1;
  display: flex; flex-direction: column; gap: 1px;
}
.ex-line {
  font-family: 'Fira Mono', 'Cascadia Code', monospace;
  font-size: 11px; line-height: 1.65; color: rgba(255,255,255,0.60);
  white-space: pre; overflow-x: auto;
}

.ex-note {
  font-family: 'DM Sans', sans-serif; font-size: 11.5px; line-height: 1.55;
  padding: 10px 14px; margin: 0;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.ex-note--bad  { color: rgba(255,71,87,0.75); }
.ex-note--good { color: rgba(0,212,170,0.75); }

/* ── Related ── */
.seo-related { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-bottom: 20px; }
.seo-related-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.22); white-space: nowrap;
}
.seo-related-links { display: flex; gap: 10px; flex-wrap: wrap; }
.seo-related-link {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: color-mix(in srgb, var(--rc) 85%, white); text-decoration: none;
  padding: 5px 10px; border-radius: 5px;
  background: color-mix(in srgb, var(--rc) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--rc) 20%, transparent);
  transition: background 0.15s, border-color 0.15s;
  cursor: pointer; display: inline-flex; align-items: center;
}
.seo-related-link:hover {
  background: color-mix(in srgb, var(--rc) 16%, transparent);
  border-color: color-mix(in srgb, var(--rc) 35%, transparent);
}
</style>
