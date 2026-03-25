# ScanPulse Design System

This document captures every design decision made on the landing page so any new page, component, or section can match exactly.

---

## Brand Personality

**Dark. Editorial. Data-forward.**

ScanPulse is a diagnostic tool — not a marketing site. The visual language should feel like a live instrument panel: precise, confident, no decoration that doesn't carry meaning. Typography is large and unapologetic. Colour is used to communicate status, not decoration. Motion is purposeful — it shows data arriving, not just "looking cool".

---

## Colour Tokens

Defined in `tailwind.config.ts` and used consistently across every component.

### Base

| Token | Hex | Usage |
|---|---|---|
| `dark` | `#07070a` | Page background — near-black with a blue-black tint, never pure black |
| `dark-surface` | `#0f0f14` | Card backgrounds, elevated panels |
| `dark-elevated` | `#16161e` | Inputs, secondary surfaces |
| `dark-border` | `rgba(255,255,255,0.07)` | Default border — barely visible, just enough to separate surfaces |

### Brand

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#ec3586` | CTAs, active states, the one colour that stands out |
| `primary-hover` | `#d42e77` | Hover state for primary buttons |

### Pillars (semantic + status)

| Token | Hex | Semantic meaning |
|---|---|---|
| `security` / `success` | `#00d4aa` | Security pillar, PASS status |
| `performance` / `warning` | `#ffaa00` | Performance pillar, WARNING status |
| `seo` | `#6c5ce7` | SEO pillar |
| `danger` | `#ff4757` | CRITICAL status, hard failures |

### Opacity conventions

- `text-white` — headings, key numbers
- `text-white/50` — body copy, secondary text
- `text-white/30` — tertiary, muted labels
- `text-white/20` — disabled, placeholder
- `border-white/[0.04–0.07]` — subtle dividers and borders

### Ambient glows

Used on dark backgrounds to add depth without adding UI clutter. Always radial-gradient, always low opacity (0.06–0.10), never on interactive elements.

```css
/* Primary section glow */
background: radial-gradient(ellipse at 50% 0%, rgba(236,53,134,0.08) 0%, transparent 70%)

/* Per-pillar column glow */
background: radial-gradient(ellipse at 50% 0%, {color}10 0%, transparent 60%)
```

---

## Typography

### Fonts

```css
font-display: 'Space Grotesk', sans-serif   /* All headings, labels, numbers, CTAs */
font-body:    'DM Sans', sans-serif         /* Body copy, descriptions, fine print */
```

Loaded via Google Fonts in `main.css`. **Never use system fonts or Inter.**

### Scale — fluid with `clamp()`

All major headings use fluid sizing so they breathe on wide screens without breaking on smaller ones.

| Element | Size rule | Example |
|---|---|---|
| Hero H1 | `clamp(3.6rem, 7.5vw, 6.2rem)` | "Your site's vital signs, live." |
| Section H2 | `clamp(2.4rem, 4vw, 3.6rem)` | "Simple pricing. No surprises." |
| Pricing price | `3.8rem` fixed | "$19" |
| Step number | `clamp(3.6rem, 6vw, 5rem)` | "01" |

### Weight convention

- `font-bold` (700) — headings, prices, key numbers
- `font-semibold` (600) — buttons, labels, eyebrows
- `font-medium` (500) — secondary labels, nav items
- `font-normal` (400) — body copy only

### Letter-spacing

- Headings: `tracking-[-0.03em]` to `tracking-[-0.05em]` — tight, editorial
- Eyebrows / labels: `tracking-[0.16em]` to `tracking-[0.2em]` — spaced, uppercase
- Body copy: default tracking

### Eyebrow pattern

Every section opens with an eyebrow: a short coloured line + uppercase label in primary pink.

```html
<div class="flex items-center gap-3 mb-8">
  <div class="w-7 h-px bg-primary" />
  <span class="text-[11px] font-display font-semibold tracking-[0.2em] uppercase text-primary">
    SECTION LABEL
  </span>
</div>
```

### Faded second line

H2s often have a faded second line to create weight contrast without a hard break:

```html
<h2 class="font-display font-bold text-white leading-[0.88] tracking-[-0.04em]">
  Bold statement.<br />
  <span class="text-white/25">Softer qualifier.</span>
</h2>
```

