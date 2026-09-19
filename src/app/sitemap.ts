import type { MetadataRoute } from "next";
import { siteUrl, seoPages } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [{ url: siteUrl.toString(), lastModified: now, changeFrequency: "weekly", priority: 1 }, ...Object.values(seoPages).map((page) => ({ url: new URL("/" + page.slug, siteUrl).toString(), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 }))];
}
