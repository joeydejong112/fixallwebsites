"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as cheerio from "cheerio";

export const runScanAction = internalAction({
  args: {
    scanId: v.id("scans"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Mark as scanning
    await ctx.runMutation(internal.scanMutations.updateScanStatus, {
      scanId: args.scanId,
      status: "scanning",
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const startTime = Date.now();
      const response = await fetch(args.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SiteFix Website Health Scanner (+https://sitefix.com)",
        },
      });

      clearTimeout(timeoutId);

      const endTime = Date.now();
      const ttfb = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const headers = response.headers;
      const $ = cheerio.load(html);

      // We will collect results here
      const results: any[] = [];
      let totalPass = 0;
      let totalWarn = 0;
      let totalFail = 0;

      // Helper to add a result
      const addResult = (pillar: string, checkName: string, status: "pass" | "warn" | "fail", impact: "high" | "medium" | "low", description: string, rawValue: string) => {
        results.push({
          pillar,
          checkName,
          status,
          impact,
          plainEnglishDescription: description,
          fixGuide: {}, // Real fix guides could be populated here
          rawValue,
        });
        if (status === "pass") totalPass++;
        if (status === "warn") totalWarn++;
        if (status === "fail") totalFail++;
      };

      // --- SEO Checks ---
      const title = $("title").text();
      if (!title) {
        addResult("seo", "meta-title-missing", "fail", "high", "The page is missing a <title> tag.", "None");
      } else if (title.length > 60) {
        addResult("seo", "meta-title-too-long", "warn", "medium", "The title tag is over 60 characters and may be truncated in search results.", `${title.length} characters`);
      } else if (title.length < 10) {
        addResult("seo", "meta-title-too-short", "warn", "low", "The title tag is too short to be descriptive.", `${title.length} characters`);
      } else {
        addResult("seo", "meta-title-missing", "pass", "high", "The title tag is present and optimal length.", `${title.length} characters`);
      }

      const description = $('meta[name="description"]').attr("content");
      if (!description) {
        addResult("seo", "meta-description-missing", "fail", "high", "The page is missing a meta description.", "None");
      } else if (description.length > 160) {
        addResult("seo", "meta-description-too-long", "warn", "medium", "The meta description is over 160 characters and may be truncated.", `${description.length} characters`);
      } else if (description.length < 50) {
        addResult("seo", "meta-description-too-short", "warn", "low", "The meta description is too short.", `${description.length} characters`);
      } else {
        addResult("seo", "meta-description-missing", "pass", "high", "The meta description is optimal.", `${description.length} characters`);
      }

      const h1s = $("h1");
      if (h1s.length === 0) {
        addResult("seo", "h1-missing", "fail", "high", "The page is missing an H1 heading.", "0");
        addResult("accessibility", "h1-missing-accessibility", "fail", "high", "The page is missing an H1 heading.", "0");
      } else if (h1s.length > 1) {
        addResult("seo", "h1-multiple", "warn", "low", "The page has multiple H1 headings.", h1s.length.toString());
        addResult("seo", "h1-missing", "pass", "high", "The page has an H1 heading.", h1s.length.toString());
        addResult("accessibility", "h1-missing-accessibility", "pass", "high", "The page has an H1 heading.", h1s.length.toString());
      } else {
        addResult("seo", "h1-missing", "pass", "high", "The page has exactly one H1 heading.", "1");
        addResult("seo", "h1-multiple", "pass", "low", "The page has exactly one H1 heading.", "1");
        addResult("accessibility", "h1-missing-accessibility", "pass", "high", "The page has exactly one H1 heading.", "1");
      }

      // Very naive check for skipped hierarchical heading levels
      const hasH3 = $("h3").length > 0;
      const hasH2 = $("h2").length > 0;
      if (hasH3 && !hasH2) {
         addResult("seo", "heading-hierarchy-skipped", "warn", "medium", "Heading hierarchy skipped (H3 found without H2).", "Yes");
      } else {
         addResult("seo", "heading-hierarchy-skipped", "pass", "medium", "Heading hierarchy is structured properly.", "No");
      }

      const canonical = $('link[rel="canonical"]').attr("href");
      if (!canonical) {
        addResult("seo", "canonical-missing", "fail", "high", "No canonical URL specified.", "None");
      } else if (!canonical.startsWith("http")) {
        addResult("seo", "canonical-invalid", "warn", "high", "Canonical URL might be invalid (must be absolute).", canonical);
        addResult("seo", "canonical-missing", "pass", "high", "Canonical URL is present.", canonical);
      } else {
        addResult("seo", "canonical-missing", "pass", "high", "Canonical URL is present.", canonical);
        addResult("seo", "canonical-invalid", "pass", "high", "Canonical URL is valid.", canonical);
      }

      const ogTitle = $('meta[property="og:title"]').attr("content");
      if (!ogTitle) addResult("seo", "og-title-missing", "fail", "medium", "Missing Open Graph title.", "None");
      else addResult("seo", "og-title-missing", "pass", "medium", "Open Graph title is present.", ogTitle);

      const ogDesc = $('meta[property="og:description"]').attr("content");
      if (!ogDesc) addResult("seo", "og-description-missing", "fail", "medium", "Missing Open Graph description.", "None");
      else addResult("seo", "og-description-missing", "pass", "medium", "Open Graph description is present.", ogDesc);

      const ogImage = $('meta[property="og:image"]').attr("content");
      if (!ogImage) addResult("seo", "og-image-missing", "fail", "high", "Missing Open Graph image.", "None");
      else addResult("seo", "og-image-missing", "pass", "high", "Open Graph image is present.", ogImage);


      // --- Security Checks ---
      const isHttps = args.url.startsWith("https://");
      addResult("security", "https-not-enforced", isHttps ? "pass" : "fail", "high", isHttps ? "Site uses HTTPS." : "Site is not enforcing HTTPS.", isHttps ? "Yes" : "No");

      const hsts = headers.get("strict-transport-security");
      addResult("security", "hsts-missing", hsts ? "pass" : "fail", "medium", hsts ? "HSTS is enabled." : "HSTS header is missing.", hsts || "None");

      const csp = headers.get("content-security-policy");
      addResult("security", "csp-missing", csp ? "pass" : "warn", "high", csp ? "Content Security Policy is active." : "Content Security Policy is missing.", csp || "None");

      const xframe = headers.get("x-frame-options");
      addResult("security", "x-frame-options-missing", xframe ? "pass" : "fail", "medium", xframe ? "X-Frame-Options is set." : "X-Frame-Options header is missing.", xframe || "None");

      const xcontent = headers.get("x-content-type-options");
      addResult("security", "x-content-type-options-missing", xcontent ? "pass" : "fail", "medium", xcontent ? "X-Content-Type-Options is set." : "X-Content-Type-Options header is missing.", xcontent || "None");

      const referrerPolicy = headers.get("referrer-policy");
      addResult("security", "referrer-policy-missing", referrerPolicy ? "pass" : "fail", "medium", referrerPolicy ? "Referrer-Policy is set." : "Referrer-Policy header is missing.", referrerPolicy || "None");

      const permissionsPolicy = headers.get("permissions-policy") || headers.get("feature-policy");
      addResult("security", "permissions-policy-missing", permissionsPolicy ? "pass" : "warn", "medium", permissionsPolicy ? "Permissions-Policy is set." : "Permissions-Policy header is missing.", permissionsPolicy || "None");

      const mixedContentScripts = $("script[src^='http://']").length;
      const mixedContentCSS = $("link[href^='http://']").length;
      const mixedContentImages = $("img[src^='http://']").length;
      const totalMixed = mixedContentScripts + mixedContentCSS + mixedContentImages;
      addResult("security", "mixed-content-found", totalMixed > 0 ? "fail" : "pass", "high", totalMixed > 0 ? `Found ${totalMixed} mixed content resources (HTTP over HTTPS).` : "No mixed content found.", totalMixed.toString());


      // --- Performance Checks ---
      if (ttfb > 1000) {
        addResult("performance", "ttfb-slow", "fail", "high", "Time to First Byte is very slow (>1s).", `${ttfb}ms`);
      } else if (ttfb > 500) {
        addResult("performance", "ttfb-slow", "warn", "medium", "Time to First Byte is slow (>500ms).", `${ttfb}ms`);
      } else {
        addResult("performance", "ttfb-slow", "pass", "high", "Time to First Byte is fast.", `${ttfb}ms`);
      }

      const gzip = headers.get("content-encoding");
      const compressed = gzip && (gzip.includes("gzip") || gzip.includes("br"));
      addResult("performance", "compression-missing", compressed ? "pass" : "fail", "medium", compressed ? "Text compression is enabled." : "No text compression detected.", gzip || "None");

      const images = $("img");
      let missingDims = 0;
      let missingAlt = 0;
      images.each((_, img: any) => {
        if (!$(img).attr("width") || !$(img).attr("height")) missingDims++;
        if (!$(img).attr("alt")) missingAlt++;
      });
      addResult("performance", "images-missing-dimensions", missingDims > 0 ? "warn" : "pass", "medium", missingDims > 0 ? `${missingDims} images are missing width/height attributes.` : "All images have explicit dimensions.", missingDims.toString());
      
      // Accessibility & SEO overlap
      addResult("seo", "images-missing-alt", missingAlt > 0 ? "fail" : "pass", "medium", missingAlt > 0 ? `${missingAlt} images are missing alt text.` : "All images have alt text.", missingAlt.toString());
      addResult("accessibility", "images-missing-alt-accessibility", missingAlt > 0 ? "fail" : "pass", "high", missingAlt > 0 ? `${missingAlt} images are missing alt text.` : "All images have alt text.", missingAlt.toString());


      // --- Accessibility Checks ---
      const lang = $("html").attr("lang");
      addResult("accessibility", "html-lang-missing", lang ? "pass" : "fail", "high", lang ? "HTML lang attribute is present." : "HTML lang attribute is missing.", lang || "None");

      const inputsWithoutLabels = $("input:not([type='submit']):not([type='hidden'])").filter((_, el: any) => {
        const id = $(el).attr("id");
        if (id && $(`label[for='${id}']`).length > 0) return false;
        if ($(el).closest("label").length > 0) return false;
        if ($(el).attr("aria-label") || $(el).attr("aria-labelledby")) return false;
        return true;
      });
      addResult("accessibility", "inputs-missing-labels", inputsWithoutLabels.length > 0 ? "fail" : "pass", "high", inputsWithoutLabels.length > 0 ? `${inputsWithoutLabels.length} inputs are missing labels.` : "All inputs have labels.", inputsWithoutLabels.length.toString());

      // --- Technical Checks ---
      const viewport = $('meta[name="viewport"]').attr("content");
      addResult("mobile", "viewport-missing", viewport ? "pass" : "fail", "high", viewport ? "Viewport meta tag is present." : "Viewport meta tag is missing.", viewport || "None");

      const hasCharset = $("meta[charset]").length > 0 || $('meta[http-equiv="Content-Type"]').length > 0;
      addResult("technical", "charset-missing", hasCharset ? "pass" : "fail", "low", hasCharset ? "Charset declaration is present." : "Charset declaration is missing.", hasCharset ? "Yes" : "No");
      
      const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase();
      const hasNoIndex = robotsMeta && robotsMeta.includes("noindex");
      addResult("technical", "noindex-tag-found", hasNoIndex ? "fail" : "pass", "high", hasNoIndex ? "A noindex tag is preventing search engines from indexing this page." : "No blocking noindex tags found.", hasNoIndex ? "Yes" : "No");


      // 4. Calculate Scores
      const maxScore = results.length * 2;
      const earnedScore = (totalPass * 2) + (totalWarn * 1);
      const overallScore = Math.round((earnedScore / maxScore) * 100) || 0;

      const pillarScores: Record<string, number> = {
        seo: 100, security: 100, performance: 100, accessibility: 100, technical: 100, mobile: 100
      };
      
      // Calculate individual pillar scores
      const pillars = ["seo", "security", "performance", "accessibility", "technical", "mobile"];
      for (const p of pillars) {
        const pResults = results.filter(r => r.pillar === p);
        if (pResults.length === 0) continue;
        const pMax = pResults.length * 2;
        const pEarned = pResults.filter(r => r.status === "pass").length * 2 + pResults.filter(r => r.status === "warn").length * 1;
        pillarScores[p] = Math.round((pEarned / pMax) * 100) || 0;
      }

      // 5. Save results
      await ctx.runMutation(internal.scanMutations.saveScanResults, {
        scanId: args.scanId,
        results,
        overallScore,
        pillarScores,
      });

    } catch (error: any) {
      await ctx.runMutation(internal.scanMutations.updateScanStatus, {
        scanId: args.scanId,
        status: "error",
        errorMessage: error.message || "Failed to scan URL",
      });
    }
  },
});
