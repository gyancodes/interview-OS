import Link from "next/link";

import { buttonStyles } from "@/components/ui";
import { TOPICS } from "@/data/topics";
import { DIFFICULTIES, INTERVIEW_ROLES } from "@/lib/types";

const HERO_STATS = [
  { value: String(TOPICS.length), label: "Engineering topics" },
  { value: String(DIFFICULTIES.length), label: "Skill levels" },
  { value: String(INTERVIEW_ROLES.length), label: "Interview roles" },
  { value: "Live", label: "Question bank" },
];

/** Floating status chips layered over the product preview. */
function FloatingChip({
  className,
  label,
  value,
  tone = "accent",
}: {
  className: string;
  label: string;
  value: string;
  tone?: "accent" | "strong" | "partial";
}) {
  const toneStyles = {
    accent: "text-accent bg-accent-soft",
    strong: "text-strong bg-strong-soft",
    partial: "text-partial bg-partial-soft",
  }[tone];

  return (
    <div
      className={`absolute hidden items-center gap-2.5 rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-soft backdrop-blur-sm lg:flex ${className}`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] font-bold ${toneStyles}`}
      >
        {label}
      </span>
      <span className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">Live</span>
        <span className="text-xs font-semibold text-fg">{value}</span>
      </span>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="gradient-border rounded-2xl p-2 shadow-soft">
        <div className="rounded-xl border border-border bg-surface p-5">
          {/* Session header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-amber-200/70 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                JS
              </span>
              <span className="text-xs font-semibold text-fg">JavaScript</span>
              <span className="text-faint">/</span>
              <span className="text-xs text-muted">Event Loop</span>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
              Q3 / 10
            </span>
          </div>

          {/* Question */}
          <p className="mt-4 text-sm font-medium leading-relaxed text-fg">
            Given <span className="font-mono text-[12px] text-accent">setTimeout(fn, 0)</span> and a
            promise chain, explain the exact order the callbacks run in and why.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["advanced", "microtasks", "event loop"].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Answer sketch */}
          <div className="mt-4 rounded-lg border border-border bg-canvas-subtle/70 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-faint">Your answer</p>
            <div className="mt-2 flex flex-col gap-1.5" aria-hidden>
              <span className="h-1.5 w-[92%] rounded-full bg-border-strong/70" />
              <span className="h-1.5 w-[78%] rounded-full bg-border-strong/60" />
              <span className="h-1.5 w-[64%] rounded-full bg-border-strong/50" />
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-4 rounded-lg border border-accent/25 bg-accent-soft/50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
                AI evaluation
              </span>
              <span className="rounded-md bg-fg px-2 py-0.5 font-mono text-[10px] font-bold text-canvas">
                8 / 10
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              Correct ordering, but the explanation skipped{" "}
              <strong className="font-semibold text-fg">when microtasks are drained</strong>. An
              interviewer will probe that.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-strong/20 bg-strong-soft px-2 py-0.5 text-[10px] font-medium text-strong">
                ✓ Call stack reasoning
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-partial/20 bg-partial-soft px-2 py-0.5 text-[10px] font-medium text-partial">
                ! Missing: task vs microtask queue
              </span>
            </div>
          </div>
        </div>
      </div>

      <FloatingChip
        className="-left-6 top-16 animate-float"
        label="78"
        value="Readiness score"
      />
      <FloatingChip
        className="-right-5 bottom-24 animate-float-slow"
        label="!"
        value="Weak area detected"
        tone="partial"
      />
      <FloatingChip
        className="-left-4 bottom-6 animate-float"
        label="✓"
        value="4 topics on track"
        tone="strong"
      />
    </div>
  );
}


export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-70" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-16">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs text-muted shadow-2xs backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="font-medium text-fg">Every question generated live by AI</span>
          </span>

          <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.4rem]">
            Walk into your interview{" "}
            <span className="text-gradient-accent">already knowing the answers</span>.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            InterviewOS writes fresh questions for your topic and level, grades your answer the way
            an interviewer would, and turns every gap into a weak area you can drill before the real
            thing.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup" className={`${buttonStyles.accent} h-11 px-5 text-sm shadow-glow`}>
              Start practising free <span aria-hidden>→</span>
            </Link>
            <Link href="/#how-it-works" className={`${buttonStyles.secondary} h-11 px-5 text-sm`}>
              See how it works
            </Link>
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-strong" /> No credit card
            </span>
            <span aria-hidden>·</span>
            <span>Email sign-in secured by Appwrite</span>
            <span aria-hidden>·</span>
            <span>Progress stays in your browser</span>
          </p>

          <dl className="mt-2 grid w-full max-w-lg grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 bg-surface/95 px-3.5 py-3">
                <dt className="font-mono text-lg font-bold tracking-tight text-fg">{stat.value}</dt>
                <dd className="text-[10px] uppercase tracking-wider text-faint">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}
