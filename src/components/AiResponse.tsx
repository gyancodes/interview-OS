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
    <section className="rounded-lg border border-border bg-surface p-5" aria-busy={loading}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
        <span aria-hidden className="text-accent">✦</span>
        {title}
      </h3>

      {loading ? <LoadingState label="Thinking…" /> : null}

      {!loading && error ? <ErrorNote message={error} retry={onRetry} /> : null}

      {!loading && !error && content ? (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{content}</p>

          {code ? <CodeBlock code={code} /> : null}

          {keyPoints && keyPoints.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {keyPoints.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-muted">
                  <span aria-hidden className="text-accent">•</span>
                  {point}
                </li>
              ))}
            </ul>
          ) : null}

          {footer}
        </div>
      ) : null}
    </section>
  );
}
