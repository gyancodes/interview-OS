import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import { Header } from "@/components/Header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InterviewOS — AI Technical Interview Preparation",
    template: "%s · InterviewOS",
  },
  description:
    "Master software engineering interviews with live AI-generated practice, deep concept guides, and real-time mock interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-canvas text-fg font-sans antialiased selection:bg-accent selection:text-white flex flex-col">
        {/* Subtle top ambient aura */}
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,rgba(37,99,235,0.06),transparent_65%)]"
          aria-hidden="true"
        />

        {/* Global sticky header */}
        <Header />

        {/* Main Content */}
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="relative z-10 border-t border-border bg-canvas-subtle/50 py-8 text-xs text-muted">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-fg font-mono text-[10px] font-semibold text-canvas">
                OS
              </span>
              <span className="font-medium text-fg">InterviewOS</span>
              <span className="text-faint">·</span>
              <span className="text-muted">AI-Powered Engineering Interview Prep</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/practice" className="transition-colors hover:text-fg">
                Practice
              </Link>
              <Link href="/learn" className="transition-colors hover:text-fg">
                Learn
              </Link>
              <Link href="/mock-interview" className="transition-colors hover:text-fg">
                Mock Interview
              </Link>
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-faint">
                v1.0
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
