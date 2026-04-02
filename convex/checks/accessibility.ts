import type { ScanIssue, PillarResult } from './types'

export function runAccessibilityChecks(html: string): PillarResult {
  const issues: ScanIssue[] = []
  const checks: boolean[] = []

  // 1. lang attribute on <html>
  const hasLang = /<html[^>]*\slang=["'][^"']+["']/i.test(html)
  checks.push(hasLang)
  if (!hasLang) {
    issues.push({ pillar: 'accessibility', severity: 'critical', title: 'Missing lang attribute', description: 'Add a lang attribute to <html> (e.g. lang="en") so screen readers use the correct pronunciation.' })
  }

  // 2. Images without alt
  const allImgs = html.match(/<img[^>]*>/gi) ?? []
  let missingAlt = 0
  for (const tag of allImgs) {
    if (!/\balt=/i.test(tag)) missingAlt++
  }
  const altPass = missingAlt === 0
  checks.push(altPass)
  if (!altPass) {
    issues.push({ pillar: 'accessibility', severity: 'critical', title: 'Images without alt text', description: `${missingAlt} image(s) have no alt attribute. Screen readers cannot describe these to users.` })
  }

  // 3. Form inputs without associated label
  const inputs = html.match(/<input[^>]*>/gi) ?? []
  let unlabelledInputs = 0
  for (const tag of inputs) {
    // Skip hidden, submit, button, image types
    if (/type=["'](?:hidden|submit|button|image|reset)["']/i.test(tag)) continue
    const idMatch = tag.match(/\bid=["']([^"']+)["']/i)
    const hasAriaLabel = /aria-label=/i.test(tag)
    const hasAriaLabelledby = /aria-labelledby=/i.test(tag)
    const hasPlaceholderOnly = /placeholder=/i.test(tag) // not sufficient but common
    if (hasAriaLabel || hasAriaLabelledby) continue
    if (idMatch) {
      const inputId = idMatch[1]
      const labelPattern = new RegExp(`<label[^>]*\\bfor=["']${inputId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i')
      if (labelPattern.test(html)) continue
    }
    // Check if input is nested inside a <label>
    // Simple heuristic: search backward for <label> without </label> in between
    const inputIndex = html.indexOf(tag)
    const beforeInput = html.substring(Math.max(0, inputIndex - 500), inputIndex)
    const lastLabelOpen = beforeInput.lastIndexOf('<label')
    const lastLabelClose = beforeInput.lastIndexOf('</label')
    if (lastLabelOpen > lastLabelClose) continue
    unlabelledInputs++
  }
  const labelPass = unlabelledInputs === 0
  checks.push(labelPass)
  if (!labelPass) {
    issues.push({ pillar: 'accessibility', severity: 'critical', title: 'Inputs without labels', description: `${unlabelledInputs} form input(s) lack an associated <label>. Screen readers need labels to identify fields.` })
  }

  // 4. Buttons with no accessible name
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) ?? []
  let emptyButtons = 0
  for (const btn of buttons) {
    const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(btn)
    const hasAriaLabelledby = /aria-labelledby=/i.test(btn)
    if (hasAriaLabel || hasAriaLabelledby) continue
    const textContent = btn.replace(/<[^>]+>/g, '').trim()
    if (!textContent) emptyButtons++
  }
  const buttonPass = emptyButtons === 0
  checks.push(buttonPass)
  if (!buttonPass) {
    issues.push({ pillar: 'accessibility', severity: 'critical', title: 'Buttons without accessible name', description: `${emptyButtons} button(s) have no visible text or aria-label. Add descriptive labels.` })
  }

  // 5. Heading hierarchy — no skipped levels
  const headingMatches = html.match(/<h([1-6])[^>]*>/gi) ?? []
  const levels = headingMatches.map(h => parseInt(h.match(/<h([1-6])/i)![1], 10))
  let hierarchyValid = true
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      hierarchyValid = false
      break
    }
  }
  checks.push(hierarchyValid)
  if (!hierarchyValid) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Skipped heading levels', description: 'Headings skip levels (e.g. h2 → h4). Maintain a logical h1 → h2 → h3 sequence.' })
  }

  // 6. ARIA landmarks
  const hasMain = /<main[^>]*>/i.test(html) || /role=["']main["']/i.test(html)
  const hasNav = /<nav[^>]*>/i.test(html) || /role=["']navigation["']/i.test(html)
  const hasFooter = /<footer[^>]*>/i.test(html) || /role=["']contentinfo["']/i.test(html)
  const landmarkPass = hasMain && hasNav
  checks.push(landmarkPass)
  if (!landmarkPass) {
    const missing = [!hasMain && '<main>', !hasNav && '<nav>', !hasFooter && '<footer>'].filter(Boolean).join(', ')
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Missing ARIA landmarks', description: `Missing landmark regions: ${missing}. These help screen reader users navigate the page.` })
  }

  // 7. Non-descriptive link text
  const links = html.match(/<a[^>]*>[\s\S]*?<\/a>/gi) ?? []
  const badLinkTexts = ['click here', 'here', 'read more', 'learn more', 'more', 'link']
  let badLinks = 0
  for (const link of links) {
    const text = link.replace(/<[^>]+>/g, '').trim().toLowerCase()
    if (badLinkTexts.includes(text)) badLinks++
  }
  const linkTextPass = badLinks === 0
  checks.push(linkTextPass)
  if (!linkTextPass) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Non-descriptive link text', description: `${badLinks} link(s) use vague text like "click here" or "read more". Use descriptive text.` })
  }

  // 8. Auto-playing media
  const hasAutoplay = /<(?:video|audio)[^>]*\bautoplay\b/i.test(html)
  checks.push(!hasAutoplay)
  if (hasAutoplay) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Auto-playing media detected', description: 'Auto-playing video or audio can be disorienting. Provide controls and avoid autoplay.' })
  }

  // 9. Skip-navigation link
  const firstLinks = html.match(/<a[^>]*href=["']#[^"']*["'][^>]*>/gi) ?? []
  const hasSkipNav = firstLinks.some(link =>
    /#(?:main|content|main-content|skip)/i.test(link)
  )
  checks.push(hasSkipNav)
  if (!hasSkipNav) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'No skip-navigation link', description: 'Add a "Skip to content" link as the first focusable element for keyboard users.' })
  }

  // 10. Tabindex abuse (tabindex > 0)
  const tabindexMatches = html.match(/tabindex=["'](\d+)["']/gi) ?? []
  let badTabindex = 0
  for (const match of tabindexMatches) {
    const val = parseInt(match.match(/tabindex=["'](\d+)["']/i)![1], 10)
    if (val > 0) badTabindex++
  }
  const tabindexPass = badTabindex === 0
  checks.push(tabindexPass)
  if (!tabindexPass) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Positive tabindex values', description: `${badTabindex} element(s) have tabindex > 0. This disrupts natural tab order. Use 0 or -1 instead.` })
  }

  // 11. Duplicate IDs
  const idMatches = html.match(/\bid=["']([^"']+)["']/gi) ?? []
  const ids = idMatches.map(m => m.match(/id=["']([^"']+)["']/i)![1])
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id)
    seen.add(id)
  }
  const noDupes = dupes.size === 0
  checks.push(noDupes)
  if (!noDupes) {
    issues.push({ pillar: 'accessibility', severity: 'warning', title: 'Duplicate IDs', description: `${dupes.size} duplicate ID(s) found: ${[...dupes].slice(0, 5).join(', ')}${dupes.size > 5 ? '...' : ''}. IDs must be unique.` })
  }

  // 12. Focus killer — outline: none on :focus without :focus-visible
  const inlineStyles = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []
  let focusKiller = false
  for (const style of inlineStyles) {
    const content = style.replace(/<\/?style[^>]*>/gi, '')
    if (/:\s*focus\b[^{]*\{[^}]*outline\s*:\s*(?:none|0)/i.test(content)) {
      if (!/:focus-visible/i.test(content)) {
        focusKiller = true
      }
    }
  }
  checks.push(!focusKiller)
  if (focusKiller) {
    issues.push({ pillar: 'accessibility', severity: 'critical', title: 'Focus outline removed', description: 'Inline styles remove outline on :focus without :focus-visible fallback. Keyboard users cannot see focus.' })
  }

  const passing = checks.filter(Boolean).length
  const score = Math.round((passing / checks.length) * 100)

  return { score, issues }
}
