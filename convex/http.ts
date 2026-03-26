import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

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

export default http
