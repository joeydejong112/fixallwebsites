# SiteFix Scan Check Names

# These are the exact checkName strings used throughout

# the codebase. Every reference must use these exact

# strings — not variations, not abbreviations.

# The impact predictor, feedback system, illustration

# system, and fix guides all key off these strings.

---

## Why this file exists

If Agent 2 saves a result with checkName "missing-title"
but lib/impactScores.ts uses "meta-title-missing",
the impact predictor shows nothing for that check.
If the illustration system uses "title-missing",
the wrong illustration renders.
Consistency across all agents is critical.

---

## SEO checks

meta-title-missing
meta-title-too-long
meta-title-too-short
meta-description-missing
meta-description-too-long
meta-description-too-short
h1-missing
h1-multiple
heading-hierarchy-skipped
canonical-missing
canonical-invalid
robots-txt-missing
robots-txt-inaccessible
sitemap-missing
sitemap-inaccessible
og-title-missing
og-description-missing
og-image-missing
images-missing-alt

---

## Security checks

https-not-enforced
ssl-certificate-invalid
ssl-certificate-expiring
hsts-missing
csp-missing
x-frame-options-missing
x-content-type-options-missing
referrer-policy-missing
permissions-policy-missing
mixed-content-found

---

## Performance checks

ttfb-slow
page-size-large
images-missing-dimensions
render-blocking-scripts
compression-missing

---

## Accessibility checks

images-missing-alt-accessibility
inputs-missing-labels
html-lang-missing
links-no-descriptive-text
h1-missing-accessibility

---

## Technical checks

broken-links-found
redirect-chain-long
noindex-tag-found
charset-missing
favicon-missing

---

## Mobile checks

viewport-missing
apple-touch-icon-missing
font-size-too-small

---

## Important notes

1. Some checks overlap between pillars. For example
   images-missing-alt appears in both SEO and
   Accessibility. Store them as separate records
   with different pillar values:
   pillar: "seo", checkName: "images-missing-alt"
   pillar: "accessibility", checkName: "images-missing-alt-accessibility"

2. Use the exact strings above. Do not use:
   "missing_title" (underscores)
   "missingTitle" (camelCase)
   "Missing Title" (title case)
   Only hyphenated lowercase.

3. lib/impactScores.ts must have an entry for every
   single checkName above. If a check has no entry,
   the fix impact predictor shows nothing for it.

4. The illustration system keys off checkName.
   If a new check is added, add its illustration
   to the illustration registry in AGENT_MEMORY.md.

---

## Impact scores reference (for lib/impactScores.ts)

| checkName                        | scoreGain | traffic        | effort    |
| -------------------------------- | --------- | -------------- | --------- |
| meta-title-missing               | 8         | +15-30% CTR    | 5 mins    |
| meta-title-too-long              | 4         | +5-10% CTR     | 5 mins    |
| meta-title-too-short             | 3         | +5% CTR        | 5 mins    |
| meta-description-missing         | 8         | +10-25% CTR    | 5 mins    |
| meta-description-too-long        | 3         | +5% CTR        | 5 mins    |
| meta-description-too-short       | 3         | +5% CTR        | 5 mins    |
| h1-missing                       | 6         | Ranking signal | 15 mins   |
| h1-multiple                      | 3         | Ranking signal | 5 mins    |
| heading-hierarchy-skipped        | 2         | Accessibility  | 30 mins   |
| canonical-missing                | 5         | Duplicate risk | 15 mins   |
| canonical-invalid                | 7         | Ranking loss   | 15 mins   |
| robots-txt-missing               | 3         | Crawl signal   | 5 mins    |
| robots-txt-inaccessible          | 4         | Crawl block    | 15 mins   |
| sitemap-missing                  | 5         | Crawl speed    | 30 mins   |
| sitemap-inaccessible             | 4         | Crawl speed    | 15 mins   |
| og-title-missing                 | 4         | Social CTR     | 5 mins    |
| og-description-missing           | 3         | Social CTR     | 5 mins    |
| og-image-missing                 | 5         | Social CTR     | 15 mins   |
| images-missing-alt               | 4         | Image search   | 30 mins   |
| https-not-enforced               | 10        | Trust/SEO      | 1-2 hours |
| ssl-certificate-invalid          | 10        | Trust loss     | 1-2 hours |
| ssl-certificate-expiring         | 8         | Prevent outage | 30 mins   |
| hsts-missing                     | 6         | Security       | 5 mins    |
| csp-missing                      | 5         | XSS protection | 1-2 hours |
| x-frame-options-missing          | 4         | Clickjacking   | 5 mins    |
| x-content-type-options-missing   | 3         | MIME attacks   | 5 mins    |
| referrer-policy-missing          | 3         | Privacy        | 5 mins    |
| permissions-policy-missing       | 3         | Privacy        | 5 mins    |
| mixed-content-found              | 7         | Trust/ranking  | 30 mins   |
| ttfb-slow                        | 6         | +0.5-2s speed  | half day  |
| page-size-large                  | 4         | Load time      | 1-2 hours |
| images-missing-dimensions        | 5         | Layout shift   | 30 mins   |
| render-blocking-scripts          | 5         | +0.3-0.8s      | 30 mins   |
| compression-missing              | 4         | Load time      | 30 mins   |
| images-missing-alt-accessibility | 7         | Screen readers | 30 mins   |
| inputs-missing-labels            | 6         | WCAG AA        | 30 mins   |
| html-lang-missing                | 4         | Screen readers | 5 mins    |
| links-no-descriptive-text        | 3         | Accessibility  | 1-2 hours |
| h1-missing-accessibility         | 5         | Screen readers | 15 mins   |
| broken-links-found               | 7         | UX + crawl     | 1-2 hours |
| redirect-chain-long              | 4         | Load time      | 30 mins   |
| noindex-tag-found                | 9         | Invisible risk | 5 mins    |
| charset-missing                  | 2         | Encoding       | 5 mins    |
| favicon-missing                  | 2         | Brand trust    | 15 mins   |
| viewport-missing                 | 8         | Mobile ranking | 5 mins    |
| apple-touch-icon-missing         | 2         | PWA/mobile     | 15 mins   |
| font-size-too-small              | 3         | Readability    | 30 mins   |
