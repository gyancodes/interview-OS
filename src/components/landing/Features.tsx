import { cn } from "@/lib/utils";


/** Minimal inline icon set (no icon dependency, matches the app's SVG style). */
type FeatureIconName = "sparkle" | "score" | "book" | "clock" | "target" | "compass";

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const common = {
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
  };

  switch (name) {
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
          <path d="M18.5 16.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" />
        </svg>
      );
    case "score":
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M7 19V9m5 10V5m5 14v-6" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5V5.5Z" />
          <path d="M19 18v3H7.5A2.5 2.5 0 0 1 5 18.5" />
          <path d="M9 7.5h6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3.5 2" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2Z" />
        </svg>
      );
  }
}

interface Feature {
  icon: FeatureIconName;
  title: string;
  description: string;
  points?: string[];
  span: string;
  emphasized?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: "sparkle",
    title: "Live question generation",
    description:
      "Pick a topic and a skill level. Questions are generated on the fly with the tradeoffs and edge cases an interviewer would actually push on — there is no static bank to memorise.",
    points: [
      "Beginner → Expert, plus Mixed sessions",
      "Category targeting, e.g. Closures or Event Loop",
      "Follow-up questions when your answer gets interesting",
    ],
    span: "lg:col-span-3",
    emphasized: true,
  },
  {
    icon: "score",
    title: "Answers graded like an interviewer",
    description:
      "Write your answer, then get a score with strengths, missing concepts, corrections and the model answer you should have given out loud.",
    points: [
      "Score with concrete reasoning, not a bare number",
      "Missing concepts called out by name",
      "A follow-up probe you can answer immediately",
    ],
    span: "lg:col-span-3",
    emphasized: true,
  },
  {
    icon: "book",
    title: "Structured study guides",
    description:
      "Concept walkthroughs with code examples, common mistakes, interview focus areas and a practice checklist per topic and level.",
    span: "lg:col-span-2",
  },
  {
    icon: "clock",
    title: "Timed mock interviews",
    description:
      "Role-based simulations for frontend, backend, full stack, Node.js and DevOps — 15, 30 or 45 minutes, ending in a written verdict.",
    span: "lg:col-span-2",
  },
  {
    icon: "target",
    title: "Weak-area detection",
    description:
      "Repeated misses on the same concept surface as priorities, so revision follows evidence instead of guesswork.",
    span: "lg:col-span-2",
  },
];


export function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-border/70 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            What you get
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            A full prep loop, not just a question list
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Practice, feedback, study material and measurement live in one workspace, so every
            session feeds the next one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className={cn(
                "group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5",
                feature.span,
                feature.emphasized
                  ? "gradient-border shadow-soft"
                  : "border border-border bg-surface shadow-2xs hover:border-border-strong",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-accent">
                <FeatureIcon name={feature.icon} />
              </span>

              <h3 className="text-base font-semibold tracking-tight text-fg">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-muted sm:text-[13px]">
                {feature.description}
              </p>

              {feature.points ? (
                <ul className="mt-1 flex flex-col gap-2 border-t border-border-subtle pt-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-fg-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


const STEPS = [
  {
    step: "01",
    title: "Configure the session",
    description:
      "Choose a topic, a skill level and how many questions you want. Mixed mode lets the AI pick a level per question so a session never feels predictable.",
    meta: "Topic · Level · 5, 10 or 20 questions",
  },
  {
    step: "02",
    title: "Answer, then get graded",
    description:
      "Write your answer in your own words. You get a score, strengths, missing concepts, corrections and the answer you should have given out loud.",
    meta: "Score · Strengths · Gaps · Model answer",
  },
  {
    step: "03",
    title: "Drill what is actually weak",
    description:
      "Every graded answer updates mastery per topic and flags concepts you keep missing, so the next session targets the real gaps.",
    meta: "Readiness · Weak areas · Mock interview verdicts",
  },
];

export function Workflow() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-border/70 bg-canvas-subtle/60 py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Three steps, repeated until the gaps close
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            No setup, no imports, no question bank to browse. Start a session and the loop runs
            itself.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {STEPS.map((item, index) => (
            <li key={item.step} className="relative flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fg font-mono text-xs font-bold text-canvas shadow-xs">
                  {item.step}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className="hidden h-px flex-1 border-t border-dashed border-border-strong lg:block"
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
                <h3 className="text-base font-semibold tracking-tight text-fg">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted sm:text-[13px]">
                  {item.description}
                </p>
                <p className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-wider text-faint">
                  {item.meta}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
