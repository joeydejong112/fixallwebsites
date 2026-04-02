import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal('free'), v.literal('pro')),
    scanCount: v.number(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  })
    .index('by_clerk', ['clerkId'])
    .index('by_stripe_customer', ['stripeCustomerId']),

  scans: defineTable({
    userId: v.string(),
    url: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('done'),
      v.literal('error'),
    ),
    securityScore: v.optional(v.number()),
    performanceScore: v.optional(v.number()),
    seoScore: v.optional(v.number()),
    overallScore: v.optional(v.number()),
    accessibilityScore: v.optional(v.number()),
    dnsScore: v.optional(v.number()),
    trustScore: v.optional(v.number()),
    detectedTech: v.optional(v.array(v.string())),
    carbonGrams: v.optional(v.number()),
    greenHosting: v.optional(v.boolean()),
    domainExpiry: v.optional(v.string()),
    certExpiry: v.optional(v.string()),
    issues: v.optional(v.array(v.object({
      pillar: v.string(),
      severity: v.union(v.literal('critical'), v.literal('warning'), v.literal('pass')),
      title: v.string(),
      description: v.string(),
    }))),
    errorMessage: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),

  monitoredSites: defineTable({
    userId: v.string(),
    url: v.string(),
    isActive: v.boolean(),
    frequency: v.union(v.literal('daily'), v.literal('weekly')),
    lastRunTime: v.optional(v.number()),
    lastScore: v.optional(v.number()),
  }).index('by_user', ['userId']).index('by_active', ['isActive']),
})
