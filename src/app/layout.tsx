import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { getLoggedInUser } from "@/lib/appwrite/server";

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

/**
 * Root layout: fonts, theme and the auth context.
 *
 * The Appwrite account is resolved here once per request and shared with the
 * client tree, which also scopes LocalStorage to that user. Navigation chrome
 * lives in the route group layouts ((marketing), (auth), (app)) because each
 * area needs a different frame.
 *
 * Rendering is forced dynamic on purpose: every page reflects session state
 * (header avatar, signed-in banner, protected layouts). Without this, a build
 * that runs without Appwrite env vars would bake in an anonymous/redirected
 * static page for signed-in visitors.
 */
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getLoggedInUser();

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-fg antialiased selection:bg-accent selection:text-white">
        {/* Subtle top ambient aura */}
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,rgba(37,99,235,0.06),transparent_65%)]"
          aria-hidden="true"
        />

        <AuthProvider user={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}

