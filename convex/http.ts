'use node'

import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { Webhook } from 'svix'

const http = httpRouter()

http.route({
  path: '/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const svixId        = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 })
    }

    const payload = await req.text()
    const wh = new Webhook(webhookSecret)
    let data: any
    try {
      data = wh.verify(payload, {
        'svix-id':        svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any
    } catch {
      return new Response('Invalid webhook signature', { status: 400 })
    }

    if (data.type === 'user.created' || data.type === 'user.updated') {
      const clerkId = data.data.id as string
      const email   = data.data.email_addresses?.[0]?.email_address ?? ''

      if (!email) {
        return new Response('Missing email', { status: 400 })
      }

      const firstName = data.data.first_name as string | null
      const lastName  = data.data.last_name  as string | null
      const name      = [firstName, lastName].filter(Boolean).join(' ') || undefined

      await ctx.runMutation(internal.users.upsertUser, { clerkId, email, name })
    }

    return new Response(null, { status: 200 })
  }),
})

export default http
