import { internalAction } from './_generated/server'
import { v } from 'convex/values'

export const checkAndSendAlert = internalAction({
  args: { 
    userId: v.string(), 
    url: v.string(), 
    newScore: v.number(), 
    previousScore: v.optional(v.number()) 
  },
  handler: async (ctx, { userId, url, newScore, previousScore }) => {
    if (previousScore === undefined) return // No baseline to compare against
    
    const drop = previousScore - newScore
    if (drop >= 5) {
      // Significant drop detected
      // @ts-ignore
      const resendApiKey = process.env.RESEND_API_KEY
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured. Skipping email alert.')
        return
      }

      // In a real app we'd fetch the user's email from clerk or our `users` table via an internalQuery
      // Since this is edge action, we can't run queries directly without passing it or using internalQuery
      // Let's assume we send to a default or we'd fetch it. For now, we will log it.
      // E.g., const userEmail = await ctx.runQuery(api.users.getEmail, { clerkId: userId })
      
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'ScanPulse Alerts <alerts@scanpulse.com>', // User needs to verify domain in Resend
            to: 'admin@scanpulse.com', // Placeholder: Would dynamically route to user email
            subject: `Alert: ${url} Health Score Dropped!`,
            html: `
              <h2>ScanPulse Monitoring Alert</h2>
              <p>Your monitored site <strong>${url}</strong> has experienced a significant health score drop.</p>
              <ul>
                <li>Previous Score: ${previousScore}</li>
                <li>New Score: ${newScore}</li>
                <li>Drop: -${drop} points</li>
              </ul>
              <p>Log in to your Dashboard to see what checks recently failed.</p>
            `
          })
        })
        
        if (!res.ok) {
          console.error('Failed to send Resend email:', await res.text())
        }
      } catch (err) {
        console.error('Error triggering email alert:', err)
      }
    }
  }
})
