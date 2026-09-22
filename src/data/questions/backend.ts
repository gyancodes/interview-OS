import type { Question } from "@/lib/types";

export const backendQuestions: Question[] = [
  {
    id: "backend-rest-idempotency",
    topic: "backend",
    category: "REST APIs",
    difficulty: "medium",
    question:
      "What does idempotency mean for an HTTP endpoint, and how do you make a POST that creates a payment safe to retry?",
    idealAnswer:
      "An endpoint is idempotent when repeating the same request leaves the server in the same state as doing it once — GET, PUT and DELETE are naturally idempotent, POST is not. For a payment POST you require the client to send an Idempotency-Key header, store that key with the request hash and the resulting response in the same transaction that creates the payment, and on a repeat return the stored response instead of charging again. The unique constraint on the key is what makes this correct under concurrency: two simultaneous retries collide and one reads the stored result. Keys expire after a bounded window (e.g. 24 hours).",
    explanation:
      "The subtle part is that the key must be committed atomically with the side effect. If you write the payment and then store the key in a second step, a crash in between leaves a charge with no record, so a retry charges twice; if you store the key first and the charge fails, you must mark it failed so retries can proceed. Store the response body and status, not just a flag, so the retry returns something identical and useful. Hash the request payload and reject key reuse with a different body (422) to catch client bugs. Client, load balancer and mesh retries are normal, so retry-safe design is not optional in production. Distinguish idempotency (same result) from safe methods (no side effects) and from at-most-once delivery, which is a queue-level guarantee.",
    code: `// PostgreSQL: the unique key is the concurrency control
// CREATE TABLE idempotency_keys (
//   key text PRIMARY KEY,
//   request_hash text NOT NULL,
//   status_code int,
//   response_body jsonb,
//   created_at timestamptz DEFAULT now()
// );

async function createPayment(req, res) {
  const key = req.header("Idempotency-Key");
  if (!key) return res.status(400).json({ error: { code: "MISSING_KEY" } });

  const existing = await db.findIdempotencyKey(key);
  if (existing) return res.status(existing.status_code).json(existing.response_body);

  const payment = await db.createPaymentWithKey(key, req.body); // one transaction
  return res.status(201).json({ id: payment.id, status: payment.status });
}`,
    tags: ["idempotency", "rest", "retries", "payments"],
    followUps: [
      "How would you implement this without a database transaction available?",
      "When should the stored idempotency key expire, and what happens if it is reused afterwards?",
    ],
    interviewTip:
      "Say 'the key and the side effect must be committed together' early — that is the crux. Mentioning the unique constraint plus expiry shows you have designed this, not just read about it.",
    concepts: ["idempotency keys", "atomic side effects", "retry safety"],
  },
  {
    id: "backend-auth-session-vs-jwt",
    topic: "backend",
    category: "Authentication",
    difficulty: "medium",
    question:
      "Compare server-side sessions and JWT access tokens for a web application. What are the tradeoffs, and how do you handle revocation?",
    idealAnswer:
      "Sessions store state server-side (a row or Redis entry) and the cookie holds only an opaque id, so revocation is immediate: delete the record and the next request fails. JWTs are self-contained and verifiable without a lookup, which is great for horizontal scaling and multiple services, but revocation is the tradeoff — a valid signature stays valid until it expires. The usual compromise is a short-lived access token (5–15 minutes) plus a long-lived refresh token stored server-side so it can be rotated and revoked; refresh token reuse detection then kills a stolen session. For browsers, an HttpOnly, Secure, SameSite cookie keeps credentials out of JS reach where XSS could read them.",
    explanation:
      "Sessions are simpler and give instant logout, role changes and 'log out everywhere', at the cost of a shared store and a lookup per request that you can mitigate with a per-process cache. JWTs avoid the lookup but must be verified defensively: check the algorithm explicitly (never trust the token's alg, reject 'none'), validate exp/iss/aud, and rotate signing keys through a JWKS so a key can be retired quickly. Avoid putting mutable authorization data in a long-lived token, because a role change will not take effect until expiry — a common security bug. Refresh token rotation with reuse detection is the standard control; a jti denylist or per-user token version works too but reintroduces state, just with a rarer lookup.",
    code: `// Cookie flags that matter for browsers
res.cookie("session", token, {
  httpOnly: true,   // not readable from JS (XSS)
  secure: true,     // HTTPS only
  sameSite: "lax",  // blocks cross-site POST (CSRF)
  path: "/",
  maxAge: 15 * 60 * 1000,
});

// Verify JWTs defensively
jwt.verify(token, publicKey, { algorithms: ["RS256"], issuer, audience });
// Never pass the token's own alg header into verify().`,
    tags: ["authentication", "jwt", "sessions", "cookies", "revocation"],
    followUps: [
      "How does refresh token rotation detect a stolen token?",
      "Why is SameSite=Lax insufficient on its own for a JSON API, and what else do you need for CSRF?",
    ],
    interviewTip:
      "Answer around the central tradeoff — stateful revocation vs stateless verification — and land on short access tokens plus rotatable refresh tokens. Naming the cookie flags makes it concrete.",
    concepts: ["session store", "token lifetime", "revocation", "cookie security"],
  },
  {
    id: "backend-caching-strategy",
    topic: "backend",
    category: "Caching",
    difficulty: "hard",
    question:
      "You add a Redis cache in front of a read-heavy database and start seeing stale data complaints. Walk through cache invalidation strategies and how you would pick one.",
    idealAnswer:
      "First pick a coherence model. Cache-aside (read: check cache, on miss read DB and populate; write: update DB then invalidate the key) is the default because the cache can be rebuilt from the source of truth and a lost cache entry is never wrong data, just a miss. Write-through keeps cache and DB in sync on every write but adds write latency and writes data nobody may read. TTLs bound staleness when invalidation is impractical. For the stale complaints: invalidate at the exact keys the write mutates (including list views and aggregates), use versioned keys or short TTLs for hot denormalized data, and accept eventual consistency with a bounded staleness target where the product allows. Stampede protection — single-flight per key or probabilistic early expiry — matters more than perfect invalidation at scale.",
    explanation:
      "The hard parts are not the happy path but the edge cases: a failed write after cache invalidation (fine for cache-aside — next read repopulates with committed data), thundering herd when a hot key expires (mitigate with mutex/single-flight, stale-while-revalidate, or jittered TTLs), and cascading invalidations when one entity is denormalized into many cache entries (prefer key naming that maps 1:1 to entities, or accept short TTLs for derived views). Serialization format and size matter too: store compact JSON or protobuf, cap value sizes, and keep the cache RAM-resident — swapping to disk kills the latency advantage. Monitoring: hit ratio is vanity; track origin load, p99 latency and staleness age. Eviction policy (allkeys-lru vs volatile-lru in Redis) should match which data is safe to lose.",
    code: `// Cache-aside with stampede protection
async function getUser(id: string) {
  const key = \`user:\${id}\`;
  let user = await redis.get(key);
  if (user) return JSON.parse(user);

  // single-flight: concurrent misses share one DB read
  return singleFlight(key, async () => {
    user = JSON.stringify(await db.users.findById(id));
    await redis.set(key, user, "EX", 300);       // TTL bounds staleness
    return JSON.parse(user);
  });
}

// On write: invalidate, don't update the cache
await db.users.update(id, patch);
await redis.del(\`user:\${id}\`);`,
    tags: ["caching", "redis", "invalidation", "cache stampede"],
    followUps: [
      "When would write-through beat cache-aside?",
      "How would you detect and mitigate a cache stampede in production?",
    ],
    interviewTip:
      "Structure by coherence models first (cache-aside, write-through, TTL), then spend your time on failure modes: stampedes, failed invalidations and staleness budgets. That is what separates production experience from tutorial knowledge.",
    concepts: ["cache-aside", "write-through", "TTL", "thundering herd"],
  },
  {
    id: "backend-db-indexing",
    topic: "backend",
    category: "Databases",
    difficulty: "medium",
    question:
      "A query on a 50-million-row table takes 8 seconds. How do you approach diagnosing and fixing it, and what does an index actually do?",
    idealAnswer:
      "Diagnose before changing anything: run EXPLAIN (ANALYZE) to see the plan — a Seq Scan over an index-able filter or a bad join order tells you where the time goes. An index (B-tree in Postgres/MySQL) is a sorted structure mapping key values to row locations, turning O(n) scans into O(log n) lookups plus row fetches. Fixes, in order of preference: a composite index matching the query's filter and sort (equality columns first, range last, following the leftmost-prefix rule); covering the query by including selected columns (INCLUDE) so the table is never touched; or rewriting the query — functions on indexed columns, leading wildcards and implicit casts defeat index use. Then measure again, and check write cost: every index slows inserts and updates.",
    explanation:
      "Common patterns that defeat indexes: wrapping the indexed column in a function (WHERE lower(email) = ... needs an expression index), type mismatches from ORMs, OR conditions that split into multiple index probes, and low-selectivity predicates (status = 'active') where the planner rightly prefers a scan. Composite index ordering follows the leftmost-prefix rule: an index on (a, b, c) serves a, a+b, a+b+c but not b alone. For sorting, an index matching the ORDER BY avoids a sort node. Beyond B-trees: GIN for JSONB and arrays, GiST for ranges/geospatial, BRIN for append-only time series where data order correlates with the column. Partial indexes (WHERE status = 'pending') keep hot subsets small. Measure the write amplification — each additional index adds a B-tree maintenance cost per insert/update — and drop unused indexes found via pg_stat_user_indexes.",
    code: `-- Diagnose
EXPLAIN ANALYZE SELECT * FROM orders
WHERE customer_id = 42 AND status = 'shipped'
ORDER BY created_at DESC LIMIT 20;

-- Composite index: equality first, sort column last
CREATE INDEX idx_orders_cust_status_created
  ON orders (customer_id, status, created_at DESC);

-- Covering index: index-only scan, no heap fetch
CREATE INDEX idx_orders_covering
  ON orders (customer_id) INCLUDE (total, status);

-- Defeats the index:
-- WHERE lower(email) = 'a@b.c'  -> use an expression index instead`,
    tags: ["databases", "indexes", "query planning", "postgres"],
    followUps: [
      "When would adding an index make a query slower?",
      "How does the planner decide between an index scan and a sequential scan?",
    ],
    interviewTip:
      "Say 'EXPLAIN ANALYZE first' — jumping straight to 'add an index' reads as junior. Then show you know leftmost-prefix, covering indexes, and the write-side cost of every index you add.",
    concepts: ["B-tree indexes", "query planner", "composite indexes", "write amplification"],
  },
  {
    id: "backend-rate-limiting-design",
    topic: "backend",
    category: "Rate limiting",
    difficulty: "medium",
    question:
      "How would you implement rate limiting for a public API? Compare fixed window, sliding window, and token bucket, and say where the counter lives.",
    idealAnswer:
      "Token bucket is the usual choice: requests consume tokens, tokens refill at a steady rate up to a burst capacity, so it allows short bursts while enforcing a long-term average. Fixed window is simplest but has the boundary burst problem (2x limit across a window edge); sliding window log/counter fixes that at higher memory cost. The counter must live in shared state — Redis with atomic INCR plus EXPIRE, or a sliding window via sorted sets — because app-server memory is per-instance and useless behind a load balancer. Key by authenticated identity first, IP as fallback, and return 429 with Retry-After and rate-limit headers so clients can back off properly.",
    explanation:
      "Token bucket vs sliding window: bucket smooths bursts but two clients with identical averages can see different rejection patterns; sliding window log (a sorted set of timestamps per key) gives exact enforcement but memory scales with request rate; the sliding window counter (interpolating between the current and previous fixed window) approximates the log cheaply. Redis specifics: INCR + EXPIRE has the classic race where the key is created unexercised — use SET with NX and expire in a Lua script for atomicity, or use INCR and set TTL only on the first increment. Distributed subtleties: near the limit, per-node caches (client-side pre-checks, edge/CDN-level limiting) reduce load before it reaches Redis; decide whether limits are hard (reject) or soft (queue/shed). For login/payment endpoints, rate limiting is also a security control against credential stuffing and enumeration, so pair it with exponential backoff and lockout signals.",
    code: `// Redis fixed window counter (atomic)
const key = \`rl:\${userId}:\${Math.floor(Date.now() / 60000)}\`; // 1-min bucket
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > LIMIT) {
  res.set("Retry-After", "30");
  return res.status(429).json({ error: { code: "RATE_LIMITED" } });
}

// Token bucket (pseudo)
// capacity=100, refillPerSec=10
// tokens = min(capacity, tokens + (now - last) * refill)
// request: tokens >= 1 ? tokens-- && allow : reject`,
    tags: ["rate limiting", "redis", "token bucket", "api design"],
    followUps: [
      "How do you rate limit across a cluster of API servers sharing one Redis?",
      "What would you return in headers so a well-behaved client can self-throttle?",
    ],
    interviewTip:
      "Name the three algorithms with their one-line tradeoffs, then anchor on where state lives and the 429/Retry-After contract. That structure answers the question and the follow-ups before they are asked.",
    concepts: ["token bucket", "sliding window", "distributed counters"],
  },
  {
    id: "backend-queues-why",
    topic: "backend",
    category: "Queues",
    difficulty: "medium",
    question:
      "When would you move work from a synchronous request handler into a background queue, and what new problems does a queue introduce?",
    idealAnswer:
      "Move work that the client does not need to wait for and that fails independently: emails, media processing, webhooks, heavy aggregation, third-party calls with unreliable latency. The handler validates, writes an intent to the DB, enqueues a job with the intent's ID, and returns 202 — the total latency and blast radius of the request drop. New problems: at-least-once delivery means handlers must be idempotent (a job can run twice after a worker crash); observability moves off the request path, so you need job-level metrics, retries with backoff, and a dead-letter queue for poison messages; ordering is no longer guaranteed unless you use per-key partitions; and debugging spans two systems, so the job must carry a trace/correlation ID.",
    explanation:
      "Delivery guarantees are the core mental model: queues give at-least-once (process twice) or at-most-once (lose on crash) — exactly-once requires idempotent consumers plus dedup keys, it is not something the broker hands you. Visibility timeouts / acknowledgements define when a job is redelivered: too short and a slow handler gets duplicate work, too long and a crashed worker blocks the job. Backpressure: if producers outpace consumers, the queue grows — monitor depth and oldest-message age, scale workers horizontally, and shed load (reject or degrade) rather than buffering unboundedly. Transactional outbox is the pattern for the 'write to DB then enqueue' race: write the job record in the same transaction, relay it to the broker asynchronously, so a crash between DB write and enqueue cannot lose work. Common jobs-stack choices: BullMQ/Redis for moderate scale, SQS/Kafka for heavier or higher-durability needs.",
    code: `// Transactional outbox: DB write and job intent commit together
await db.transaction(async (tx) => {
  await tx.orders.insert(order);
  await tx.outbox.insert({
    topic: "order.created",
    payload: { orderId: order.id },
    status: "pending",
  });
});
// A relay process reads outbox -> publishes to broker -> marks sent

// Idempotent consumer
await withJobLock(job.id, async () => {
  if (await tx.processedJobs.exists(job.id)) return; // dedup
  await processOrder(job.payload.orderId);
  await tx.processedJobs.insert({ id: job.id });
});`,
    tags: ["queues", "async processing", "idempotency", "outbox"],
    followUps: [
      "How does a transactional outbox prevent lost jobs?",
      "What metrics tell you a queue is falling behind before users notice?",
    ],
    interviewTip:
      "Lead with the decision rule ('does the client need to wait?') then show you know the costs: redelivery, ordering, observability. Mentioning the outbox pattern is the detail that reads as real experience.",
    concepts: ["at-least-once delivery", "idempotent consumers", "transactional outbox", "backpressure"],
  },
  {
    id: "backend-observability-incident",
    topic: "backend",
    category: "Observability",
    difficulty: "hard",
    question:
      "Users report intermittent slowness but your dashboards look fine. How do you instrument and investigate a service where p50 is great and p99 is terrible?",
    idealAnswer:
      "First instrument to see it: structured logs with request/trace IDs, RED metrics (rate, errors, duration) per endpoint with histogram buckets wide enough to expose the tail, and distributed tracing that attributes p99 latency to the slow dependency. Tail latency almost always comes from a few identifiable causes: a dependency with variable latency (DB connection pool exhaustion, GC pauses, a downstream with cold caches), retry storms amplifying the tail, or queueing behind a saturated resource. Investigate by comparing a slow trace with a fast one side by side, check pool sizes and saturation metrics at the same timestamps, and correlate deploys. Fixing follows the diagnosis: cap and pool resources, add timeouts and budgeted retries so one slow dependency cannot consume a whole request, and shed or degrade gracefully rather than queueing without bound.",
    explanation:
      "Averages hide the users you lose: latency histograms, percentiles computed per endpoint (and per tenant/route, not fleet-wide), and heatmaps reveal bimodality that p50 flattens. The mechanistic suspects: connection pool exhaustion shows up as requests queuing before the DB — look at pool wait time, not just DB latency; GC pauses correlate with allocation spikes and heap size; retry storms mean one slow dependency multiplies load (retries on the same dependency should be budgeted, e.g. Hedged requests or a retry budget of 10%); head-of-line blocking in HTTP/1.1 or a single-threaded event loop blocked by CPU work; and cold caches after deploys. Structured practice: define an SLO on p99, then error budgets decide how much to invest. Logs need sampling strategies that keep slow/error requests (tail-biased sampling) — sampling everything uniformly hides exactly the traces you need. Alert on symptoms users feel (p99 latency, error rate), not causes (CPU), to avoid noisy dashboards that train you to ignore them.",
    code: `// Structured request logging with correlation
app.use((req, res, next) => {
  const traceId = req.header("x-trace-id") ?? crypto.randomUUID();
  const start = performance.now();
  res.on("finish", () => {
    logger.info("request", {
      traceId, route: req.route?.path, status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
    });
  });
  next();
});

// Histogram buckets wide enough to see the tail
// buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]`,
    tags: ["observability", "latency", "tracing", "slo"],
    followUps: [
      "Why can retry storms make an outage worse, and how do retry budgets help?",
      "How would you sample traces so slow requests are kept but cost stays sane?",
    ],
    interviewTip:
      "Diagnose like an engineer: what instrument first, what are the top three tail-latency causes, how do you confirm which one. Naming pool exhaustion, GC and retry storms shows real production scars.",
    concepts: ["percentiles", "distributed tracing", "connection pools", "retry storms"],
  },
  {
    id: "backend-scaling-vertical-horizontal",
    topic: "backend",
    category: "Scaling",
    difficulty: "medium",
    question:
      "Your API server is hitting CPU limits. Walk through the decision process: scale up, scale out, or optimize code? What makes a service horizontally scalable?",
    idealAnswer:
      "First profile: is it actually compute, or lock contention, GC, or an external dependency? Optimization wins if there is an algorithmic problem (N+1 queries, O(n²) over a growing set) — scaling multiplies the cost of bad code. If the load is genuinely growing, scale out is the long-term answer, and a service is horizontally scalable when it is stateless: session/state in Redis or a database, no local file writes, sticky-session-free load balancing, and idempotent handlers so retries are safe. Scale up (bigger box) is a legitimate short-term move — it needs no code changes — but it is linear at best, has a hard ceiling, and is a single point of failure. The maturity ladder: optimize the hot path, make the service stateless, add replicas behind a load balancer, then shard the bottleneck data store if needed.",
    explanation:
      "The stateless property is what makes horizontal scaling cheap: any instance can serve any request, so the load balancer just rounds-robin and failures are handled by draining. Anything local — in-process caches, sessions, uploaded files — becomes a correctness problem (cache incoherence) or a reliability one (instance loss). In-process caching should move to a shared cache (Redis) or be accepted as eventually-consistent per-instance caching. Database is usually the next bottleneck after the app tier, so plan for read replicas, then functional partitioning, then sharding — each step is a project, not a config change. Autoscaling needs fast startup and correct health/readiness checks; slow-start instances behind a balancer cause thundering herds. Cost framing: vertical scaling cost grows superlinearly with instance size while horizontal grows linearly but adds operational complexity (service discovery, consistent deploys, more failure modes to handle gracefully).",
    code: `# What breaks horizontal scaling (per-instance state)
# BAD:  const cache = new Map()            # in-memory cache
# BAD:  req.session.userId = user.id      # local session store
# BAD:  fs.writeFileSync(\`/tmp/\${file}\`) # local disk

# GOOD: shared cache, external sessions, object storage
await redis.set(\"session:abc\", JSON.stringify(session));
await s3.putObject(bucket, key, stream);

# Health check for load balancer readiness
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: process.env.GIT_SHA });
});`,
    tags: ["scaling", "statelessness", "load balancing", "autoscaling"],
    followUps: [
      "How does autoscaling interact with slow-start instances and health checks?",
      "Where does the database usually become the bottleneck, and what are the next steps?",
    ],
    interviewTip:
      "Show the decision tree (profile → optimize → stateless → scale out → shard) rather than a one-word answer. The phrase 'scaling multiplies the cost of bad code' is a strong opener.",
    concepts: ["horizontal scaling", "statelessness", "load balancing", "sharding"],
  },
  {
    id: "backend-security-owasp-top",
    topic: "backend",
    category: "Security",
    difficulty: "medium",
    question:
      "What are the most common API security mistakes you actually see in production, and what defenses do you build in by default?",
    idealAnswer:
      "The recurring ones: broken authorization (IDOR — reading /orders/123 of another tenant because the handler trusts the ID from the path), injection via string-concatenated SQL, secrets in logs or client bundles, missing rate limits on auth endpoints, overly permissive CORS reflecting any origin with credentials, and trusting client-side validation only. Default defenses: parameterized queries always; authorization enforced server-side per resource (object-level checks, not just role checks at the route); validation with a schema library at the boundary; helmet-style security headers; HttpOnly Secure SameSite cookies; secrets from the environment with log scrubbing; and rate limiting plus lockout on credential endpoints. Assume every client-supplied value is hostile, including headers, and log enough to investigate without logging sensitive data.",
    explanation:
      "Broken access control is consistently the top real-world category because route-level middleware checks roles but object-level checks (does this user own this order?) get forgotten per-handler. SQL injection is solved by parameterized queries and ORMs — but raw query builders and dynamic ORDER BY/column names still leak in, so whitelist identifiers. CORS: the dangerous mistake is Access-Control-Allow-Origin: * combined with credentials: true (browsers reject it, but hand-rolled middleware sometimes echoes the origin instead — same effect, allowed), so allow-list origins explicitly. SSRF from user-supplied URLs deserves a mention: fetch only allow-listed hosts, block link-local addresses. Security headers: CSP (even a basic one), HSTS, X-Content-Type-Options. Dependency risk is real too: lockfiles, audit, and a process for patching. The principle that ties it together: defense in depth — no single control is trusted, so a mistake in one layer stays contained.",
    code: `// IDOR: object-level authorization per request
app.get("/orders/:id", requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order || order.userId !== req.user.id) {
    // same response for missing and forbidden: no enumeration
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }
  res.json(order);
});

// Parameterized query (never string concatenation)
await db.query("SELECT * FROM users WHERE email = $1", [email]);`,
    tags: ["security", "owasp", "idor", "injection"],
    followUps: [
      "How does object-level authorization differ from role-based route guards?",
      "Why is reflecting an arbitrary Origin header with credentials a CORS vulnerability?",
    ],
    interviewTip:
      "Pick three concrete mistakes (IDOR, injection, CORS/credentials) and describe the defense for each. Specificity about real failure modes signals production security experience more than reciting the OWASP list.",
    concepts: ["IDOR", "injection", "CORS", "defense in depth"],
  },
  {
    id: "backend-load-balancing-layer",
    topic: "backend",
    category: "Load balancing",
    difficulty: "medium",
    question:
      "How does a load balancer decide where to send a request? Compare layer 4 vs layer 7 balancing and common algorithms like round robin, least connections, and consistent hashing.",
    idealAnswer:
      "Layer 4 balances on IP/port — it routes TCP connections without inspecting content: fast, protocol-agnostic, but it cannot route by path or do content-aware health checks. Layer 7 (HTTP) understands requests: path-based routing (/api vs /assets), header/cookie-based routing, TLS termination, compression, and smart health checks against real endpoints. Algorithms: round robin assumes equal-capacity equal-cost backends and drifts when requests vary in cost; least connections adapts to heterogeneous request durations; weighted variants handle uneven instance sizes; consistent hashing maps the same key (user, tenant, session) to the same backend so caches and long-lived sessions stay warm while tolerating backend churn — the key property versus naive modulo hashing, which remaps everything when the pool changes.",
    explanation:
      "Health checks are what make a balancer more than a router: active checks probe an endpoint while passive checks count failures and eject instances; readiness versus liveness matters (a live-but-overloaded instance should receive less traffic, not zero). Sticky sessions via cookies are sometimes needed for legacy stateful apps, but they break even distribution and complicate failover — the better fix is externalizing state. Queueing: least connections approximates least-work-next, which is optimal when request cost varies; power-of-two-choices is a lightweight middle ground at high scale. Modern additions: outlier ejection (circuit-breaking a backend returning 5xx), retries must be bounded and idempotency-aware at the balancer too, and connection draining prevents in-flight requests from being killed during deploys. Where it runs: DNS (coarse, slow to change), cloud LBs (managed, L4 or L7), service mesh sidecars (per-request, in-process policy), or a reverse proxy like NGINX/Envoy.",
    code: `# NGINX: layer 7 with least_conn and health-aware routing
upstream api {
  least_conn;
  server api1:3000 max_fails=3 fail_timeout=10s;
  server api2:3000 max_fails=3 fail_timeout=10s;
  keepalive 32;
}
server {
  location /api/ {
    proxy_pass http://api;
    proxy_next_upstream error timeout;   # retry next backend
  }
  location /assets/ { proxy_pass http://cdn; }
}`,
    tags: ["load balancing", "l4", "l7", "consistent hashing"],
    followUps: [
      "When is consistent hashing worth the complexity over least-connections?",
      "How should a load balancer behave during a rolling deploy?",
    ],
    interviewTip:
      "Lead with L4 vs L7 in one sentence each, then connect algorithms to their assumption failures (round robin assumes uniform cost). Consistent hashing plus cache affinity is the detail that elevates the answer.",
    concepts: ["L4/L7", "round robin", "least connections", "consistent hashing"],
  },
];
