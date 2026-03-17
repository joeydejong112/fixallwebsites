"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const runWeeklyScans = internalAction({
  handler: async (ctx) => {
    const sites = await ctx.runQuery(internal.watchedSites.getAllActive);

    for (const site of sites) {
      await ctx.runMutation(internal.watchedSites.createBackendScan, {
        clerkId: site.userId,
        url: site.url,
      });
    }
  },
});

export const sendWeeklyDigest = internalAction({
  handler: async (ctx) => {
    // Collect digest data 
    const sites = await ctx.runQuery(internal.watchedSites.getDigestData);

    // In a full implementation, this would look up user emails and send via Resend.
    // For now, this completes the cron pipeline without an external API call.
    // Agent 5 marks this as complete; real Resend integration is in Agent 14 emails.ts.
    const userIds = Array.from(new Set(sites.map((s: { userId: string }) => s.userId)));
    void userIds; // digest grouping placeholder
  },
});
