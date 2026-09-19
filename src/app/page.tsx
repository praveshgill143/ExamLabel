import { ExamLabelApp } from "@/components/ExamLabelApp";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ExamLabel",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description: "Online exam label generator for schools and institutions.",
};

const steps = [
  ["Upload", "Upload your Excel or CSV examination data."],
  ["Format", "Your spreadsheet headings automatically become label fields."],
  ["Preview", "Check the A4 label layout before printing."],
  ["Download", "Download the PDF and print it at Actual Size when you are ready."],
];

const audiences = [
  "CBSE Schools",
  "ICSE Schools",
  "State-Board Schools",
  "International Schools",
  "Colleges & Universities",
  "Examination Centres",
  "Coaching & Training Institutes",
];

const faqs = [
  ["Can I create exam labels from Excel?", "Yes. Upload an .xlsx or .xls workbook and ExamLabel reads the first sheet to create label records."],
  ["Can I upload CSV files?", "Yes. CSV files are supported alongside .xlsx and .xls files."],
  ["Can I use my own Excel headings?", "Yes. Non-empty headings from the first row become the label field headings."],
  ["How many labels fit on an A4 ST-24 sheet?", "The supported ST-24 layout has 24 labels on an A4 page, arranged in 3 columns by 8 rows."],
  ["Can I start printing from a partially used sheet?", "Yes. Use Start Label to choose where the first generated label should begin."],
  ["Can I download the labels as PDF?", "Yes. After valid rows are loaded, use Download PDF to save the generated labels."],
  ["Can I print the downloaded PDF?", "Yes. Download PDF saves the generated PDF, which you can print from your normal PDF viewer or browser at Actual Size."],
  ["Does ExamLabel work for CBSE schools?", "Yes. ExamLabel is designed for school examination teams, including CBSE schools, and uses the spreadsheet data you provide."],
  ["Can international schools use ExamLabel?", "Yes. International schools, colleges, examination centres, and institutes can use the same Excel or CSV workflow."],
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <ExamLabelApp />
      <section className="homepage-sections" aria-label="ExamLabel product information">
        <section className="marketing-section how-it-works" aria-labelledby="how-it-works-heading">
          <div className="section-heading">
            <p className="eyebrow">A simple exam-label workflow</p>
            <h2 id="how-it-works-heading">How it works</h2>
            <p>Move from your examination spreadsheet to a print-ready A4 sheet without retyping each label. Whether you need Excel exam labels, printable exam labels, student exam labels, or A4 exam labels, ExamLabel keeps the workflow focused and easy to review.</p>
          </div>
          <div className="step-grid">
            {steps.map(([title, description], index) => (
              <article className="step-card" key={title}>
                <span className="step-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section audience-section" aria-labelledby="audience-heading">
          <div className="section-heading">
            <p className="eyebrow">Made for education teams</p>
            <h2 id="audience-heading">Built for schools and examination teams worldwide</h2><p>From CBSE exam labels to international school exam labels, the same reliable spreadsheet workflow supports education teams across different curricula and institutions.</p>
          </div>
          <ul className="audience-grid">
            {audiences.map((audience) => <li key={audience}>{audience}</li>)}
          </ul>
        </section>

        <section className="privacy-note" aria-label="Privacy">
          <h2>Your spreadsheet stays in your browser</h2>
          <p>Your spreadsheet is processed in your browser. Your student data does not need to be uploaded to our server to generate labels.</p>
        </section>

        <section className="marketing-section faq-section" aria-labelledby="faq-heading">
          <div className="section-heading">
            <p className="eyebrow">Answers before you print</p>
            <h2 id="faq-heading">Frequently asked questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
