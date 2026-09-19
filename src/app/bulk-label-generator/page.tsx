import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { createSeoMetadata, seoPages } from "@/lib/seo";

const page = seoPages["bulk-label-generator"];

export const metadata: Metadata = createSeoMetadata(page);

export default function Page() {
  return <SeoLandingPage page={page} />;
}
