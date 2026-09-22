import type { Metadata } from "next";

import { Header } from "@/components/Header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InterviewOS — AI interview preparation for engineers",
    template: "%s · InterviewOS",
  },
  description:
    "Practice concepts, explain your thinking, and identify your weak areas before your next software engineering interview.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-canvas text-fg">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
