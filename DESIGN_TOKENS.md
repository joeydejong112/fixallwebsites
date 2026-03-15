# SiteFix Design Tokens

# Every agent building UI must read this file first.

# These values are absolute. Never deviate from them.

---

## Fonts

Import URL (add to app/layout.tsx):
https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap

Heading font: Outfit, weight 800
Subheading: Outfit, weight 700
UI labels: Outfit, weight 500
Body text: Outfit, weight 400
Code / values: JetBrains Mono, weight 400

Letter spacing on headings >= 24px: -0.04em
Line height for paragraphs: 1.7
Line height for UI labels: 1.3
Muted text opacity: rgba(238,234,248,0.38)

NEVER use: Inter, Roboto, Arial, system-ui
NEVER use: font-weight 600 or 700 (only 400, 500, 800)

---

## Colors — exact hex values, never approximate

### Backgrounds (darkest to lightest)

--page-bg: #0c0c14 ← body/page background
--card-bg: #131220 ← all cards
--elevated-bg: #16152a ← modals, expanded states
--hover-bg: #1a1830 ← hover states only
--deep-inset: #0e0d1c ← illustration panels, code blocks

### Borders

--border-default: rgba(255,255,255,0.05)
--border-subtle: rgba(255,255,255,0.07)
--border-active: rgba(124,106,255,0.25)
--border-accent: rgba(124,106,255,0.18)

### Text

--text-primary: #eeeaf8
--text-secondary: rgba(238,234,248,0.55)
--text-muted: rgba(238,234,248,0.38)
--text-disabled: rgba(238,234,248,0.22)

### Brand accents

--purple: #7c6aff ← primary brand, CTAs, active states
--purple-light: #a89dff ← secondary, links, step numbers
--green: #6ee7b7 ← success, score >= 80, pass states
--amber: #f59e0b ← warning, score 60-79, medium issues
--red: #f87171 ← critical, score < 60, high issues
--blue: #60a5fa ← info, technical pillar

### Score color rules (use everywhere a score appears)

score >= 80: #6ee7b7
score 60-79: #f59e0b
score < 60: #f87171

---

## Border radius

page-level cards: 20px ← hero card, main containers
section cards: 14px ← issue cards, pillar cards
inner elements: 10px ← illustration panels
buttons / inputs: 8px
badges / pills: 999px ← ALWAYS fully rounded
step number circles: 50%
tiny elements: 6px
NEVER use below 6px anywhere.

---

## Spacing scale

Use rem for vertical rhythm: 0.5rem, 1rem, 1.5rem, 2rem, 3rem
Use px for component gaps: 6px, 8px, 12px, 16px, 20px, 24px

Card padding: 16px or 20px
Section padding: 24px
Page padding: 24px
Gap between cards: 8px
Gap between sections: 24px

---

## Shadows

NONE — no box shadows anywhere except:
Focus ring: box-shadow: 0 0 0 3px rgba(124,106,255,0.2)
Glow on green dot: box-shadow: 0 0 6px #6ee7b7

---

## Severity badge specs

All badges: border-radius 999px, Outfit 600 10px,
letter-spacing .02em, padding 3px 10px, border 1px solid

Critical / High:
bg: rgba(248,113,113,0.08)
color: #f87171
border: rgba(248,113,113,0.2)

Warning / Medium:
bg: rgba(245,158,11,0.08)
color: #f59e0b
border: rgba(245,158,11,0.2)

Pass / Low:
bg: rgba(110,231,183,0.08)
color: #6ee7b7
border: rgba(110,231,183,0.2)

Info:
bg: rgba(96,165,250,0.08)
color: #60a5fa
border: rgba(96,165,250,0.2)

Pro plan badge:
bg: rgba(124,106,255,0.10)
color: #a89dff
border: rgba(124,106,255,0.25)

Starter plan badge:
bg: rgba(96,165,250,0.08)
color: #60a5fa
border: rgba(96,165,250,0.2)

---

## Component specs — exact measurements

### Score ring (SVG)

Track circle: rgba(255,255,255,0.05), stroke-width 5
Progress circle: score color, stroke-width 5,
stroke-linecap round
Animation: stroke-dashoffset, 1.3s
cubic-bezier(0.4, 0, 0.2, 1) on mount
Score number: Outfit 800 48px, color matches ring
/100 suffix: Outfit 800 20px, rgba(238,234,248,0.2)

### Pillar cards

