import type { Metadata } from "next";
import "./globals.css";
import { AppThemeProvider } from "@/lib/theme";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SmartGrader | AI-Powered Short Answer Evaluation Studio",
  description: "Dual-engine NLP short answer grading using Rule-Based and Semantic AI models.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100">
        <AppThemeProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
        </AppThemeProvider>
      </body>
    </html>
  );
}
