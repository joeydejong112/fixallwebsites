import { mutation, query, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

// ── Helpers ────────────────────────────────────────────────────────────────

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Public mutations / queries ─────────────────────────────────────────────

export const generateApiKey = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // Gate: Pro only
    const user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).unique()
    if (!user) throw new Error('User not found')
    if (user.plan !== 'pro') throw new Error('API access requires a Pro plan.')

    const raw    = 'sp_live_' + randomHex(16)   // 40-char key
    const hashed = await sha256Hex(raw)
    const prefix = raw.slice(0, 16)              // "sp_live_XXXXXXXX"

    await ctx.db.insert('apiKeys', {
      userId:    clerkId,
      key:       hashed,
      prefix,
      createdAt: Date.now(),
    })

    return raw  // returned once — never stored in plaintext
  },
})

export const listApiKeys = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query('apiKeys')
      .withIndex('by_user', q => q.eq('userId', clerkId))
      .order('desc')
      .collect()
      .then(keys => keys.map(k => ({
        _id:        k._id,
        prefix:     k.prefix,
        createdAt:  k.createdAt,
        lastUsedAt: k.lastUsedAt ?? null,
      })))
  },
})

export const revokeApiKey = mutation({
  args: { clerkId: v.string(), keyId: v.id('apiKeys') },
  handler: async (ctx, { clerkId, keyId }) => {
    const key = await ctx.db.get(keyId)
    if (!key) throw new Error('Key not found')
    if (key.userId !== clerkId) throw new Error('Unauthorized')
    await ctx.db.delete(keyId)
  },
})

// ── Internal: validate key for HTTP endpoints ──────────────────────────────

export const validateApiKey = internalQuery({
  args: { raw: v.string() },
  handler: async (ctx, { raw }) => {
    const hashed = await sha256Hex(raw)
    return await ctx.db
      .query('apiKeys')
      .withIndex('by_key', q => q.eq('key', hashed))
      .unique()
  },
})

export const touchLastUsed = internalMutation({
  args: { keyId: v.id('apiKeys') },
  handler: async (ctx, { keyId }) => {
    await ctx.db.patch(keyId, { lastUsedAt: Date.now() })
  },
})
