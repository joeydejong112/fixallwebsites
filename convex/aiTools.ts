"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ─── Action: Generate Meta Tags from URL ─────────────────────────────────────
export const generateMetaTags = action({
  args: {
    url: v.string(),
    clerkId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    // Free plan — blocked
    if (args.plan === "free") throw new Error("AI_LIMIT_REACHED");

    // Check + increment usage
    await ctx.runMutation(internal.aiUsage.checkAndIncrementMetaUsage, {
      userId: args.clerkId,
      plan: args.plan,
    });

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are an SEO expert. Analyze the website at this URL and generate optimized SEO meta tags.

URL: ${args.url}

Return ONLY a JSON object with exactly these fields:
{
  "title": "...",        // 50-60 chars, compelling, includes main keyword
  "description": "..."  // 140-155 chars, action-oriented, includes keyword
}

No markdown, no explanation, just the JSON.`,
        },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(text.trim()) as { title: string; description: string };
    return { title: parsed.title ?? "", description: parsed.description ?? "" };
  },
});

// ─── Action: Generate Alt Text ────────────────────────────────────────────────
export const generateAltText = action({
  args: {
    imageUrl: v.optional(v.string()),
    imageBase64: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    clerkId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.plan === "free") throw new Error("AI_LIMIT_REACHED");

    await ctx.runMutation(internal.aiUsage.checkAndIncrementAltUsage, {
      userId: args.clerkId,
      plan: args.plan,
    });

    let imageSource: Anthropic.Base64ImageSource | Anthropic.URLImageSource;

    if (args.imageBase64 && args.mimeType) {
      imageSource = {
        type: "base64",
        media_type: args.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: args.imageBase64,
      };
    } else if (args.imageUrl) {
      imageSource = {
        type: "url",
        url: args.imageUrl,
      };
    } else {
      throw new Error("Provide imageUrl or imageBase64");
    }

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: imageSource },
            {
              type: "text",
              text: "Write concise, descriptive alt text for this image. Be specific about what is shown. Keep it under 125 characters. Return ONLY the alt text, no quotes or explanation.",
            },
          ],
        },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    return { altText: text };
  },
});
