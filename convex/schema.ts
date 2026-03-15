import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro")
    ),
    scansThisMonth: v.number(),
    customLogoUrl: v.optional(v.string()),
    slackWebhookUrl: v.optional(v.string()),
    firstScanAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  scans: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("scanning"),
      v.literal("complete"),
      v.literal("error")
    ),
    overallScore: v.optional(v.number()),
    pillarScores: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    publicToken: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user_id", ["userId"])
    .index("by_public_token", ["publicToken"]),

  scanResults: defineTable({
    scanId: v.id("scans"),
    pillar: v.string(),
    checkName: v.string(),
    status: v.union(
      v.literal("pass"),
      v.literal("warn"),
      v.literal("fail")
    ),
    impact: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    plainEnglishDescription: v.string(),
    fixGuide: v.any(),
    rawValue: v.string(),
  }).index("by_scan_id", ["scanId"]),

  watchedSites: defineTable({
    userId: v.string(),
    url: v.string(),
    lastScore: v.number(),
    lastScannedAt: v.number(),
    active: v.boolean(),
  }).index("by_user_id", ["userId"])
    .index("by_active", ["active"]),

  aiUsage: defineTable({
    userId: v.string(),
    metaTagsUsed: v.number(),
    altTextsUsed: v.number(),
    chatMessagesUsed: v.number(),
    month: v.string(), // "2026-03" format
  }).index("by_user_month", ["userId", "month"]),

  comparisons: defineTable({
    userId: v.string(),
    urlA: v.string(),
    urlB: v.string(),
    scanIdA: v.id("scans"),
    scanIdB: v.id("scans"),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  sitemapJobs: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(v.literal("running"), v.literal("complete"), v.literal("error")),
    pagesFound: v.number(),
    urls: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  apiKeys: defineTable({
    userId: v.string(),
    keyHash: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    active: v.boolean(),
  }).index("by_key_hash", ["keyHash"])
    .index("by_user_id", ["userId"]),

  fixFeedback: defineTable({
    checkName: v.string(),
    platform: v.string(),
    helpful: v.boolean(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_check_name", ["checkName"]),

  emailSequence: defineTable({
    userId: v.string(),
    email: v.string(),
    step: v.number(),
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("unsubscribed")
    ),
  }).index("by_user_id", ["userId"])
    .index("by_scheduled", ["scheduledFor"]),
});
