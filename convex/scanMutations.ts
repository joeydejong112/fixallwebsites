import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper to normalize URLs
function normalizeUrl(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export const createScan = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Plan Enforcement
    const limit = user.plan === "free" ? 10 : user.plan === "starter" ? 100 : 1000;
    if (user.scansThisMonth >= limit) {
      throw new Error("Plan limit reached");
    }

    const normalizedUrl = normalizeUrl(args.url);

    // Create the scan
    const scanId = await ctx.db.insert("scans", {
      userId: clerkId,
      url: normalizedUrl,
      status: "queued",
      createdAt: Date.now(),
    });

    // Increment user usage
    await ctx.db.patch(user._id, {
      scansThisMonth: user.scansThisMonth + 1,
    });

    // Schedule the actual scan
    await ctx.scheduler.runAfter(0, internal.scans.runScanAction, {
      scanId,
      url: normalizedUrl,
    });

    return scanId;
  },
});

export const updateScanStatus = internalMutation({
  args: {
    scanId: v.id("scans"),
    status: v.union(v.literal("scanning"), v.literal("error"), v.literal("complete")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scanId, {
      status: args.status,
      errorMessage: args.errorMessage,
      ...(args.status === "complete" ? { completedAt: Date.now() } : {}),
    });
  },
});

export const saveScanResults = internalMutation({
  args: {
    scanId: v.id("scans"),
    results: v.array(
      v.object({
        pillar: v.string(),
        checkName: v.string(),
        status: v.union(v.literal("pass"), v.literal("warn"), v.literal("fail")),
        impact: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        plainEnglishDescription: v.string(),
        fixGuide: v.any(),
        rawValue: v.string(),
      })
    ),
    overallScore: v.number(),
    pillarScores: v.any(),
  },
  handler: async (ctx, args) => {
    // Insert all scan results
    await Promise.all(
      args.results.map((result) =>
        ctx.db.insert("scanResults", {
          ...result,
          scanId: args.scanId,
        })
      )
    );

    // Update the main scan record
    await ctx.db.patch(args.scanId, {
      overallScore: args.overallScore,
      pillarScores: args.pillarScores,
      status: "complete",
      completedAt: Date.now(),
    });
  },
});
