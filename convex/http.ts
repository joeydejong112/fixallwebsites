import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Missing webhook secret", {
        status: 500,
      });
    }

    const payloadString = await request.text();
    const headerPayload = request.headers;

    const svixHeaders = {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    };

    const wh = new Webhook(webhookSecret);
    let evt: { type: string; data: { id: string; email_addresses?: { email_address: string }[] } };

    try {
      evt = wh.verify(payloadString, svixHeaders) as { type: string; data: { id: string; email_addresses?: { email_address: string }[] } };
    } catch (err) {
      return new Response("Error verifying webhook", {
        status: 400,
      });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const email = evt.data.email_addresses?.[0]?.email_address;
      await ctx.runMutation(internal.users.createFromClerk, {
        clerkId: evt.data.id,
        email: email || "",
      });
    }

    if (eventType === "user.updated") {
      const email = evt.data.email_addresses?.[0]?.email_address;
      await ctx.runMutation(internal.users.updateFromClerk, {
        clerkId: evt.data.id,
        email: email || "",
      });
    }

    if (eventType === "user.deleted") {
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkId: evt.data.id,
      });
    }

    return new Response("Webhook processed", { status: 200 });
  }),
});

export default http;
