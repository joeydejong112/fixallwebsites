import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { api, internal } from './_generated/api'
import Stripe from 'stripe'

const http = httpRouter()

// ── Svix HMAC-SHA256 webhook verification (no npm dependency) ──────────────
// Implements the same algorithm as the svix SDK using the Web Crypto API,
// which is available in the Convex edge runtime.
async function verifySvixSignature(
  secret: string,
  msgId: string,
  msgTimestamp: string,
  body: string,
  sigHeader: string,
): Promise<boolean> {
  // Secret format: "whsec_<base64>"
  const base64Secret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const secretBytes  = Uint8Array.from(atob(base64Secret), c => c.charCodeAt(0))

  const signedContent    = `${msgId}.${msgTimestamp}.${body}`
  const signedContentBuf = new TextEncoder().encode(signedContent)

  const key = await crypto.subtle.importKey(
    'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sigBuf    = await crypto.subtle.sign('HMAC', key, signedContentBuf)
  const computed  = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

  // svix-signature header: "v1,<base64> v1,<base64> …"
  const provided = sigHeader
    .split(' ')
    .filter(s => s.startsWith('v1,'))
    .map(s => s.slice(3))

  return provided.some(sig => sig === computed)
}

// ── Clerk webhook endpoint ─────────────────────────────────────────────────
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

    const valid = await verifySvixSignature(
      webhookSecret, svixId, svixTimestamp, payload, svixSignature,
    )
    if (!valid) {
      return new Response('Invalid webhook signature', { status: 400 })
    }

    let data: any
    try {
      data = JSON.parse(payload)
    } catch {
      return new Response('Invalid JSON payload', { status: 400 })
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

http.route({
  path: '/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get('stripe-signature') as string
    let event: Stripe.Event

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

    try {
      const payload = await request.text()
      event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      )
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const clerkId = session.client_reference_id
          
          if (clerkId && session.subscription && session.customer) {
            await ctx.runMutation(internal.users.updateStripe, {
              clerkId,
              plan: 'pro',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            })
          }
          break
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          await ctx.runMutation(internal.users.updateStripe, {
            stripeCustomerId: subscription.customer as string,
            plan: 'free',
            stripeSubscriptionId: '',
            stripePriceId: '',
          })
          break
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          
          if (subscription.status !== 'active' && subscription.status !== 'trialing' && subscription.status !== 'past_due') {
            await ctx.runMutation(internal.users.updateStripe, {
              stripeCustomerId: subscription.customer as string,
              plan: 'free',
            })
          } else {
            await ctx.runMutation(internal.users.updateStripe, {
              stripeCustomerId: subscription.customer as string,
              plan: 'pro',
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
            })
          }
          break
        }
      }
    } catch (e: any) {
      console.error('Failed to process stripe payload inside mutation', e)
      return new Response('Internal Server Error', { status: 500 })
    }

    return new Response(null, { status: 200 })
  })
})

// ── Helper: validate Bearer API key ───────────────────────────────────────
async function resolveApiKey(ctx: any, req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const raw = auth.slice(7).trim()
  return await ctx.runQuery(internal.apiKeys.validateApiKey, { raw })
}

// ── POST /api/scan ─────────────────────────────────────────────────────────
http.route({
  path: '/api/scan',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const apiKey = await resolveApiKey(ctx, req)
    if (!apiKey) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    let body: any
    try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) }

    const url = body?.url
    if (!url || typeof url !== 'string') return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const scanId = await ctx.runMutation(api.scans.createScan, { userId: apiKey.userId, url })
    ctx.runAction(api.scanAction.runScan, { scanId, url }).catch(() => {})  // fire-and-forget

    await ctx.runMutation(internal.apiKeys.touchLastUsed, { keyId: apiKey._id })

    return new Response(JSON.stringify({ scanId, status: 'running' }), { status: 202, headers: { 'Content-Type': 'application/json' } })
  }),
})

// ── GET /api/scan/:id ──────────────────────────────────────────────────────
http.route({
  path: '/api/scan',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const apiKey = await resolveApiKey(ctx, req)
    if (!apiKey) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const scanId = new URL(req.url).searchParams.get('id') as any
    if (!scanId) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const scan = await ctx.runQuery(api.scans.getScan, { scanId })
    if (!scan) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    if (scan.userId !== apiKey.userId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify(scan), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }),
})

export default http
