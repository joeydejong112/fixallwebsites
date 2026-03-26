# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ FIRST THING TO DO IN EVERY SESSION

**Read `memory/MEMORY.md` before doing anything else.**
It contains the full project history, current phase status, known issues, and where the last session left off. After completing any work, update the "Last Session" section in that file so the next Claude instance is fully up to date.

## Project Overview

**ScanPulse** — A Next.js website health scanner SaaS that analyzes sites across three pillars: Security, Performance, and SEO. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Clerk auth, and anime.js for animations.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Tech Stack

- **Framework**: Next.js 14 App Router (`src/` directory layout)
- **Auth**: Clerk (`@clerk/nextjs`) — middleware protects `/dashboard` and `/results` routes
- **Animations**: anime.js — always loaded via dynamic import (`await import('animejs')`) to avoid SSR `window` errors
- **Styling**: Tailwind CSS with custom design tokens (see below)
- **Icons**: lucide-react
- **Utilities**: `clsx` + `tailwind-merge` via `src/lib/utils.ts` `cn()` helper

### Route Structure

- `/` — Landing page with hero scanner, pillar cards, features, FAQ
- `/dashboard` — Protected; user's scan history and settings
- `/results` — Protected; scan results display
- `/sign-in`, `/sign-up` — Clerk auth pages

### Key Design Tokens (tailwind.config.ts)

Custom colors used throughout:

- `primary` (#ec3586) — brand pink
- `dark` / `dark-surface` / `dark-elevated` / `dark-border` — dark theme surfaces
- `security` (#00d4aa), `performance` (#ffaa00), `seo` (#6c5ce7) — pillar accent colors
- `success`, `warning`, `danger`, `muted` — semantic colors

Custom shadows: `glow-primary`, `glow-success`, `glow-warning`, `glow-danger`, `elevation-sm/md/lg`

### Global CSS Classes (globals.css)

Reusable component classes defined in `@layer components`:

- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- Cards: `.card`, `.card-interactive`
- Inputs: `.input-wrapper`, `.input-field`
- Badges: `.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-primary`
- Layout: `.section`, `.section-title`, `.section-subtitle`

Utility classes in `@layer utilities`:

- `.text-gradient` — primary pink gradient text
- `.text-gradient-multi` — security/performance/seo gradient
- `.animation-delay-{100-500}` — stagger helpers

### Fonts

Space Grotesk (`font-display`) and DM Sans (`font-body`) loaded via Google Fonts in `globals.css`. Headings use `font-display`, body uses `font-body`.

### Animations Pattern

All anime.js usage follows this pattern to prevent SSR crashes:

```tsx
useEffect(() => {
  const loadAnimations = async () => {
    const anime = (await import("animejs")).default;
    // anime calls here
  };
  loadAnimations();
}, []);
```

### Logo Component

`src/components/Logo.tsx` — animated SVG radar/pulse logo. Accepts `animate={false}` to disable motion (used in footer). Uses anime.js for radar sweep rotation, pulse rings, and center pulse.

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Clerk Auth

Protected routes are defined in `middleware.ts` using `createRouteMatcher`. The root layout wraps everything in `<ClerkProvider>`. Sign-in/sign-up pages live at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx`.

IMPORTANT:
ALways use context7 plugin for all documentation and code generation.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
