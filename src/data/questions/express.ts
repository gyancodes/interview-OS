import type { Question } from "@/lib/types";

export const expressQuestions: Question[] = [
  {
    id: "express-middleware-order",
    topic: "express",
    category: "Middleware",
    difficulty: "medium",
    question:
      "Explain how Express middleware ordering works. What happens if middleware never calls next(), and why must error handlers have four parameters?",
    idealAnswer:
      "Express keeps an ordered stack per route and per app. Each middleware receives (req, res, next) and must either end the response or call next() to pass control to the next layer in registration order. If it does neither the request hangs until a timeout, because nothing else will ever run. Calling next(err) skips all remaining non-error middleware and jumps to the nearest error handler, which is identified by arity: function (err, req, res, next) with exactly four parameters. That arity check is why an error handler that forgets the unused `next` parameter silently stops working and the request 404s or hangs.",
    explanation:
      "Ordering is the whole configuration model, which is also its sharpest edge: body parsers must be registered before handlers that read req.body; auth middleware must run before the routes it protects; a catch-all 404 route placed too early swallows everything. Middleware supports path mounting, so app.use('/api/users', router) strips the prefix and router-relative paths apply inside — that is how you scope middleware per resource. Error handlers must be registered last, after all routes, and in async-first codebases you usually need a small forwarding wrapper (or Express 5, which forwards rejected promises automatically) because a thrown error inside an async handler is a rejected promise that Express 4 never sees.",
    code: `app.use(express.json());            // 1. parse body
app.use(requestLogger);             // 2. log
app.use("/api", authMiddleware);    // 3. protect API

app.get("/api/items", listItems);   // 4. routes

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// 5. arity of 4 marks this as the error handler
app.use((err, req, res, next) => {
  logger.error({ err });
  res.status(err.status ?? 500).json({ error: "Internal error" });
});

// Express 4: async errors need forwarding
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);`,
    tags: ["middleware", "next", "error handling", "order"],
    followUps: [
      "How do you apply middleware to a single route instead of the whole app?",
      "What changes about async error propagation in Express 5?",
    ],
    interviewTip:
      "Say 'ordering is the configuration' and then describe the request flowing down the stack. Mentioning the arity-4 rule proves you have debugged a real Express app.",
    concepts: ["middleware stack", "next()", "error propagation"],
  },
  {
    id: "express-error-handling",
    topic: "express",
    category: "Error Handling",
    difficulty: "medium",
    question:
      "How should a production Express API distinguish and report operational errors, client errors and programmer errors?",
    idealAnswer:
      "Classify errors at the source: client errors (validation, bad auth) carry 4xx status, operational failures (downstream timeout, DB unavailable) are 5xx but expected, and programmer errors (bad query, undefined value) are bugs that should be reported to monitoring rather than hidden. Throw or forward an error object with an explicit status and a stable machine code (code: 'INSUFFICIENT_FUNDS'), never a free-text message the client must parse. The central error handler logs full detail server-side with a request id, returns a generic message plus that id to the client, and never leaks stack traces or SQL. Async handlers must forward rejections to next(err) so there is a single response path.",
    explanation:
      "The value of a typed error is that status mapping, logging and client messages stop being decided in twenty places. A common pattern is `class AppError extends Error { status: number; code: string; expose: boolean }`, where expose decides whether the message is safe for clients. Log structured (`logger.error({ err, requestId, route })`) so you can alert on 5xx rate instead of grepping text; 4xx are usually warn level or not logged, to keep signal high. Distinguish expected from unexpected: retryable downstream failures may deserve retries with jitter, while a TypeError should page someone. Never swallow errors with an empty catch, and route malformed JSON bodies thrown by body parsers through the same handler so clients always get a consistent JSON envelope.",
    code: `class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL", expose = false } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  if (status >= 500) logger.error({ err, requestId: req.id });
  res.status(status).json({
    error: {
      code: err.code ?? "INTERNAL",
      message: err.expose ? err.message : "Something went wrong",
      requestId: req.id,
    },
  });
});`,
    tags: ["error handling", "api design", "observability"],
    followUps: [
      "How do you retry downstream failures without amplifying an outage?",
      "What belongs in a client-facing error response and what must stay server-side?",
    ],
    interviewTip:
      "Structure the answer as classification, then mapping, then logging. Interviewers listen for the operational-vs-programmer distinction and for not leaking internals.",
    concepts: ["error taxonomy", "central handler", "safe error responses"],
  },
  {
    id: "express-routing-params",
    topic: "express",
    category: "Routing",
    difficulty: "easy",
    question:
      "How do route parameters, query strings and nested routers work in Express, and how do you avoid route-ordering bugs?",
    idealAnswer:
      "Route parameters (req.params from /users/:id) capture path segments and are decoded; query strings arrive parsed on req.query; nested routers are mounted with app.use('/users', usersRouter), which strips the prefix for the sub-router. Matching is in registration order and the first match wins, so specific routes must be registered before parametrized ones — '/users/me' before '/users/:id' or 'me' lands in the id handler. app.route chains GET/POST on one path, and express.Router({ mergeParams: true }) lets a nested router read its parent's params, which you need for /users/:userId/orders handlers.",
    explanation:
      "req.params values are always strings, so numeric comparisons need explicit coercion and a validation step (is it a real id?) — a param-based 404 is usually better than a cast error. req.query values can be strings, arrays (repeated keys) or objects (bracket syntax), so treat them as unvalidated input. Route-ordering bugs are the classic Express incident: a catch-all app.get('*') or a misplaced 404 handler swallows everything after it, and a middleware mounted before the JSON parser leaves req.body undefined. For large apps, one Router per resource with prefix mounting keeps middleware scoping explicit, and Router-level error handling differs subtly: errors inside a mounted router need the router's own error handler or a next() that bubbles to the app-level one.",
    code: `const users = express.Router();
users.get("/me", (req, res) => res.json(req.user));       // specific first
users.get("/:id", async (req, res) => {
  const id = req.params.id;         // string — validate before use
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(404).end();
  res.json(await findUser(id));
});
app.use("/users", users);

// Nested router reading parent params
const orders = express.Router({ mergeParams: true });
orders.get("/", (req, res) => res.json(req.params.userId));
users.use("/:userId/orders", orders);`,
    tags: ["routing", "params", "routers", "ordering"],
    followUps: [
      "What does mergeParams do and when do you need it?",
      "How would you version an API without duplicating middleware?",
    ],
    interviewTip:
      "Demonstrate the ordering pitfall with '/users/me' vs '/users/:id' — it is a real bug everyone has hit, and it shows you think in terms of the request matching engine rather than route syntax.",
    concepts: ["route matching", "router mounting", "mergeParams"],
  },
  {
    id: "express-body-parsing-validation",
    topic: "express",
    category: "Validation",
    difficulty: "medium",
    question:
      "Why is trusting req.body dangerous, and where should validation live in an Express app? What can go wrong with JSON body parsing in production?",
    idealAnswer:
      "req.body is unvalidated user input: types are whatever the client sent, fields can be missing or extra, and a malicious payload can exploit downstream code (prototype pollution via __proto__, mass assignment writing role: 'admin' into a model). Validation belongs at the boundary — a schema library (zod, joi, express-validator) run per route or as middleware — and only validated, explicitly picked fields should flow into business logic and the database. Production JSON issues: body size limits (DoS via a huge payload — express.json has a default limit but verify it), malformed JSON throwing before your handler, content-type mismatches leaving req.body undefined, and the prototype-pollution class of bugs that require rejecting __proto__/constructor keys.",
    explanation:
      "Schema validation at the edge gives you three things at once: safety (shape and type guarantees), documentation (the schema is the contract), and error quality (a 400 with field-level messages instead of a 500 deep in the stack). Pick fields explicitly into a typed object rather than spreading — that kills mass-assignment attacks where extra fields sneak into ORM updates. Prototype pollution: JSON.parse can produce {\"__proto__\": {...}} objects; merging them into plain objects can corrupt prototypes app-wide, so reject those keys or use a null-prototype parse. Body parser failures (malformed JSON) throw from middleware, so they need the error-handler path with a distinct code so clients see 400 not 500. For file uploads the stakes rise: size limits, disk vs memory, content-type sniffing, and never trusting the client's filename for the storage path.",
    code: `import { z } from "zod";

const CreateUser = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["viewer", "editor"]).default("viewer"),
});

app.post("/users", async (req, res, next) => {
  const parsed = CreateUser.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION", issues: parsed.error.flatten() } });
  }
  // only explicitly declared fields proceed — mass assignment is impossible
  res.status(201).json(await createUser(parsed.data));
});`,
    tags: ["validation", "req.body", "zod", "prototype pollution"],
    followUps: [
      "How does mass assignment happen with an ORM and how do you prevent it?",
      "Why can prototype pollution be worse than a plain 500 error?",
    ],
    interviewTip:
      "Give one concrete attack per risk (mass assignment, prototype pollution, oversized bodies) rather than saying 'validate input'. Concreteness is what makes a security-adjacent answer convincing.",
    concepts: ["input validation", "mass assignment", "prototype pollution", "body parsing"],
  },
  {
    id: "express-request-lifecycle-perf",
    topic: "express",
    category: "Request Lifecycle",
    difficulty: "hard",
    question:
      "Walk through what happens from the moment a request hits an Express server until the response is sent — including what Node does underneath. Where does latency hide?",
    idealAnswer:
      "Node accepts the TCP connection and parses the HTTP request (llhttp), then emits it through the server's request listener into Express: middleware stack executes in registration order, each potentially doing async I/O — auth lookups, body parsing, DB queries — then the handler builds the response, res.send serializes and writes through the socket, and Express finishes the response, freeing resources. Latency hides in the awaited I/O inside the stack: each middleware that awaits adds serially, N+1 queries multiply, and any synchronous CPU work (JSON.stringify of a huge object, crypto, regex) blocks the event loop and delays every other request on that process. Connection-level costs — TLS handshakes, TCP setup, keep-alive misses — also show up as tail latency before your code even runs.",
    explanation:
      "Express is a thin dispatcher over Node's http.Server: there is no hidden work per request beyond stack traversal, which is why its performance ceiling is usually set by your I/O patterns, not the framework. Measuring per-stage (middleware timings, query timings) beats end-to-end averages because it attributes latency. Event-loop blocking is the classic production killer: a 50 ms synchronous hash or a 10 MB JSON response body serializes on the main thread, and under concurrency the whole process stalls — mitigate with async APIs, streaming responses for large payloads, worker threads for CPU work, and keeping responses lean (pagination, field selection). Connection reuse matters at both ends: keep-alive to clients and an HTTP agent with pooled keep-alive sockets to upstreams, because a fresh TCP+TLS handshake per upstream call adds tens to hundreds of milliseconds. Backpressure: writing a huge response to a slow client must respect write() returning false, or memory balloons.",
    code: `// Measure where latency hides
app.use((req, res, next) => {
  const t = performance.now();
  res.on("finish", () => log.info({ path: req.path, ms: (performance.now() - t).toFixed(1) }));
  next();
});

// Streaming a large response instead of buffering it
app.get("/export", (req, res) => {
  res.setHeader("Content-Type", "text/csv");
  db.queryStream("SELECT * FROM orders")
    .pipe(csvStringify())
    .pipe(res); // backpressure handled by pipe
});`,
    tags: ["request lifecycle", "event loop", "latency", "node internals"],
    followUps: [
      "How would you detect and confirm event-loop blocking in production?",
      "Why does an un-pooled upstream HTTP agent hurt p99 latency?",
    ],
    interviewTip:
      "Narrate the lifecycle end to end, then land on the two places latency actually accumulates: serial awaits in the stack and CPU work blocking the event loop. That connects Express knowledge to Node understanding.",
    concepts: ["middleware execution", "event loop blocking", "keep-alive", "streaming"],
  },
  {
    id: "express-security-hardening",
    topic: "express",
    category: "Security",
    difficulty: "medium",
    question:
      "What Express-specific security configuration does a production API need? Cover headers, CORS, cookies, and the top request-handling mistakes.",
    idealAnswer:
      "Start with helmet for baseline headers (HSTS, X-Content-Type-Options, a CSP even a minimal one), then configure CORS deliberately: an explicit origin allow-list, credentials only where needed, and never reflect an arbitrary Origin when credentials are involved. Cookies for sessions need HttpOnly (no JS access, mitigates XSS theft), Secure (HTTPS only), SameSite (Lax default; Strict for high-value actions) and a path/domain as narrow as possible. Request-handling mistakes that become vulnerabilities: trusting req.body without validation, serving user paths with res.sendFile or static middleware (path traversal), verbose error pages leaking stack traces, missing rate limits on auth routes, and leaving the stack trace handler in production. Disable x-powered-by and ensure the JSON parser's size limit is set deliberately.",
    explanation:
      "CORS is not protection for your server — it is protection for your users' browsers: it stops other sites from reading responses authenticated by cookies. The dangerous misconfiguration is echoing the Origin header back with Access-Control-Allow-Credentials: true, which turns a cross-site request into an authenticated one; preflight handling also matters because non-simple requests require an OPTIONS route that middleware must not short-circuit incorrectly. Cookie security interacts with CSRF: SameSite=Lax blocks cross-site POSTs in modern browsers but legacy clients exist, so a CSRF token or origin-checking middleware is still worthwhile for state-changing routes. XSS mitigation starts with output encoding and CSP, but HttpOnly cookies close the token-theft vector. Path traversal: static middleware should be scoped to a dedicated public directory and res.sendFile needs an explicit root or validated path, never user-supplied paths joined directly.",
    code: `import helmet from "helmet";

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));

app.use(cors({
  origin: ["https://app.example.com"],   // allow-list, never echo
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
}));

res.cookie("sid", token, {
  httpOnly: true, secure: true, sameSite: "lax",
  maxAge: 15 * 60 * 1000, path: "/",
});

// Traversal-safe file serving
res.sendFile(userFile, { root: UPLOAD_DIR }); // never: sendFile(UPLOAD_DIR + name)`,
    tags: ["security", "helmet", "cors", "cookies", "csrf"],
    followUps: [
      "Why is Access-Control-Allow-Origin: * invalid together with credentials, and what do attackers do if you echo the Origin instead?",
      "How do SameSite cookies and CSRF tokens overlap — do you still need tokens with Lax?",
    ],
    interviewTip:
      "Group the answer into headers, CORS, cookies, request handling and show one concrete misconfiguration consequence per group. Saying what CORS actually protects (users' browsers, not your server) signals depth.",
    concepts: ["security headers", "CORS", "cookie flags", "path traversal"],
  },
];
