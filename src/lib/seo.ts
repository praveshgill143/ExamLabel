import type { Metadata } from "next";

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export type SeoPage = {
  slug: string; title: string; description: string; eyebrow: string; heading: string; intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faqs?: Array<{ question: string; answer: string }>; related: string[];
};

type Seed = Omit<SeoPage, "slug">;
const audience = "Perfect for schools, institutes, businesses, offices, events, examinations, and anyone who needs to print labels in bulk.";
const make = (slug: string, seed: Seed): SeoPage => ({ slug, ...seed });

const common = (use: string, heading: string, intro: string, description: string, title: string, related: string[], extra?: string, faqs?: SeoPage["faqs"]): SeoPage => make(use, {
  title, description, eyebrow: heading, heading, intro,
  sections: [
    { heading: "A practical spreadsheet workflow", paragraphs: ["Use your own column headings and keep your data in the spreadsheet you already maintain. ExamLabel processes the file in your browser and turns each row into a consistent printable label.", extra ?? audience] },
    { heading: "Review, download, and print", paragraphs: ["Upload Excel or CSV data, check the table and A4 preview, adjust the available label settings when needed, then download or print the PDF at Actual Size or 100%."] }
  ],
  related, faqs
});

export const seoPages: Record<string, SeoPage> = {
  "label-generator": common("label-generator", "Online Label Generator", "Create clean, printable labels from Excel or CSV in a few steps. ExamLabel reads your headings, formats each row, and produces a PDF ready for A4 printing.", "Create printable labels online from Excel or CSV files with ExamLabel's simple bulk label generator.", "Online Label Generator | ExamLabel", ["excel-to-labels", "csv-to-labels", "bulk-label-generator"]),
  "excel-to-labels": common("excel-to-labels", "Excel to Labels", "Convert an Excel spreadsheet into a print-ready label PDF without manually copying rows into a document.", "Turn Excel rows into printable PDF labels online with your own headings using ExamLabel.", "Excel to Labels Converter | ExamLabel", ["label-generator", "a4-label-generator", "st24-label-generator"], "Useful for student records, office batches, event materials, examination paperwork, inventory, and other bulk printing tasks."),
  "csv-to-labels": common("csv-to-labels", "CSV to Labels", "Use a CSV export as the starting point for a clean set of printable labels. ExamLabel maps your headings and rows into a consistent A4 PDF.", "Convert CSV data into printable bulk labels online with ExamLabel.", "CSV to Labels Converter | ExamLabel", ["label-generator", "bulk-label-generator", "printable-label-generator"], "Use it for schools, colleges, coaching institutes, offices, businesses, events, examination centres, or any other organized list."),
  "bulk-label-generator": common("bulk-label-generator", "Bulk Label Generator", "Prepare a whole batch of labels at once instead of typing each label by hand. ExamLabel converts spreadsheet rows into a paginated PDF for review, download, and printing.", "Generate many printable labels from Excel or CSV in one browser workflow with ExamLabel.", "Bulk Label Generator Online | ExamLabel", ["label-generator", "excel-to-labels", "printable-label-generator"], "Bulk printing can support examination packets, student records, office mailings, event materials, internal documents, and organized business workflows."),
  "printable-label-generator": common("printable-label-generator", "Printable Label Generator", "Create labels that are ready to review and print. ExamLabel turns spreadsheet data into an A4 PDF and gives you a preview before the pages leave your browser.", "Make printable labels from Excel or CSV and download an A4 PDF with ExamLabel.", "Printable Label Generator | ExamLabel", ["a4-label-generator", "st24-label-generator", "bulk-label-generator"]),
  "a4-label-generator": common("a4-label-generator", "A4 Label Generator", "Generate a neatly paginated A4 label sheet from a spreadsheet. ExamLabel includes a browser preview so you can check the result before printing.", "Generate A4 printable labels from Excel or CSV with ExamLabel.", "A4 Label Generator from Excel or CSV | ExamLabel", ["printable-label-generator", "st24-label-generator", "excel-to-labels"], "The current workflow targets A4 ST-24 sheets with 24 labels arranged in 3 columns and 8 rows."),
  "exam-label-generator": common("exam-label-generator", "Exam Label Generator", "Prepare examination labels in bulk from the spreadsheet your team already maintains. Review the rows, preview the A4 sheet, and create a print-ready PDF.", "Create printable examination labels from Excel or CSV data with ExamLabel.", "Exam Label Generator from Excel | ExamLabel", ["student-label-generator", "school-exam-label-generator", "label-generator"], "ExamLabel can help examination centres, schools, colleges, universities, coaching institutes, and administrators. It is not limited to schools.", [{ question: "Is ExamLabel only for schools?", answer: "No. It is a general-purpose online bulk label generator for businesses, offices, events, organizations, and anyone who needs bulk printable labels." }]),
  "student-label-generator": common("student-label-generator", "Student Label Generator", "Turn a student list into consistent printable labels. Upload a workbook or CSV, check the parsed records, and prepare an A4 PDF for your next batch.", "Create student labels in bulk from Excel or CSV records with ExamLabel.", "Student Label Generator from Excel or CSV | ExamLabel", ["exam-label-generator", "school-exam-label-generator", "excel-to-labels"], "Student records often already live in a spreadsheet, so administrators and teachers can reuse familiar data instead of retyping it."),
  "school-exam-label-generator": common("school-exam-label-generator", "School Exam Label Generator", "Help school teams prepare examination labels from the student data they already have. ExamLabel provides a simple upload, preview, and print workflow.", "Prepare school examination labels from Excel or CSV with ExamLabel.", "School Exam Label Generator | ExamLabel", ["exam-label-generator", "student-label-generator", "a4-label-generator"], "ExamLabel is not school-only. Colleges, universities, coaching institutes, businesses, offices, event organizers, and other organizations can use the same process."),
  "st24-label-generator": common("st24-label-generator", "ST-24 Label Generator", "Generate labels for A4 ST-24 sheets from your own spreadsheet data. ExamLabel previews the 24-label page and creates a PDF for accurate printing.", "Create printable labels for A4 ST-24 sheets from Excel or CSV with ExamLabel.", "ST-24 Label Generator for A4 Sheets | ExamLabel", ["a4-label-generator", "printable-label-generator", "exam-label-generator"], "The application is set up for ST-24 sheets with 24 labels across 3 columns and 8 rows.")
};

export function createSeoMetadata(item: SeoPage): Metadata {
  const url = new URL("/" + item.slug, siteUrl);
  return { metadataBase: siteUrl, title: item.title, description: item.description, alternates: { canonical: url.pathname }, robots: { index: true, follow: true }, openGraph: { type: "website", url, title: item.title, description: item.description, siteName: "ExamLabel", locale: "en_US" }, twitter: { card: "summary", title: item.title, description: item.description } };
}

