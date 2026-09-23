import Link from "next/link";

import { TOPICS, TOPIC_MAP } from "@/data/topics";

const REPOSITORY_URL = "https://github.com/gyancodes/interview-OS";

const PRODUCT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Study guides" },
  { href: "/mock-interview", label: "Mock interview" },
  { href: "/profile", label: "Account" },
] as const;

const RESOURCE_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#faq", label: "FAQ" },
  { href: "/signup", label: "Create account" },
] as const;

const FEATURED_TOPICS = ["javascript", "typescript", "react", "nodejs", "system-design"] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-fg text-canvas">
        <span className="font-mono text-[11px] font-bold tracking-tighter">OS</span>
      </span>
      <span className="text-sm font-semibold tracking-tight text-fg">
        Interview<span className="font-bold text-accent">OS</span>
        {compact ? null : (
          <span className="ml-2 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-faint">
            v1.0
          </span>
        )}
      </span>
    </Link>
  );
}

/** Minimal footer used inside the authenticated app shell. */
function SlimFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-canvas-subtle/60 py-8 text-xs text-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark compact />
          <span className="text-faint">·</span>
          <span className="text-muted">AI-powered engineering interview prep</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/practice" className="transition-colors hover:text-fg">
            Practice
          </Link>
          <Link href="/learn" className="transition-colors hover:text-fg">
            Learn
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-fg">
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
}


/** Full marketing footer used on the landing and auth pages. */
function FullFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-canvas-subtle/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <BrandMark />
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Live AI-generated questions, structured study guides and timed mock interviews —
              built to make technical interview practice measurable.
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
              <span className="rounded-full border border-border bg-surface px-2 py-0.5">
                Next.js 15
              </span>
              <span className="rounded-full border border-border bg-surface px-2 py-0.5">Groq</span>
              <span className="rounded-full border border-border bg-surface px-2 py-0.5">
                Appwrite
              </span>
            </div>
          </div>

          <nav aria-label="Product" className="flex flex-col gap-3">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-fg">
              Product
            </h2>
            <ul className="flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Topics" className="flex flex-col gap-3">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-fg">
              Popular topics
            </h2>
            <ul className="flex flex-col gap-2">
              {FEATURED_TOPICS.map((topicId) => (
                <li key={topicId}>
                  <Link
                    href={`/practice?topic=${topicId}`}
                    className="text-xs text-muted transition-colors hover:text-accent"
                  >
                    {TOPIC_MAP[topicId].name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources" className="flex flex-col gap-3">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-fg">
              Resources
            </h2>
            <ul className="flex flex-col gap-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted transition-colors hover:text-accent"
                >
                  Source code ↗
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[11px] text-faint">
            © {new Date().getFullYear()} InterviewOS · {TOPICS.length} topics · Questions are
            AI-generated, so verify critical details before relying on them.
          </p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-strong" />
            Accounts secured by Appwrite
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooter({ variant = "full" }: { variant?: "full" | "slim" }) {
  return variant === "slim" ? <SlimFooter /> : <FullFooter />;
}
