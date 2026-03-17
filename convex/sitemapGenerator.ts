"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import * as cheerio from "cheerio";

export const crawl = internalAction({
  args: { jobId: v.id("sitemapJobs"), url: v.string() },
  handler: async (ctx, args) => {
    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: args.url, depth: 0 }];
    const maxDepth = 3;
    const maxUrls = 150;

    let baseUrl: URL;
    try {
      baseUrl = new URL(args.url);
    } catch {
      await ctx.runMutation(internal.sitemap.updateSitemapJob, {
        jobId: args.jobId,
        status: "error",
        urls: [],
        errorMessage: "Invalid URL",
      });
      return;
    }

    const domain = baseUrl.hostname;

    try {
      while (queue.length > 0 && visited.size < maxUrls) {
        const item = queue.shift();
        if (!item) continue;
        
        let currentUrl = item.url;
        currentUrl = currentUrl.split("#")[0].replace(/\/$/, "");

        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        if (visited.size % 10 === 0) {
          await ctx.runMutation(internal.sitemap.updateSitemapJob, {
            jobId: args.jobId,
            status: "running",
            urls: Array.from(visited),
          });
        }

        if (item.depth >= maxDepth) continue;

        try {
          const res = await fetch(currentUrl, {
            headers: {
              "User-Agent": "SiteFixBot/1.0",
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!res.ok) continue;
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("text/html")) continue;

          const html = await res.text();
          const $ = cheerio.load(html);

          $("a[href]").each((_, el) => {
            if (visited.size + queue.length >= maxUrls) return;
            const href = $(el).attr("href");
            if (!href) return;

            if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

            try {
              const absoluteUrl = new URL(href, currentUrl);
              if (absoluteUrl.hostname === domain) {
                 const cleanLink = absoluteUrl.href.split("#")[0].replace(/\/$/, "");
                 if (!visited.has(cleanLink)) {
                   queue.push({ url: cleanLink, depth: item.depth + 1 });
                 }
              }
            } catch {
              // Ignore invalid
            }
          });
        } catch (e) {
          // Ignore fetch error
        }
      }

      await ctx.runMutation(internal.sitemap.updateSitemapJob, {
        jobId: args.jobId,
        status: "complete",
        urls: Array.from(visited).sort(),
      });
    } catch (error) {
       await ctx.runMutation(internal.sitemap.updateSitemapJob, {
        jobId: args.jobId,
        status: "error",
        urls: Array.from(visited),
        errorMessage: String(error)
      });
    }
  },
});
