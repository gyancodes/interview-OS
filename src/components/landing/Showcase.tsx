import { TOPICS } from "@/data/topics";

/** Infinite topic ribbon. The second copy is aria-hidden to keep it decorative. */
export function TopicMarquee() {
  const doubled = [...TOPICS, ...TOPICS];

  return (
    <section
      aria-label="Topics covered"
      className="relative overflow-hidden border-y border-border/70 bg-surface py-6"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-canvas to-transparent sm:w-32"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-canvas to-transparent sm:w-32"
        aria-hidden
      />

      <div className="animate-marquee marquee-track flex w-max items-center">
        {doubled.map((topic, index) => (
          <span
            key={`${topic.id}-${index}`}
            aria-hidden={index >= TOPICS.length}
            className="mr-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 px-3.5 py-1.5 text-xs font-medium text-fg-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
            {topic.name}
          </span>
        ))}
      </div>
    </section>
  );
}

const SAMPLE_STRENGTHS = [
  "Correctly placed promise callbacks in the microtask queue",
  "Explained why setTimeout(fn, 0) is not immediate",
  "Used accurate terminology throughout",
];

const SAMPLE_GAPS = [
  "Did not mention that microtasks drain fully before the next macrotask",
  "Missed starvation: a microtask that queues another delays rendering",
];

export function FeedbackShowcase() {
  return (
    <section className="relative overflow-hidden border-t border-border/70 bg-code-bg py-20 text-code-fg">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(37,99,235,0.55),transparent_60%),radial-gradient(ellipse_50%_45%_at_85%_10%,rgba(139,92,246,0.4),transparent_60%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col gap-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-blue-300">
            Feedback loop
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Feedback that sounds like a real interviewer
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            Every answer is scored against what an interviewer is listening for: correct reasoning,
            the tradeoffs you named, and the details you skipped. Then you get a follow-up probe to
            close the loop.
          </p>

          <ul className="flex flex-col gap-3 pt-2">
            {[
              "Score plus the reasoning behind it",
              "Strengths, missing concepts and corrections as separate lists",
              "A model answer written the way you would say it out loud",
              "A follow-up question to test whether the gap is closed",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-blue-300">
                  <svg
                    aria-hidden
                    className="h-2.5 w-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Evaluation · JavaScript / Event Loop
              </span>
              <span className="rounded-md bg-blue-500 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                8 / 10
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              Strong answer. You sequenced the callbacks correctly and understood that a zero delay
              is still a macrotask. The gap is in the mechanism: microtasks are drained to completion
              after the current task, before the browser paints.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                  Strengths
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {SAMPLE_STRENGTHS.map((item) => (
                    <li key={item} className="text-[11px] leading-relaxed text-zinc-300">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                  Missing concepts
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {SAMPLE_GAPS.map((item) => (
                    <li key={item} className="text-[11px] leading-relaxed text-zinc-300">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              Follow-up probe
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-200">
              “If a microtask queues another microtask, what happens to the timer callback that is
              already waiting?”
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="rounded-full border border-white/10 px-2 py-0.5">Starvation</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">Rendering</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">Task queues</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
