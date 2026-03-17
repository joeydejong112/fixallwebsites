import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ─── Usage limits per plan ────────────────────────────────────────────────────
const META_LIMITS: Record<string, number> = { free: 0, starter: 50, pro: 500 };
const ALT_LIMITS: Record<string, number> = { free: 0, starter: 50, pro: 500 };

// ─── Internal: check + increment meta usage ───────────────────────────────────
export const checkAndIncrementMetaUsage = internalMutation({
  args: { userId: v.string(), plan: v.string() },
  handler: async (ctx, args) => {
    const limit = META_LIMITS[args.plan] ?? 0;
    if (limit === 0) throw new Error("AI_LIMIT_REACHED");

    const month = new Date().toISOString().slice(0, 7); // "2026-03"
    const existing = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    if (existing) {
      if (existing.metaTagsUsed >= limit) throw new Error("AI_LIMIT_REACHED");
      await ctx.db.patch(existing._id, {
        metaTagsUsed: existing.metaTagsUsed + 1,
      });
    } else {
      await ctx.db.insert("aiUsage", {
        userId: args.userId,
        month,
        metaTagsUsed: 1,
        altTextsUsed: 0,
        chatMessagesUsed: 0,
      });
    }
  },
});

// ─── Internal: check + increment alt text usage ───────────────────────────────
export const checkAndIncrementAltUsage = internalMutation({
  args: { userId: v.string(), plan: v.string() },
  handler: async (ctx, args) => {
    const limit = ALT_LIMITS[args.plan] ?? 0;
    if (limit === 0) throw new Error("AI_LIMIT_REACHED");

    const month = new Date().toISOString().slice(0, 7);
    const existing = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    if (existing) {
      if (existing.altTextsUsed >= limit) throw new Error("AI_LIMIT_REACHED");
      await ctx.db.patch(existing._id, {
        altTextsUsed: existing.altTextsUsed + 1,
      });
    } else {
      await ctx.db.insert("aiUsage", {
        userId: args.userId,
        month,
        metaTagsUsed: 0,
        altTextsUsed: 1,
        chatMessagesUsed: 0,
      });
    }
  },
});

// ─── Internal: check + increment chat usage ───────────────────────────────────
export const checkAndIncrementChatUsage = internalMutation({
  args: { userId: v.string(), plan: v.string() },
  handler: async (ctx, args) => {
    const limit = 200; // All paid plans get generous chat limit
    if (args.plan === "free") throw new Error("AI_LIMIT_REACHED");

    const month = new Date().toISOString().slice(0, 7);
    const existing = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();

    if (existing) {
      if (existing.chatMessagesUsed >= limit) throw new Error("AI_LIMIT_REACHED");
      await ctx.db.patch(existing._id, {
        chatMessagesUsed: existing.chatMessagesUsed + 1,
      });
    } else {
      await ctx.db.insert("aiUsage", {
        userId: args.userId,
        month,
        metaTagsUsed: 0,
        altTextsUsed: 0,
        chatMessagesUsed: 1,
      });
    }
  },
});

// ─── Internal: get usage for current month ────────────────────────────────────
export const getUsage = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const month = new Date().toISOString().slice(0, 7);
    return await ctx.db
      .query("aiUsage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", month)
      )
      .unique();
  },
});
