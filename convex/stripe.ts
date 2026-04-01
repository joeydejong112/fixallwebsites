import { action } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import Stripe from 'stripe'

export const pay = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // @ts-ignore
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

    // @ts-ignore
    const domain = process.env.HOSTING_URL || 'http://localhost:3000'
    // @ts-ignore
    const priceId = process.env.STRIPE_PRO_PRICE_ID

    if (!priceId) {
      throw new Error('Stripe Pro Price ID not configured.')
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: clerkId, // Link payment to Clerk ID
      success_url: `${domain}/dashboard?success=true`,
      cancel_url: `${domain}/pricing?canceled=true`,
    })

    return session.url
  },
})

export const portal = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // @ts-ignore
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

    const customerId = await ctx.runQuery(internal.users.getStripeCustomerId, { clerkId })
    if (!customerId) throw new Error('No Stripe customer found')

    // @ts-ignore
    const domain = process.env.HOSTING_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${domain}/dashboard`,
    })

    return session.url
  },
})
