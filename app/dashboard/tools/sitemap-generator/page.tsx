import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SitemapClient } from "./SitemapClient";

export const metadata = {
  title: "XML Sitemap Generator | SiteFix",
  description: "Crawl your website and generate an XML sitemap for SEO.",
};

export default async function SitemapGeneratorPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return <SitemapClient clerkId={user.id} />;
}