---

## Layout

### Snap-scroll sections

The landing page is a fullscreen snap-scroll experience. Each section is exactly `h-screen`. The container is:

```html
<div class="h-screen overflow-y-scroll snap-container bg-dark">
```

With CSS:
```css
.snap-container {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.snap-section {
  scroll-snap-align: start;
  height: 100vh;
}
```

**Never put content that overflows vertically inside a snap section.** Everything must fit within `100vh`.

### Content padding

- Left/right padding: `px-16 xl:px-24` (64px / 96px)
- This creates consistent margins that the grid bg and left timeline respect

### Two-column split

Hero and most sections use a `grid grid-cols-2` or implicit left/right split:

- **Left**: Heading, eyebrow, CTA, trust signals (~40% of width)
- **Right**: Visual element — live feed, results card, score rings (~60% of width)

Never centre-align section content. Left-aligned creates tension and feels more designed.

### Grid background

Applied to sections that need depth without added elements:

```html
<div class="absolute inset-0 pointer-events-none"
  style="background-image:
    linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);
  background-size: 64px 64px" />
```

---

## Components

### Buttons

```html
<!-- Primary CTA -->
<button class="bg-primary hover:bg-primary-hover text-white font-display font-semibold
               px-8 py-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
  Run free scan →
</button>

<!-- Secondary / Ghost -->
<button class="border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80
               font-display font-semibold rounded-[10px] px-8 py-4 transition-all duration-200">
  Start free
</button>
```

Rules:
- Primary button is always `bg-primary` — never gradient, never glow border
- Only one primary button per section
- Hover: `hover:-translate-y-0.5` lifts the button slightly — no `scale`
- Active: `active:translate-y-0` snaps it back

### Status badges

```html
<!-- PASS -->
<span class="badge-success">PASS</span>
<!-- WARNING -->
<span class="badge-warning">WARNING</span>
<!-- CRITICAL -->
<span class="badge-danger">CRITICAL</span>
```

Built from the `.badge` utility in `main.css`. Always uppercase, always `font-display`.

### Live feed row

The pattern used in the hero live feed — also usable in results pages:

```html
<div class="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
  <!-- Status dot -->
  <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: item.color }" />
  <!-- Title + pillar -->
  <div class="flex-1 min-w-0">
    <div class="text-[13px] font-display font-medium text-white/85 truncate">{{ item.title }}</div>
    <div class="text-[10px] font-display font-semibold tracking-[0.12em] uppercase" :style="{ color: item.color }">
      {{ item.pillar }}
      <span :class="statusClass">{{ item.status }}</span>
    </div>
  </div>
  <!-- Domain -->
  <span class="text-[11px] font-body text-white/20 shrink-0">{{ item.url }}</span>
</div>
```

### Section dividers

Between the left content and right visual panel, use a vertical `w-px bg-white/[0.04]` line — not a gap or padding.

### Numbered steps (How It Works)

Large faded number + thin border bottom + title + description + bottom accent line.

```html
<div class="border-b border-white/[0.06] pb-10 flex flex-col">
  <!-- Big faded number -->
  <div class="font-display font-bold text-white/[0.06] leading-none mb-6"
       style="font-size: clamp(3.6rem, 6vw, 5rem); letter-spacing: -0.05em">
    {{ step.num }}
  </div>
  <!-- Short top accent line -->
  <div class="w-6 h-px mb-8" :style="{ background: step.color }" />
  <h3 class="font-display font-bold text-white mb-4" style="font-size: 1.35rem">{{ step.title }}</h3>
  <p class="font-body text-white/45 leading-relaxed text-[14px] flex-1">{{ step.desc }}</p>
  <!-- Bottom accent line -->
  <div class="w-6 h-0.5 mt-8" :style="{ background: step.color }" />
</div>
```

### Pricing columns

Full-height columns instead of cards. Each column is a vertical stripe with:
- 2px top accent line in pillar colour (full width on Pro, 30% opacity on others)
- Column glow radial gradient at the top
- Scan limit in accent colour, uppercase, tracked
- Checkmark SVG in accent colour (not a bullet dot)
- CTA pinned to bottom via `flex-1` on the features list

