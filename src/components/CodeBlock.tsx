export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="overflow-hidden rounded-md border border-border bg-canvas">
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
      {caption ? (
        <figcaption className="border-t border-border px-4 py-2 text-xs text-faint">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
