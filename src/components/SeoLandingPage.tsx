import Link from "next/link";
import type { SeoPage } from "@/lib/seo";
import { siteUrl } from "@/lib/seo";

type Props = { page: SeoPage; includeWebsiteSchema?: boolean };

export function SeoLandingPage({ page, includeWebsiteSchema = false }: Props) {
  const softwareSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "ExamLabel", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: siteUrl.toString(), description: page.description };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ExamLabel", url: siteUrl.toString(), description: "Online exam label generator for schools and institutions using Excel and CSV files." };
  const faqSchema = page.faqs?.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) } : null;

  return <main className="seo-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    {includeWebsiteSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /> : null}
    {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
    <nav className="seo-nav" aria-label="Primary navigation"><Link href="/" className="seo-brand">ExamLabel</Link><Link href="/" className="seo-nav-link">Open the label generator</Link></nav>
    <div className="seo-content">
      <p className="eyebrow">{page.eyebrow}</p><h1>{page.heading}</h1><p className="seo-lede">{page.intro}</p>
      <p><Link href="/" className="seo-cta">Create labels from Excel or CSV</Link></p>
      {page.sections.map((section) => <section className="seo-section" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      {page.faqs?.length ? <section className="seo-section" aria-labelledby="faq-heading"><h2 id="faq-heading">Frequently asked questions</h2>{page.faqs.map((faq) => <div className="seo-faq" key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}</section> : null}
      <section className="seo-section seo-related" aria-labelledby="related-heading"><h2 id="related-heading">Explore related label workflows</h2><ul>{page.related.map((slug) => <li key={slug}><Link href={"/" + slug}>{slug.replaceAll("-", " ")}</Link></li>)}</ul></section>
      <p className="seo-bottom-cta"><Link href="/">Open ExamLabel</Link> to upload your spreadsheet and make printable labels.</p>
    </div>
  </main>;
}

