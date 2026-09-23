"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { ErrorNote, LoadingState } from "@/components/ui";

export function AiResponse({
  title,
  loading,
  error,
  onRetry,
  content,
  code,
  keyPoints,
  footer,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  content?: string;
  code?: string;
  keyPoints?: string[];
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-2xs" aria-busy={loading}>
      <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-fg">
        <span aria-hidden className="text-accent">✦</span>
        {title}
      </h3>

      {loading ? (
        <div className="py-4">
          <LoadingState label="AI is generating comprehensive explanation…" />
        </div>
      ) : null}

      {!loading && error ? <ErrorNote message={error} retry={onRetry} /> : null}

      {!loading && !error && content ? (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{content}</p>

          {code ? <CodeBlock code={code} /> : null}

          {keyPoints && keyPoints.length > 0 ? (
            <div className="rounded-lg border border-border-subtle bg-surface-2/60 p-3.5">
              <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Key Takeaways
              </h4>
              <ul className="flex flex-col gap-1.5">
                {keyPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-xs leading-relaxed text-muted">
                    <span aria-hidden className="text-accent font-bold">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {footer}
        </div>
      ) : null}
    </section>
  );
}
