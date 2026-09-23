import Link from "next/link";

import { topicsByTrack } from "@/data/topics";

/**
 * Curriculum overview built from the real topic catalogue, so the landing page
 * can never drift from what the app actually covers.
 */
export function CurriculumPreview() {
  const groups = topicsByTrack();
  const topicCount = groups.reduce((total, group) => total + group.topics.length, 0);
  const categoryCount = groups.reduce(
    (total, group) => total + group.topics.reduce((sum, topic) => sum + topic.categories.length, 0),
    0,
  );

  return (
    <section id="curriculum" className="scroll-mt-24 border-t border-border/70 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
              Curriculum
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {topicCount} topics, {categoryCount}+ interview categories
            </h2>
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              Language semantics, frontend rendering, backend reliability, platform work and system
              design — each with its own categories, study material and skill levels.
            </p>
          </div>

          <Link
            href="/learn"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            Browse study guides <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.track}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold tracking-tight text-fg">{group.track}</h3>
                <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-faint">
                  {group.topics.length} {group.topics.length === 1 ? "topic" : "topics"}
                </span>
              </div>

              <ul className="flex flex-col divide-y divide-border-subtle">
                {group.topics.map((topic) => (
                  <li key={topic.id} className="flex items-center justify-between gap-3 py-2">
                    <Link
                      href={`/practice?topic=${topic.id}`}
                      className="text-xs font-medium text-fg-muted transition-colors hover:text-accent"
                    >
                      {topic.name}
                    </Link>
                    <span className="shrink-0 font-mono text-[10px] text-faint">
                      {topic.categories.length} cats
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


const FAQ_ITEMS = [
  {
    question: "Are the questions the same every time?",
    answer:
      "No. Every question is generated live for your chosen topic and skill level, so the same topic produces different questions on each session. There is no static question bank to memorise.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "Yes — the dashboard, practice sessions, study guides and mock interviews sit behind a free account. Sign-in is email and password, handled by Appwrite, and it takes a few seconds.",
  },
  {
    question: "Where is my progress stored?",
    answer:
      "Attempts, saved questions, cached study guides and mock interview history are stored locally in your browser and namespaced to your account, so two accounts on the same device never mix data. You can wipe it any time from the account page.",
  },
  {
    question: "How are answers graded?",
    answer:
      "Your written answer is compared against what a strong interview answer contains for that question: correct reasoning, named tradeoffs and edge cases. You get a score, strengths, missing concepts, corrections and a model answer — plus a follow-up probe.",
  },
  {
    question: "What do the skill levels mean?",
    answer:
      "Beginner covers fundamentals and mental models, Intermediate covers real-world behaviour and tradeoffs, Advanced covers internals and edge cases, Expert covers spec-level nuance. Mixed lets the AI vary the level within one session.",
  },
  {
    question: "Is my API usage private?",
    answer:
      "Yes. AI requests are made from server-side route handlers only, so no API keys are shipped to the browser. Sharing a practice question shares text, never credentials.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border/70 bg-canvas-subtle/60 py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            FAQ
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Questions before you start
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Everything about how sessions, scoring and accounts work.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-border bg-surface px-4 py-3.5 shadow-2xs transition-colors open:border-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-fg">
                {item.question}
                <span
                  aria-hidden
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-faint transition-transform group-open:rotate-45"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-2.5 text-xs leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="border-t border-border/70 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-fg px-6 py-14 shadow-soft sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-aurora animate-gradient-pan opacity-70"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-20" aria-hidden />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-glow" />
              Start in under a minute
            </span>

            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Make your next interview a predictable problem
            </h2>

            <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Create a free account, run one practice session, and see exactly which concepts still
              sit between you and the offer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-fg shadow-xs transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98]"
              >
                Create free account <span aria-hidden>→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/40 hover:text-white"
              >
                I already have an account
              </Link>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              No credit card · Email sign-in · Sessions secured by Appwrite
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
