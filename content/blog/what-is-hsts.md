---
title: "What is HSTS and why your site needs it"
description: "HTTP Strict Transport Security forces browsers to use HTTPS exclusively. Without it, your users are vulnerable to SSL-stripping attacks even if you have a valid certificate."
date: "2026-04-08"
author: "ScanPulse"
pillar: "Security"
pillarColor: "#00d4aa"
readingTime: "5 min read"
---

# What is HSTS and why your site needs it

If your site serves HTTPS, that's a good start — but it isn't enough on its own. Every time a user types `yoursite.com` into the browser (without the `https://` prefix), the browser makes the first request over plain HTTP. That initial request is a window of vulnerability: an attacker on the same network can intercept it, strip the redirect to HTTPS, and silently proxy all traffic in plaintext. This is called an **SSL-stripping attack**.

**HTTP Strict Transport Security (HSTS)** closes that window permanently.

## How HSTS works

HSTS is a response header:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

When the browser receives this header over a secure HTTPS connection, it caches the instruction: *"For the next 31,536,000 seconds (one year), never connect to this domain over HTTP — not even for the first request."* If a user types `http://yoursite.com`, the browser upgrades it to `https://` locally, without making any network request at all. There is nothing for an attacker to intercept.

## The three directives

- **`max-age`** — How long (in seconds) the browser should enforce HTTPS. ScanPulse recommends at least `15768000` (6 months). A value below this earns a warning.
- **`includeSubDomains`** — Extends HSTS to all subdomains. Without it, `mail.yoursite.com` is still vulnerable.
- **`preload`** — Submits your domain to the [HSTS preload list](https://hstspreload.org/), a hardcoded list of domains browsers ship with. Even first-time visitors are protected before you've ever sent them a header.

## ScanPulse checks two things

ScanPulse's security audit checks:
1. **HSTS presence** — Is the `Strict-Transport-Security` header present at all?
2. **HSTS quality** — Is `max-age` at least 15,768,000, and is `includeSubDomains` set?

A missing HSTS header is a **Critical** finding. A header with a too-short `max-age` or missing `includeSubDomains` earns a **Warning**.

## How to add HSTS to your site

The method depends on your stack. Use our [Security Headers Generator](/tools/security-headers) to get the exact values for your platform.

**Nginx:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Apache (.htaccess):**
```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

**Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }]
    }
  ]
}
```

**Cloudflare:** Enable HSTS in **SSL/TLS → Edge Certificates → HTTP Strict Transport Security**.

## One important caution

Do not add `preload` until you are certain every subdomain serves HTTPS. Preloading is difficult to undo — browsers cache the preload list for months, and removal from the preload list can take even longer to propagate. Start with `max-age=300` during testing, then increase to `31536000` once you're confident.

## Check your site now

Run a [free ScanPulse scan](/) to see your current HSTS status alongside 20 other security checks, plus 73 more checks across performance, SEO, accessibility, AI readiness, DNS, and trust.

→ [Generate your HSTS header now](/tools/security-headers)
