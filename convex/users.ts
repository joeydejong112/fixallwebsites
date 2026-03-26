import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email:   v.string(),
    name:    v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        ...(name !== undefined && { name }),
      })
    } else {
      await ctx.db.insert('users', {
        clerkId,
        email,
        name,
        plan: 'free',
        scanCount: 0,
      })
    }
  },
})

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) return null
    return { plan: user.plan, scanCount: user.scanCount }
  },
})
