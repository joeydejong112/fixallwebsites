import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const MS_24H = 24 * 60 * 60 * 1000

export const checkAndSendAlert = internalAction({
  args: {
    userId:        v.string(),
    url:           v.string(),
    monitorId:     v.id('monitoredSites'),
    newScore:      v.number(),
    previousScore: v.optional(v.number()),
    lastAlertSentAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, url, monitorId, newScore, previousScore, lastAlertSentAt }) => {
    if (previousScore === undefined) return

    // Fetch user alertPreferences + email
    const user = await ctx.runQuery(internal.users.getUserForAlert, { clerkId: userId })
    if (!user) return
    if (user.plan !== 'pro') return
    if (!user.alertPreferences?.enabled) return

    const { threshold, email } = user.alertPreferences
    const alertTo = email || user.email

    // Only alert if new score is below threshold
    if (newScore >= threshold) return

    // Spam guard: don't send more than once per 24h per monitor
    if (lastAlertSentAt && Date.now() - lastAlertSentAt < MS_24H) return

    // @ts-ignore
    const hostingUrl = process.env.HOSTING_URL || 'http://localhost:3000'

    await ctx.runAction(internal.emails.sendAlertEmail, {
      to: alertTo,
      url,
      newScore,
      previousScore,
      threshold,
      hostingUrl,
    })

    await ctx.runMutation(internal.monitors.updateLastAlertSent, { monitorId })
  },
})
