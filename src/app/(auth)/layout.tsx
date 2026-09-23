import Link from "next/link";

/**
 * Auth area frame: a split card with the product highlights on the left and the
 * form on the right. Deliberately chrome-free so nothing competes with signing
 * in.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-fg text-canvas shadow-xs">
            <span className="font-mono text-xs font-bold tracking-tighter">OS</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-fg">
            Interview<span className="font-bold text-accent">OS</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-muted transition-colors hover:text-fg"
        >
          <span aria-hidden>←</span> Back to home
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-2 sm:px-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-soft lg:grid-cols-[1.02fr_1fr]">
          <aside className="bg-hero-mesh relative hidden flex-col justify-between gap-10 border-r border-border bg-canvas-subtle/50 p-9 lg:flex">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
                InterviewOS account
              </span>

              <h2 className="max-w-sm text-balance text-2xl font-bold leading-tight tracking-tight text-fg">
                One workspace for every step of interview prep.
              </h2>

              <ul className="flex flex-col gap-3">
                {[
                  "Live AI-generated questions — no static bank",
                  "Scored answers with strengths and missing concepts",
                  "Weak-area detection and readiness tracking",
                  "Timed mock interviews with a written verdict",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <svg
                        aria-hidden
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="gradient-border rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
                Progress stays yours
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Your attempts, saved questions and mock interview history are stored locally in this
                browser and namespaced to your account.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
