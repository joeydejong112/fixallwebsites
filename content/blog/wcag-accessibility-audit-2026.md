---
title: "How to pass a WCAG accessibility audit in 2026"
description: "WCAG 2.1 Level AA is the standard required by ADA, EN 301 549, and the UK Equality Act. Here's a practical checklist covering the 12 checks ScanPulse runs on every site."
date: "2026-04-08"
author: "ScanPulse"
pillar: "Accessibility"
pillarColor: "#a29bfe"
readingTime: "7 min read"
---

# How to pass a WCAG accessibility audit in 2026

Web Content Accessibility Guidelines (WCAG) 2.1 Level AA is the accessibility standard referenced by the Americans with Disabilities Act (ADA), the European EN 301 549, and the UK Equality Act. Failing it exposes you to legal risk, excludes users with disabilities, and — increasingly — signals poor quality to search engines. Google's Page Experience update considers accessibility factors, and sites with better usability tend to have lower bounce rates and higher dwell time.

The good news: most WCAG failures are mechanical and fixable with a few hours of focused work. Here's what ScanPulse checks on every scan, and how to fix each one.

## 1. Language attribute on `<html>`

```html
<html lang="en">
```

Screen readers use the `lang` attribute to determine how to pronounce text. Missing it means users with vision impairments hear content mispronounced. **Fix:** Add `lang="en"` (or your site's language code) to the root `<html>` element.

## 2. Images without `alt` text

Every `<img>` tag needs an `alt` attribute. Decorative images get `alt=""` (empty, not missing). Informative images need descriptive text. ScanPulse flags any `<img>` with a missing `alt` attribute as **Critical**.

```html
<!-- Bad -->
<img src="hero.jpg">

<!-- Good — decorative -->
<img src="divider.svg" alt="">

<!-- Good — informative -->
<img src="dashboard-screenshot.png" alt="ScanPulse dashboard showing a scan in progress">
```

## 3. Form inputs without labels

Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>`. Use the `for`/`id` pairing or wrap the input inside the label element. Placeholder text is not a substitute — it disappears when the user types.

```html
<!-- Bad -->
<input type="email" placeholder="Email address">

<!-- Good -->
<label for="email">Email address</label>
<input type="email" id="email">
```

## 4. Buttons without accessible names

A `<button>` must have text content, an `aria-label`, or an `aria-labelledby` reference. Icon-only buttons are a very common failure — an X button with no text label is invisible to screen readers.

```html
<!-- Bad -->
<button><svg>...</svg></button>

<!-- Good -->
<button aria-label="Close dialog"><svg>...</svg></button>
```

## 5. Heading hierarchy

Headings (`h1`–`h6`) must form a logical outline. Jumping from `<h1>` to `<h3>` (skipping `<h2>`) confuses screen reader navigation. There should be exactly one `<h1>` per page, and subheadings should nest correctly.

ScanPulse parses your heading tree and flags any skipped levels.

## 6. ARIA landmarks

Pages should have `<main>`, `<nav>`, and `<footer>` elements (or equivalent `role=` attributes). These landmark roles let screen reader users jump between page sections without tabbing through every element. ScanPulse checks for their presence.

## 7. Non-descriptive link text

Links like "click here", "read more", or "learn more" are meaningless out of context. Screen reader users often navigate by listing all links on a page — if every link says "click here", they have no idea where each goes.

```html
<!-- Bad -->
<a href="/blog/hsts">Click here</a>

<!-- Good -->
<a href="/blog/hsts">Read: What is HSTS and why your site needs it</a>
```

## 8. Colour contrast

WCAG 2.1 Level AA requires:
- **4.5:1** ratio for normal text
- **3:1** ratio for large text (18pt+ or 14pt bold)

White text on a light grey background is a very common failure. Use our [WCAG Colour Contrast Checker](/tools/contrast-checker) to test any colour combination in seconds.

## 9. Focus visibility

All interactive elements must have a visible focus indicator. CSS like `outline: none` without `:focus-visible` styling is a WCAG failure that affects keyboard users and users of switch access devices.

ScanPulse checks inline `<style>` blocks for `outline: none` on `:focus` without a `:focus-visible` alternative.

## 10. Tabindex abuse

`tabindex` values greater than 0 (`tabindex="1"`, `tabindex="2"`) disrupt the natural tab order and should never be used. `tabindex="0"` (adds an element to tab order) and `tabindex="-1"` (removes it) are fine.

## 11. Duplicate IDs

`id` values must be unique on a page. Duplicate IDs break ARIA relationships (`aria-labelledby`, `aria-describedby`) and confuse screen readers. ScanPulse collects all `id` attributes and flags any duplicates as **Critical**.

## 12. Auto-playing media

`<video autoplay>` and `<audio autoplay>` without `muted` can disorient users with screen readers and violate WCAG 1.4.2 (Audio Control). Always add `muted` for auto-playing video, or provide a visible pause control.

## Run an automated check first

ScanPulse runs all 12 of these checks automatically on every scan — for free. Start with an automated check to find the low-hanging fruit, then layer in manual testing with a screen reader (VoiceOver on macOS, NVDA on Windows, TalkBack on Android).

→ [Run a free accessibility scan](/)

→ [Check your colour contrast](/tools/contrast-checker)
