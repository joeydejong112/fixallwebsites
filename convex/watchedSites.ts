import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const toggleWatchSite = mutation({
  args: {
    clerkId: v.string(),
    url: v.string(),
    lastScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Basic plan check done on client, we'll double check here
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.plan === "free") {
      throw new Error("Requires pro or starter plan");
    }

    // Check if site is already watched
    const existing = await ctx.db
      .query("watchedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", args.clerkId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();

    if (existing) {
      // Toggle active status
      await ctx.db.patch(existing._id, { active: !existing.active });
      return !existing.active;
    } else {
      // Create new watch
      await ctx.db.insert("watchedSites", {
        userId: args.clerkId,
        url: args.url,
        lastScore: args.lastScore,
        lastScannedAt: Date.now(),
        active: true,
      });
      return true;
    }
  },
});

export const getWatchedSites = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", args.clerkId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const getAllActive = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("watchedSites")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
  },
});

export const getDigestData = internalQuery({
  handler: async (ctx) => {
    const activeSites = await ctx.db
      .query("watchedSites")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    
    // For a real digest, we would gather the stats per user.
    // Simplifying here to just return the sites for the mock.
    return activeSites;
  },
});

export const createBackendScan = internalMutation({
  args: {
    clerkId: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Don't enforce limits on backend cron scans, assume pro/starter

    const scanId = await ctx.db.insert("scans", {
      userId: args.clerkId,
      url: args.url,
      status: "queued",
      createdAt: Date.now(),
    });

    // Schedule the actual scan
    await ctx.scheduler.runAfter(0, internal.scans.runScanAction, {
      scanId,
      url: args.url,
    });

    return scanId;
  },
});