Pro column: `pricing-col--highlight` adds a subtle pink background and the "Most popular" badge.

---

## Motion

### Principle

One well-orchestrated effect per section beats scattered micro-animations. Use motion to show data arriving, not to fill empty space.

### Keyframes defined in `main.css`

```css
@keyframes scan-beam  { 0%,100% { transform: translateY(0) }   50% { transform: translateY(80px) } }
@keyframes float      { 0%,100% { transform: translateY(0) }   50% { transform: translateY(-6px) } }
@keyframes pulse-ring { 0% { opacity: 0.6; transform: scale(1) } 100% { opacity: 0; transform: scale(2.2) } }
@keyframes spin-slow  { from { transform: rotate(0deg) }        to   { transform: rotate(360deg) } }
```

### Live feed scroll

The hero's right panel autoscrolls using a CSS keyframe (not JS):

```css
@keyframes feed-scroll {
  0%   { transform: translateY(0) }
  100% { transform: translateY(-50%) }
}
.feed-track { animation: feed-scroll 28s linear infinite; }
.feed-track:hover { animation-play-state: paused; }
```

### Easing

Always use `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out) for state transitions. Never use `bounce` or `elastic`.

For entrance animations, prefer `cubic-bezier(0.0, 0, 0.2, 1)` (ease-out) — fast start, smooth landing.

### Reduced motion

Always respect:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## Navigation

### Navbar

Fixed, full-width, `z-50`. Three zones:
- **Left**: Logo (SVG radar mark + wordmark in Space Grotesk)
- **Centre**: Live scan counter badge
- **Right**: Auth state — Dashboard link + UserButton if signed in, or Sign In / Get started CTAs if not

Background: `rgba(7,7,10,0.85)` with `backdrop-filter: blur(20px)`. Bottom border: `border-b border-white/[0.06]`.

### Left timeline nav

Fixed vertical timeline on the left edge (`left-6`, centred vertically). One dot per section, connected by a vertical line. Active dot is pink with glow; the connector fills with pink as you advance through sections.

```css
.timeline-dot.is-active {
  width: 10px;
  height: 10px;
  background: #ec3586;
  box-shadow: 0 0 12px rgba(236,53,134,0.6);
}
.timeline-line-fill {
  background: #ec3586;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Section detection uses a debounced scroll listener on the snap container:
```ts
el.addEventListener('scroll', () => {
  currentSection.value = Math.round(el.scrollTop / window.innerHeight)
}, { passive: true })
```

---

## Pages

### Landing page (`/`)

5 snap sections in order:

| # | Section | Key visual |
|---|---|---|
| 01 | Hero + Live Feed | Left: headline + stats + CTA. Right: autoscrolling live scan results |
| 02 | Coverage | Left: "15+ checks. Three pillars. One score." Right: 3-column pillar grid with check lists |
| 03 | How It Works | 3-step horizontal grid with numbered steps and per-step accent colours |
| 04 | Sample Result | Left: issue list. Right: score display with pillar breakdown bars |
| 05 | Pricing | Full-height 3-column layout with Free / Pro / Agency tiers |

### Dashboard (`/dashboard`)

Auth-protected. Same dark bg + navbar. Scan history table. Heading uses the same `clamp` sizing as section H2s.

### Results (`/results`)

Auth-protected. Overall score at `clamp(4rem, 8vw, 6rem)`. Pillar bars `h-2`. Issue items use left-border severity accent (red/amber/teal — matching `danger`/`warning`/`success` tokens).

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `text-white/50` for body copy on dark | Use grey text (`text-gray-400`) — always tint toward white |
| Use `clamp()` for all major heading sizes | Use fixed px sizes for headings |
| One primary pink CTA per section | Multiple pink buttons in the same section |
| Left-align headings | Centre-align page sections |
| Use status colours semantically (teal=pass, amber=warn, red=critical) | Use status colours decoratively |
| Keep snap sections within `100vh` | Let section content scroll internally (except the live feed) |
| Faded opacity on second headline line | Two fully white lines — use contrast to show hierarchy |
| Ambient radial glow behind key elements | Glassmorphism, glow borders on cards |
| Checkmark SVG for feature lists | Bullet dots or emoji |
| `backdrop-filter: blur` on the navbar | Solid opaque navbar |
