import { APPWRITE_SETUP_HINT } from "@/lib/appwrite/config";

/**
 * Shown on the auth pages when the Appwrite environment variables are missing,
 * so a fresh clone gives setup instructions instead of a crashed page.
 */
export function AppwriteSetupNotice({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-partial/30 bg-partial-soft/60 p-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="font-mono text-sm font-bold text-partial">
          !
        </span>
        <h2 className="text-sm font-semibold text-fg">Appwrite is not connected yet</h2>
      </div>

      <p className="text-xs leading-relaxed text-fg-muted">{APPWRITE_SETUP_HINT}</p>

      <ol className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
        <li>
          <span className="font-mono text-[11px] text-fg">1.</span> Create a project in the
          Appwrite console and add <span className="font-mono text-[11px]">localhost</span> as a
          Web platform.
        </li>
        <li>
          <span className="font-mono text-[11px] text-fg">2.</span> Create an API key with the{" "}
          <span className="font-mono text-[11px]">users.write</span> and{" "}
          <span className="font-mono text-[11px]">sessions.write</span> scopes.
        </li>
        <li>
          <span className="font-mono text-[11px] text-fg">3.</span> Paste the values into{" "}
          <span className="font-mono text-[11px]">.env.local</span> and restart{" "}
          <span className="font-mono text-[11px]">npm run dev</span>.
        </li>
      </ol>

      <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[10px] leading-relaxed text-fg-muted">
        {`NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key`}
      </pre>
    </div>
  );
}