Default bg: #131220
Active bg: rgba(124,106,255,0.05)
Default border: 1px solid rgba(255,255,255,0.05)
Active border: 1px solid rgba(124,106,255,0.3)
Border radius: 12px
Padding: 10px 8px
Icon size: 22x22px SVG
Name text: 9px uppercase letter-spacing .04em
rgba(238,234,248,0.35)
Score text: Outfit 800 17px, score color

### Issue cards (collapsed)

Background: rgba(19,18,32,0.5)
Border: 1px solid rgba(255,255,255,0.05)
Border radius: 14px
Hover border: rgba(255,255,255,0.10)
Open border: rgba(124,106,255,0.25)
Open bg: #16152a
Icon area: 44x44px, border-radius 10px,
8% opacity fill of severity color
Title: Outfit 700 13px #eeeaf8
Description: Outfit 400 11px rgba(238,234,248,0.38)
line-height 1.5

### Platform tabs

Default: border rgba(255,255,255,0.07)
color rgba(238,234,248,0.3)
background none
Active: border rgba(124,106,255,0.45)
color #a89dff
bg rgba(124,106,255,0.08)
Border radius: 6px
Font: Outfit 500 10px

### Step numbers

Size: 16x16px, border-radius 50%
Background: rgba(124,106,255,0.15)
Color: #a89dff
Font: Outfit 700 9px

### Stat boxes

Background: rgba(19,18,32,0.5)
Border: 1px solid rgba(255,255,255,0.05)
Border radius: 12px
Padding: 14px, text-align center
Value: Outfit 800 22px, severity color
Label: Outfit 400 9px uppercase
letter-spacing .06em
rgba(238,234,248,0.3)

### Upgrade modal

Overlay: rgba(0,0,0,0.7)
Card bg: #16152a
Card border: 1px solid rgba(124,106,255,0.25)
Card radius: 20px
Card padding: 32px
Max width: 480px

---

## Animation keyframes (copy to globals.css exactly)

@keyframes scan-beam {
0% { transform: translateY(0); }
50% { transform: translateY(80px); }
100% { transform: translateY(0); }
}
@keyframes blink {
0%, 100% { opacity: 1; }
50% { opacity: 0.3; }
}
@keyframes float {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-5px); }
}
@keyframes spin-slow {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
@keyframes pulse-ring {
0% { r: 14; opacity: 0.6; }
100% { r: 22; opacity: 0; }
}
@keyframes pop-in {
from { transform: scale(0); opacity: 0; }
to { transform: scale(1); opacity: 1; }
}
@keyframes check-draw {
from { stroke-dashoffset: 20; }
to { stroke-dashoffset: 0; }
}
@keyframes bounce-x {
0%, 100% { transform: translateX(0); }
50% { transform: translateX(4px); }
}
@keyframes bar-in {
from { width: 0; }
}
@keyframes dash-in {
from { stroke-dashoffset: 226; }
}

@media (prefers-reduced-motion: reduce) {

- { animation: none !important;
  transition: none !important; }
  }

---

## shadcn/ui CSS variable overrides (globals.css)

@layer base {
:root {
--background: 240 4% 6%;
--foreground: 270 8% 95%;
--card: 240 5% 9%;
--card-foreground: 270 8% 95%;
--popover: 240 5% 9%;
--popover-foreground: 270 8% 95%;
--primary: 160 60% 63%;
--primary-foreground: 240 4% 6%;
--secondary: 240 5% 12%;
--secondary-foreground: 270 8% 95%;
--muted: 240 5% 12%;
--muted-foreground: 270 8% 58%;
--accent: 160 60% 63%;
--accent-foreground: 240 4% 6%;
--destructive: 0 70% 70%;
--destructive-foreground: 240 4% 6%;
--border: 240 4% 15%;
--input: 240 4% 15%;
--ring: 160 60% 63%;
--radius: 0.75rem;
}
}

---

## Design quality checklist (before marking UI done)

Run through this before every agent marks UI complete:

[ ] Background is #0c0c14 (not black, not #111)
[ ] Cards are #131220 (not gray, not #1a1a1a)
[ ] Font is Outfit — check DevTools computed style
[ ] No white or light backgrounds anywhere
[ ] All badges are border-radius 999px (fully rounded)
[ ] Purple #7c6aff appears on: logo, active states,
step numbers, active tab borders, CTAs
[ ] Score ring animates on mount
[ ] Pillar bars animate with staggered delay
[ ] At least 3 elements animate on the results page
[ ] Issue card illustrations are present
[ ] Hover transitions are 0.15s-0.2s
[ ] Mobile layout works at 375px
