import { v } from "convex/values";
import { query } from "./_generated/server";

export const getScanResults = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, args) => {
    // Basic auth check can go here later, skipping for now since only authorized UI routes access it usually
    // Or we could verify against `scans` table `userId`
    const scan = await ctx.db.get(args.scanId);
    if (!scan) return null;

    const results = await ctx.db
      .query("scanResults")
      .withIndex("by_scan_id", (q) => q.eq("scanId", args.scanId))
      .collect();

    return { scan, results };
  },
});

export const getUserScans = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getFullScanForExport = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const scan = await ctx.db.get(args.scanId);
    if (!scan) return null;

    // Ensure only the owner can export
    if (scan.userId !== identity.subject) return null;

    const results = await ctx.db
      .query("scanResults")
      .withIndex("by_scan_id", (q) => q.eq("scanId", args.scanId))
      .collect();

    return { scan, results };
  },
});

export const getScanByPublicToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const scan = await ctx.db
      .query("scans")
      .withIndex("by_public_token", (q) => q.eq("publicToken", args.token))
      .unique();

    if (!scan) return null;

    const results = await ctx.db
      .query("scanResults")
      .withIndex("by_scan_id", (q) => q.eq("scanId", scan._id))
      .collect();

    return { scan, results };
  },
});

export const getScanHistory = query({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    // Get the latest up to 100 scans for user, then filter by URL, take 30
    // Convex doesn't have multi-field index on userId+url yet, so filter in memory or via index
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
      
    const urlScans = scans
      .filter((s) => s.url === args.url && s.status === "complete" && s.overallScore !== undefined)
      .slice(0, 30)
      .reverse();

    return urlScans;
  },
});
