import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import postcss from "postcss";
import cssnano from "cssnano";
import { minify as minifyJs } from "terser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, type } = await req.json();

    if (!code || !type) {
      return NextResponse.json({ error: "Code and type are required" }, { status: 400 });
    }

    // Verify user plan via Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user || user.plan === "free") {
      return NextResponse.json({ error: "Plan upgrade required" }, { status: 403 });
    }

    let minifiedCode = "";

    if (type === "css") {
      const result = await postcss([cssnano({ preset: 'default' })]).process(code, { from: undefined });
      minifiedCode = result.css;
    } else if (type === "js") {
      const result = await minifyJs(code, { compress: true, mangle: true });
      minifiedCode = result.code || "";
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'css' or 'js'." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      minifiedCode,
      originalSize: Buffer.byteLength(code, 'utf8'),
      newSize: Buffer.byteLength(minifiedCode, 'utf8')
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to minify code" }, { status: 500 });
  }
}
