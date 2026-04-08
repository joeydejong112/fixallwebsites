---
title: "What is llms.txt and why AI search engines need it"
description: "llms.txt is an emerging standard that tells AI crawlers — ChatGPT, Perplexity, Claude — what your site contains and how it should be cited. Here's how it works and how to create one."
date: "2026-04-08"
author: "ScanPulse"
pillar: "AI Readiness"
pillarColor: "#ff7675"
readingTime: "6 min read"
---

# What is llms.txt and why AI search engines need it

When ChatGPT, Perplexity, or Google AI Overviews cite a source, they're selecting from content they've indexed. The selection isn't random — AI systems prefer content that is clearly structured, well-attributed, and explicitly signals it's available for use. **llms.txt** is the signal that makes your site a preferred citation candidate.

## The problem it solves

Traditional search engines (Google, Bing) index HTML and process it through sophisticated rendering pipelines. Large language models often work differently: they ingest content in bulk during training or use retrieval-augmented generation (RAG) at query time. For RAG systems, content needs to be:

1. **Findable** — the crawler needs to know it exists
2. **Parseable** — the content structure needs to be unambiguous
3. **Attributable** — the source, author, and date need to be explicit
4. **Permitted** — the site needs to explicitly allow AI use

`robots.txt` handles point 4 (partially). Nothing else handles points 1–3 in a standardised way — until `llms.txt`.

## What is llms.txt?

`llms.txt` is a plain-text Markdown file hosted at `yoursite.com/llms.txt` (similar to `robots.txt`). It was proposed by Jeremy Howard (fast.ai) and has since been adopted by dozens of developer tools, documentation sites, and SaaS companies.

The file contains:
- A one-paragraph description of the site
- A list of key links with annotations
- Optional: access terms, preferred citation format, contact info

A minimal example:

```markdown
# ScanPulse

> ScanPulse is a free website health scanner that runs 94 checks across security, performance, SEO, accessibility, AI readiness, DNS, and trust.

## Documentation
- [How scanning works](/docs/how-it-works): Technical overview of the scan engine
- [API Reference](/api-docs): REST API for Pro users
- [Fix-It Tools](/tools): Free tools to fix flagged issues

## Optional
- [Terms of Use](/terms)
```

A companion file, `llms-full.txt`, contains the complete text of all your key pages — a single-file corpus for AI ingestion.

## How AI crawlers use it

Different AI systems have different crawling policies:

| Crawler | User-Agent | Respects robots.txt? |
|---|---|---|
| GPTBot (OpenAI) | `GPTBot` | Yes |
| ClaudeBot (Anthropic) | `ClaudeBot` | Yes |
| PerplexityBot | `PerplexityBot` | Yes |
| Google-Extended | `Google-Extended` | Yes |
| CCBot (Common Crawl) | `CCBot` | Yes |

All of them check `robots.txt`. If you want to allow a crawler, make sure its user-agent isn't blocked. If you want to block it, add:

```
User-agent: GPTBot
Disallow: /
```

Having a well-formed `llms.txt` signals to retrieval systems (especially those that crawl on demand, like Perplexity) that you've deliberately prepared your content for AI ingestion — which increases the chance of being selected as a citation source.

## ScanPulse's AI Readiness checks

ScanPulse checks 10 AI Readiness signals on every scan:

1. **`llms.txt` present** — Is the file reachable at `/llms.txt` or `/.well-known/llms.txt`?
2. **`llms-full.txt` present** — Is the full-content corpus available?
3. **AI crawler allow-list** — Are major AI bots permitted in `robots.txt`?
4. **Answer-engine schema** — Is `FAQPage`, `HowTo`, or `Speakable` JSON-LD present?
5. **Author authority (E-E-A-T)** — Is there explicit author attribution?
6. **Semantic content isolation** — Are headings structured as question-answer pairs?
7. **Content freshness** — Are `datePublished` and `dateModified` in JSON-LD?
8. **Heading continuity** — Do headings form a logical outline?
9. **Citation-friendly formatting** — Are facts presented in attributable, quotable sentences?
10. **Open Graph Article data** — Are `article:published_time` and `article:author` set?

## How to create your llms.txt

The fastest way is to use our [AI Optimizer & llms.txt Generator](/tools/ai-optimizer) — a free tool that generates a valid `llms.txt` file from a form, plus the matching `robots.txt` entries for every major AI crawler.

Once you've generated the file:
1. Place `llms.txt` in the **root** of your domain (e.g., `/public/llms.txt` in most frameworks)
2. Verify it's accessible at `https://yoursite.com/llms.txt`
3. Update your `robots.txt` to reference it
4. Run a [ScanPulse scan](/) to confirm your AI Readiness score

## Does llms.txt actually help?

Early evidence from sites that adopted `llms.txt` suggests increased citation frequency in Perplexity and ChatGPT responses. This is difficult to measure rigorously, but the mechanism is sound: AI retrieval systems prefer structured, well-attributed content. Making your content easier to parse and attribute costs nothing and has measurable upside.

The downside is essentially zero — `llms.txt` is ignored by traditional search engines and browsers.

→ [Generate your llms.txt now](/tools/ai-optimizer)

→ [Run an AI Readiness scan](/)
