import type { Question } from "@/lib/types";

export const fullstackQuestions: Question[] = [
  {
    id: "fullstack-api-boundary",
    topic: "fullstack",
    category: "API Design",
    difficulty: "medium",
    question:
      "You are building a paginated, filterable list with inline editing. How do you design the API boundary so the frontend stays simple and the backend stays efficient?",
    idealAnswer:
      "Define one contract for the collection: cursor pagination (cursor + limit, returning nextCursor) rather than offset, explicit filter parameters validated on the server, and a stable sort order. Return a response envelope with data plus metadata (nextCursor, applied filters, total only when it is cheap) so the client never reconstructs state from guesses. For inline edits use resource-level endpoints (PATCH /items/:id) that return the updated resource, and let the client update optimistically with rollback on failure. Keep the shape consistent across list and detail responses so one cache key and one type serve both, and extend the envelope instead of inventing per-screen endpoints.",
    explanation:
      "Cursor pagination is the key performance decision: offset pagination makes the database scan and discard rows, so deep pages get slow and rows shift when data changes, causing duplicates or skips while scrolling. A keyset cursor on (created_at, id) is stable and index-friendly. The API shape decides how much client code exists: returning ready-to-render fields and server-computed permissions avoids duplicating business rules, while leaking database column names makes refactors expensive. Optimistic updates need an identity strategy — return the created or updated resource so the client can reconcile a temporary id, and make mutations idempotent enough that a retry after a timeout does not double-apply. Agree on an error envelope (code, message, field errors) up front, because retrofitting it across a UI later is one of the costliest changes you can make.",
    code: `// GET /api/items?status=active&sort=-created_at&cursor=eyJpZCI6MTIzfQ&limit=25
{
  "data": [{ "id": "it_123", "name": "Widget", "canEdit": true }],
  "meta": { "nextCursor": "eyJpZCI6OTk4fQ", "limit": 25, "appliedFilters": { "status": "active" } }
}

// PATCH /api/items/it_123  { "name": "New name" }
// -> 200 with the updated resource, so the client can reconcile its optimistic copy

// Error envelope shared by every endpoint
// { "error": { "code": "VALIDATION_FAILED", "message": "...", "fields": { "name": "too long" } } }`,
    tags: ["api design", "pagination", "optimistic updates", "contract"],
    followUps: [
      "When is offset pagination actually the better choice?",
      "How do you reconcile a temporary client id after an optimistic create?",
    ],
    interviewTip:
      "Answer in terms of the contract's consequences: what the client can do without extra endpoints and what the database does per request. That connects both halves of full-stack work.",
    concepts: ["cursor pagination", "response envelope", "optimistic UI"],
  },
  {
    id: "fullstack-auth-flow",
    topic: "fullstack",
    category: "Authentication",
    difficulty: "medium",
    question:
      "Walk through authentication in a full-stack application end to end: login, protecting routes, expiry, and keeping multiple tabs consistent.",
    idealAnswer:
      "Login posts credentials over HTTPS; the server verifies the hash (argon2/bcrypt with a per-user salt), creates a session record or token pair, and sets an HttpOnly, Secure, SameSite cookie. Protected pages check the session on the server before rendering, and protected API routes check it again — the client-side check is a UX shortcut, never the security boundary. Expiry is handled by a short access token lifetime plus a refresh endpoint the client calls on 401, with the refresh token rotated and revocable server-side. Tabs stay consistent by broadcasting an auth event over BroadcastChannel: one tab refreshes or logs out and the others update in-memory state instead of polling.",
    explanation:
      "Two boundaries worth being precise about: authorization must be enforced server-side on every request (a hidden button is not access control), and cookies should not be readable by JavaScript when XSS matters — HttpOnly removes that path, SameSite blocks most CSRF, and a CSRF token or origin check covers the rest. Refresh-on-401 needs concurrency care: ten parallel requests hitting an expired token must not trigger ten refreshes, so the client single-flights the refresh and queues the rest. Because the server owns the session or refresh record, logout, password change and 'sign out everywhere' are just deletions. Nothing sensitive should be trusted from a cookie the client could replay after revocation.",
    code: `// Client: single-flight refresh so parallel 401s cause one refresh
let refreshInFlight: Promise<void> | null = null;

async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, { ...init, credentials: "same-origin" });
  if (response.status !== 401) return response;

  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((r) => { if (!r.ok) throw new Error("Session expired"); })
    .finally(() => { refreshInFlight = null; });

  await refreshInFlight;
  return fetch(input, { ...init, credentials: "same-origin" });
}`,
    tags: ["auth", "cookies", "refresh tokens", "server-side checks"],
    followUps: [
      "How do you prevent ten parallel requests from triggering ten token refreshes?",
      "Why is a client-side route guard not a security control?",
    ],
    interviewTip:
      "Structure it as login, storage, enforcement, expiry, sync. Interviewers listen for 'enforce on the server' and for the multi-tab consistency detail, which most candidates miss.",
    concepts: ["session enforcement", "token refresh", "cross-tab state"],
  },
  {
    id: "fullstack-data-modeling",
    topic: "fullstack",
    category: "Data Modeling",
    difficulty: "hard",
    question:
      "You are adding a 'collaborators' feature to a project-management app: users can share projects with roles. How do you model the data, and how does the choice affect queries and permissions?",
    idealAnswer:
      "Model the relationship explicitly: a join table project_members(project_id, user_id, role, added_at) with a composite primary key — it stores the role on the edge and keeps users and projects untouched. Queries: 'projects for user' is an index on user_id; 'members of project' is an index on project_id; both are cheap. Permissions become data-driven: every access check is a single join (does a row with user_id, project_id and role in ('editor','admin') exist?), enforceable in one shared authorization function. Avoid the tempting alternatives: storing an owner_id plus an array of collaborators on the project row cannot index membership lookups or express roles per member; duplicating membership into both rows creates update-anomaly bugs. When the access rules grow (groups, inheritance), the pattern extends: membership rows gain a source (direct, group, link) rather than a redesign.",
    explanation:
      "The modeling questions to settle up front: can roles differ per project (yes — so role lives on the join row, not the user), do members need per-project settings (metadata on the join row), and how will permissions be queried (always through the join table, so index both directions). Access checks then compose: project read = member with any role; project edit = member with editor+; transfer = admin. Centralizing that as one function or a policy layer stops the classic drift where each endpoint re-implements permissions slightly differently. At scale, the join table grows with sharing behavior, so watch its indexes (both directions, covering the role for authorization-only lookups) and think about denormalized counters only when product needs them. Soft delete matters here too: revoking access is deleting or role-dating the membership row, so audit columns (added_by, revoked_at) keep an audit trail without a separate table.",
    code: `CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('viewer','editor','admin')),
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX idx_members_user ON project_members (user_id, role);

-- The one authorization query every endpoint shares
SELECT EXISTS (
  SELECT 1 FROM project_members
  WHERE project_id = $1 AND user_id = $2
    AND role IN ('editor','admin')
) AS can_edit;`,
    tags: ["data modeling", "join tables", "authorization", "postgres"],
    followUps: [
      "How would you enforce project access at the query layer instead of per-endpoint?",
      "When would you denormalize membership counts onto the project row?",
    ],
    interviewTip:
      "Draw the join table, then show how one EXISTS query becomes the authorization primitive. Connecting schema design to permission enforcement is exactly the full-stack thinking this question probes.",
    concepts: ["join table", "composite keys", "row-level authorization", "indexing both directions"],
  },
  {
    id: "fullstack-deploy-environment",
    topic: "fullstack",
    category: "Deployment",
    difficulty: "medium",
    question:
      "Your app works locally but breaks in production. Walk through the deployment concerns you check first: environments, secrets, migrations, and build-vs-runtime differences.",
    idealAnswer:
      "Check in order: environment parity (Node version, env vars present in the runtime, not just .env locally), secrets reaching the server process (a missing GROQ_API_KEY or DATABASE_URL fails at first use, not deploy), database migrations running before the new code serves traffic (and being backward compatible so the old version still works during the rollout), and build-time versus runtime execution — code that reads env vars at build time freezes the value into the bundle, and client bundles must never contain server secrets since NEXT_PUBLIC_ vars are inlined into shipped JavaScript. Then the operational basics: logs visible, health check wired, and the error actually reproduced with production data.",
    explanation:
      "Most 'works locally' bugs are one of four: a missing/misnamed env var that fails lazily; a migration that ran against a different database or not at all; a build/runtime split (a page statically rendered at build baked in empty env-dependent data); or a client/server leak (a server-only library imported into a client component, or a secret printed into the bundle). Safe practice: fail fast at boot — validate all required env vars on startup so a misconfiguration crashes loudly instead of at 3am on first use; run migrations in CI/CD as a separate gated step with backward-compatible changes (expand, migrate, contract) so rollbacks do not require undoing a destructive column drop; and keep one build artifact promoted through environments rather than rebuilding per environment, so what you tested is what ships. Distinguish config values known at build time (feature flags compiled in) from runtime config (connection strings), and confirm where each framework boundary reads them.",
    code: `// Fail fast: validate env at boot, not on first request
const env = z.object({
  DATABASE_URL: z.string().url(),
  GROQ_API_KEY: z.string().min(1),
}).parse(process.env); // process exits loudly if misconfigured

// Migration discipline: expand -> migrate -> contract
-- 1. expand: add new column, nullable
ALTER TABLE orders ADD COLUMN total_cents BIGINT;
-- 2. migrate: backfill in batches (old code still runs)
-- 3. contract: only after new code is fully deployed
--    ALTER TABLE orders ALTER COLUMN total_cents SET NOT NULL;
--    ALTER TABLE orders DROP COLUMN total;`,
    tags: ["deployment", "env vars", "migrations", "secrets"],
    followUps: [
      "Why must migrations be backward compatible during a rolling deploy?",
      "How would you detect a secret accidentally shipped in the client bundle?",
    ],
    interviewTip:
      "Give a checklist order — env, secrets, migrations, build/runtime — and include one war story detail like build-time env freezing. Structured debugging under uncertainty is the skill being tested.",
    concepts: ["environment parity", "expand-contract migrations", "build vs runtime", "secret management"],
  },
  {
    id: "fullstack-debugging-prod-issue",
    topic: "fullstack",
    category: "Debugging",
    difficulty: "hard",
    question:
      "Users report failed checkouts but you cannot reproduce locally. Describe your end-to-end debugging approach across frontend, API, and database.",
    idealAnswer:
      "Start by bounding the blast radius and finding a signal: which users, which step, since when (deploy correlation?), what does the error rate look like per endpoint. Pull the failing traces/logs server-side by request id — the API logs will usually place the failure in one layer: a 4xx from validation (client sends something unexpected), a 5xx or timeout on a downstream (payment provider, DB), or a DB error (constraint violation, lock timeout). Check the data: is there a cohort pattern — users with legacy accounts, a specific currency, an edge-case payload — that local test data lacks? Reproduce with production-shaped data (staging with a DB copy, or a recorded request), fix, and add the missing observability that would have caught this sooner: structured logs at the checkout steps, an alert on checkout failure rate, and a synthetic checkout canary.",
    explanation:
      "The discipline is tracing one real failed request end to end before theorizing: frontend error telemetry (which button, what payload), the API request id, the exact DB statement and error. Cohort slicing finds what repro scripts miss — the bug is usually 'data we did not imagine', like a user with two payment methods, a locale-specific decimal, or a race between two tabs submitting the same cart. Common checkout-specific culprits worth checking early: payment webhook arriving before the response completes (order not yet in DB), idempotency keys reused incorrectly on retry, clock/timestamp assumptions, and lock contention on inventory rows making the DB slow only under real concurrency — invisible locally. Guard against the meta-failure: if you could not diagnose this in under an hour, the fix is observability, not just the bug — request ids propagated across every layer, step-level logs, and alerts on business metrics (checkout conversion) not just infra metrics (CPU).",
    code: `// Correlate one checkout across all layers
// Frontend: capture and send a request id
const requestId = crypto.randomUUID();
logger.info("checkout.submit", { requestId, cartId, step: "payment" });
await api.post("/checkout", payload, { headers: { "x-request-id": requestId } });

// API: structured step logs with the same id
logger.info("checkout.start", { requestId, userId, amount });
logger.error("checkout.payment_failed", { requestId, providerError: err.code });

// DB: find what the failing statement actually did
SELECT * FROM pg_stat_activity WHERE query ILIKE '%checkout%';
// plus: alert on business metric, not just 5xx rate
// alert: checkout_success_rate < 0.97 for 5m`,
    tags: ["debugging", "observability", "production", "request tracing"],
    followUps: [
      "What would you have instrumented before this incident to cut diagnosis time?",
      "How do you decide between hotfixing forward and rolling back?",
    ],
    interviewTip:
      "Narrate an ordered investigation — bound the problem, find one failed trace, slice cohorts, reproduce with real-shaped data. End on the observability you would add; interviewers want the system-level fix, not just the bug fix.",
    concepts: ["request tracing", "cohort analysis", "business metrics", "synthetic monitoring"],
  },
];
