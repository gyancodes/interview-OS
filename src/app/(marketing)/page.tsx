import type { Metadata } from "next";
import Link from "next/link";

import { displayNameFor } from "@/lib/appwrite/display";
import { CtaBand, CurriculumPreview, FaqSection } from "@/components/landing/Curriculum";
import { FeatureGrid, Workflow } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { FeedbackShowcase, TopicMarquee } from "@/components/landing/Showcase";
import { buttonStyles } from "@/components/ui";
import { getLoggedInUser } from "@/lib/appwrite/server";

import type { AuthUser } from "@/lib/appwrite/types";

export const metadata: Metadata = {
  title: "AI technical interview preparation",
  description:
    "Practise with live AI-generated interview questions, get graded like an interviewer would, study structured guides and run timed mock interviews. Free to start.",
};

/** Shown to visitors who are already signed in, instead of a sign-up push. */
function SignedInBanner({ user }: { user: AuthUser }) {
  return (
    <div className="border-b border-border/70 bg-accent-soft/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-6">
        <p className="text-xs text-fg-muted">
          <span className="font-semibold text-fg">Welcome back, {displayNameFor(user)}.</span> Your
          readiness score, weak areas and mock interview history are waiting.
        </p>
        <Link href="/dashboard" className={buttonStyles.primary}>
          Go to dashboard <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const user = await getLoggedInUser();

  return (
    <>
      <Hero />
      {user ? <SignedInBanner user={user} /> : null}
      <TopicMarquee />
      <FeatureGrid />
      <Workflow />
      <FeedbackShowcase />
      <CurriculumPreview />
      <FaqSection />
      <CtaBand />
    </>
  );
}
