import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ImageConverterClient } from "./ImageConverterClient";

export const metadata = {
  title: "Image Converter — SiteFix",
  description: "Convert JPG, PNG, and GIF images to optimized WebP format",
};

export default async function ImageConverterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <ImageConverterClient clerkId={userId} />;
}
