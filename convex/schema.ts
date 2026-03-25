import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal('free'), v.literal('pro')),
    scanCount: v.number(),
  }).index('by_clerk', ['clerkId']),

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
})
