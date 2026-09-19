import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Online Exam Label Generator | ExamLabel", template: "%s | ExamLabel" },
  description: "Create professional, print-ready exam labels from Excel or CSV in seconds. Designed for CBSE, ICSE, state-board and international schools, colleges, examination centres and institutes.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "ExamLabel", locale: "en_US", title: "Online Exam Label Generator | ExamLabel", description: "Create professional, print-ready exam labels from Excel or CSV in seconds." },
  twitter: { card: "summary", title: "Online Exam Label Generator | ExamLabel", description: "Create professional, print-ready exam labels from Excel or CSV in seconds." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}


