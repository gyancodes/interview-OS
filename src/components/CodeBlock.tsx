export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-fg/10 bg-[color:var(--color-code-bg)]">
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-[color:var(--color-code-fg)]">
        <code>{code}</code>
      </pre>
      {caption ? (
        <figcaption className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
