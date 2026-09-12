import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exam Label Generator",
  description: "Create calibrated ST-24 exam labels from Excel files.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
