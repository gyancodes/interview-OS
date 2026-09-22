import type { Question } from "@/lib/types";

export const nodejsQuestions: Question[] = [
  {
    id: "nodejs-eventloop-phases",
    topic: "nodejs",
    category: "Event Loop",
    difficulty: "medium",
    question:
      "Explain Node's event loop phases and where the following run relative to each other: a scheduled timer, an I/O callback, setImmediate, process.nextTick and a resolved promise.",
    idealAnswer:
      "The loop iterates over phases: timers (due setTimeout/setInterval callbacks), pending callbacks, poll (retrieve I/O events and run their callbacks, generally blocks here), check (setImmediate), then close callbacks. Between every phase — and after each individual callback — Node drains the microtask queues: process.nextTick queue first, then the promise queue. So a timer due now runs before I/O callbacks of this iteration; setImmediate runs in the check phase, which is why inside an I/O callback it runs before a 0ms timer; and nextTick/promise callbacks always cut in before the loop advances to the next phase, which is why they can starve I/O if you chain them.",
    explanation:
      "libuv owns the loop; JavaScript executes on the main thread and hands timers/I/O to the thread pool, then runs callbacks when the loop reports readiness. Timing nuance: `setTimeout(fn, 0)` is clamped to 1ms and its ordering against setImmediate is non-deterministic when called from the main module, but deterministic (setImmediate first) inside an I/O callback — a classic interview detail. process.nextTick is not part of the loop at all; it is a Node-level queue drained before promises, and it is intended for deferring work until after the current operation completes (releasing a handle, emitting after construction). Recursive nextTick or promise chains starve I/O and timers forever, which is the 'microtask starvation' failure mode. Common misconception: that promises are a phase — they are microtasks drained inline.",
    code: `const fs = require("node:fs");

fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  process.nextTick(() => console.log("nextTick"));
  Promise.resolve().then(() => console.log("promise"));
});
// nextTick, promise, immediate, timeout`,
    tags: ["event loop", "libuv", "microtasks", "setImmediate"],
    followUps: [
      "Why can a recursive promise chain block the server indefinitely?",
      "Where does nextTick queue fit relative to Promise callbacks, and why does it exist?",
    ],
    interviewTip:
      "Name the phases in order first, then state the rule 'microtasks drain between every phase'. The nextTick-before-promise ordering is the detail that signals real Node experience.",
    concepts: ["event loop phases", "microtask queue", "starvation"],
  },
  {
    id: "nodejs-streams-backpressure",
    topic: "nodejs",
    category: "Streams",
    difficulty: "medium",
    question:
      "Why would you use a stream instead of fs.readFile for large files, and what does backpressure mean in practice?",
    idealAnswer:
      "readFile buffers the entire file in memory before you can act on it — a 2 GB upload becomes a 2 GB allocation plus GC pressure, and it cannot start work until the whole read finishes. A stream processes chunks, so memory stays roughly constant and you can start work immediately. Backpressure is the flow control that makes that safe: when the writable sink is slower than the readable source (a slow client, a disk), write() returns false and the stream emits 'drain' when it can accept more. pipeline() wires this up for you, propagating errors and destroying both sides, instead of you hand-rolling data/error listeners and leaking file handles.",
    explanation:
      "Node streams are EventEmitters with internal buffers governed by highWaterMark (16 KB default for byte streams). A readable pauses reading when its buffer fills; a writable signals with write() === false and you must stop writing until 'drain'. Ignoring that return value is the standard cause of unbounded memory growth in Node services — the data is queued in the writable's buffer instead. `pipeline` (stream/promises) is preferred over `pipe` because pipe does not forward errors or close the destination on failure. Practically: use fs.createReadStream for uploads/downloads, csv parsing, log processing, and proxying HTTP responses; use stream.pipeline plus AbortSignal for cancellation; and remember that stream transforms are per-chunk, so encoding boundaries require a line-splitting transform or readline rather than assuming one chunk equals one record.",
    code: `const { createReadStream, createWriteStream } = require("node:fs");
const { pipeline } = require("node:stream/promises");
const { createGzip } = require("node:zlib");

async function compress(src, dest) {
  // constant memory regardless of file size
  await pipeline(createReadStream(src), createGzip(), createWriteStream(dest));
}

// Manual backpressure handling when writing by hand
if (!writable.write(chunk)) {
  await once(writable, "drain");
}`,
    tags: ["streams", "backpressure", "memory", "pipeline"],
    followUps: [
      "What is highWaterMark and how does it affect throughput vs memory?",
      "How would you stream a large JSON array without loading it into memory?",
    ],
    interviewTip:
      "Anchor the answer in memory and latency numbers, then explain backpressure as flow control with write() returning false. Mentioning pipeline over pipe shows production habits.",
    concepts: ["chunked processing", "flow control", "highWaterMark"],
  },
  {
    id: "nodejs-worker-threads-cpu",
    topic: "nodejs",
    category: "Worker Threads",
    difficulty: "hard",
    question:
      "Node is single-threaded, yet it has worker_threads and cluster. When do you need each, what can block the main thread, and how do you move CPU-bound work off it?",
    idealAnswer:
      "The event loop is single-threaded: any synchronous CPU work — JSON.stringify of a large object, crypto without the async API, image resize, regex backtracking, large array sorts — blocks all requests on that process. worker_threads (worker_threads module, Piscina pool in practice) runs JavaScript in parallel threads for CPU-bound work: hash a large file, compress, parse a huge CSV. cluster (or running multiple containers) runs multiple processes of the whole app to use multiple cores and survive crashes — it does nothing for a single blocked request, only for distributing many. The decision: I/O-bound load → scale processes; a single slow CPU operation → move it to a worker thread pool. Communication is by message passing with structured clone (or SharedArrayBuffer for zero-copy), so you pay serialization costs — pass small inputs and return small outputs, stream or chunk large data.",
    explanation:
      "Blocking is invisible in load tests that use small payloads: a 10 MB JSON body stringify takes ~100ms, so 10 concurrent requests serialize on it. Detect it by measuring event-loop lag (monitored.delay, perf_hooks.monitorEventLoopDelay) and by noticing latency climbs with request size. worker_threads details worth knowing: workers are expensive to create (~ms plus V8 isolate memory), so pool them (Piscina) rather than spawning per request; transferable ArrayBuffers and SharedArrayBuffer avoid copying large data; worker errors and unhandled rejections must be handled or the main thread can hang awaiting a dead worker. cluster vs modern practice: cluster is largely superseded by running multiple containers under an orchestrator, which also isolates restarts and simplifies zero-downtime — same process-per-core idea, better tooling. Node 12+ auto-starts some thread pools; crypto.pbkdf2 already uses libuv's threadpool, so the fix for many CPU cases is 'use the async API' before reaching for workers. Also remember the libuv threadpool (UV_THREADPOOL_SIZE, default 4) is shared by fs, dns.lookup, and crypto — saturating it with fs calls starves the others.",
    code: `// Main thread stays responsive; CPU work goes to a pool
import { Piscina } from "piscina";
const hashing = new Piscina({ filename: "./workers/hash.js", maxThreads: 4 });

app.post("/hash", async (req, res) => {
  const digest = await hashing.run(req.body);  // off the event loop
  res.json({ digest });
});

// workers/hash.js
const { pbkdf2 } = require("node:crypto");
module.exports = ({ password, salt }) =>
  new Promise((resolve, reject) =>
    pbkdf2(password, salt, 100_000, 32, "sha256",
      (err, key) => (err ? reject(err) : resolve(key.toString("hex")))));

// Detect blocking before users do
const { monitorEventLoopDelay } = require("perf_hooks");
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => log.info({ p99: h.percentile(99) / 1e6 }), 10_000); // ms`,
    tags: ["worker threads", "event loop", "cpu-bound", "clustering", "piscina"],
    followUps: [
      "How would you detect event-loop blocking in production before users complain?",
      "Why is a worker thread per request a bad idea, and what do you use instead?",
    ],
    interviewTip:
      "Open with the two-axis decision (I/O-bound → more processes, CPU-bound → worker threads), then name real blocking culprits like JSON.stringify and sync crypto. Mentioning Piscina and event-loop-lag metrics shows production depth.",
    concepts: ["event loop blocking", "worker threads", "thread pool", "process scaling"],
  },  {
    id: "nodejs-error-handling-async",
    topic: "nodejs",
    category: "Error handling",
    difficulty: "medium",
    question:
      "How does error handling differ across callbacks, promises, async/await and EventEmitters in Node? How do you guarantee nothing slips through to an uncaughtException?",
    idealAnswer:
      "Callbacks use error-first signatures (err, result) and every caller must check err — forgetting means silent failure. Promises carry rejections through the chain, so one .catch at the end covers the chain, but an unreturned or non-awaited promise rejects into the void — hence 'no floating promises'. async/await restores try/catch, but each await needs its own scope; a rejected await without try/catch bubbles up the async call stack, so the outermost handler must catch. EventEmitters have no implicit error path: the 'error' event throws if there is no listener, so every emitter that can error needs one registered. Safety net: process.on('unhandledRejection') and 'uncaughtException' should log and gracefully shut down — after an uncaught exception the process state is unreliable, so the right move is exit and let the supervisor (PM2, K8s) restart, not continue.",
    explanation:
      "The unifying rule: every async operation needs a designated handler. Promise rejection tracking makes floating rejections loud in dev (node --unhandled-rejections=strict makes them crash, matching future behavior). For Express, async handler rejections are forwarded automatically in Express 5, but in Express 4 need a wrapper — a common source of 'my try/catch didn't run'. Streams error on both ends, so pipeline() replaces manual error wiring. Operational patterns: domain errors (per-request errors) should map to a response, while programmer errors (TypeError) should crash — classifying errors into operational vs programmer keeps the process healthy; retrying on a bug just amplifies it. Timeouts and cancellation: promises never time out by themselves, so wrap slow I/O with Promise.race against a timer or use AbortSignal — a request that hangs forever holds memory and a connection. Finally, error events on sockets/servers: an http.Server 'clientError' or socket error handler prevents one bad client from taking down the process.",
    code: `// async/await with a designated outermost handler
app.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await getOrder(req.params.id); // rejection -> catch
    if (!order) return res.status(404).json({ error: "not found" });
    res.json(order);
  } catch (err) {
    next(err); // single error path
  }
});

// EventEmitter: 'error' without a listener throws
const emitter = new EventEmitter();
emitter.on("error", (err) => logger.error({ err })); // required

// Last-resort handlers: log, clean up, EXIT
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  process.exit(1); // supervisor restarts a clean process
});`,
    tags: ["error handling", "promises", "eventemitter", "crash safety"],
    followUps: [
      "Why should uncaughtException log and exit rather than continue serving?",
      "How would you add a timeout to an arbitrary promise-based operation?",
    ],
    interviewTip:
      "Walk through the four styles quickly, then spend time on the process-level net: log-and-exit on uncaught exceptions, why continuing is worse than crashing. Crash-safety thinking is the signal of production Node experience.",
    concepts: ["error-first callbacks", "rejection propagation", "unhandled rejections", "graceful shutdown"],
  },
  {
    id: "nodejs-buffers-binary",
    topic: "nodejs",
    category: "Buffers",
    difficulty: "easy",
    question:
      "What is a Buffer in Node, how does it differ from a string, and where do encoding bugs come from?",
    idealAnswer:
      "A Buffer is a fixed-size allocation of raw bytes outside the V8 heap — how Node represents binary data (file chunks, sockets, images). A string is a sequence of Unicode code points with an implicit encoding; a Buffer is bytes with an explicit one. Encoding bugs come from mixing them: buffer.toString() defaults to utf8, so binary data (an image, a zip) round-tripped through a string is corrupted; string concatenation with multi-byte characters can split a character across chunk boundaries in streams; and Buffer.from(str) without an encoding assumes utf8, silently mangling latin1 input. Crypto and HTTP APIs accept both, so passing the wrong one usually works in tests and fails on real data.",
    explanation:
      "Buffers exist because JS strings are UTF-16 internally while the outside world is bytes: reading a file returns a Buffer so no lossy conversion happens until you ask. Common pitfalls: chunk boundaries in streams can split a UTF-8 multi-byte character (setEncoding() or a string-decoder handles reassembly); Buffer.allocUnsafe skips zero-filling for speed but can leak old heap contents if you write less than you allocate — Buffer.alloc is the safe default; comparing buffers with === compares references, use buf.equals(buf2). Conversions worth knowing: Buffer.from(base64String, 'base64') for decoding, buf.toString('hex') for display, and base64url for JWTs. Memory note: Buffer allocations outside the V8 heap do not count against the JS heap limit, which is why large file operations use buffers/streams without hitting the old-space ceiling — but they still count against RSS, so unbounded buffering is still unbounded memory.",
    code: `const buf = Buffer.from("héllo", "utf8");
buf.length;            // 6 bytes (é is 2 bytes in utf8)
buf.toString("base64");

// The classic corruption: binary -> string -> binary
const png = fs.readFileSync("image.png");      // Buffer (correct)
const broken = Buffer.from(png.toString("utf8")); // mojibake — utf8 decode mangled bytes

// Multi-byte character split across stream chunks
const splitter = new StringDecoder("utf8");
stream.on("data", (chunk) => {
  text += splitter.write(chunk); // reassembles split characters
});

// Safe allocation
const header = Buffer.alloc(16);       // zero-filled
const fast   = Buffer.allocUnsafe(16); // faster, must fully overwrite`,
    tags: ["buffers", "encodings", "utf-8", "binary data"],
    followUps: [
      "Why can a UTF-8 character be split across stream chunks and how does StringDecoder fix it?",
      "What is the difference between Buffer.alloc and Buffer.allocUnsafe in practice?",
    ],
    interviewTip:
      "Define it as bytes-vs-code-points, then give the image-corruption example — one concrete failure beats three definitions. Mentioning chunk-boundary splitting shows you have actually processed streams.",
    concepts: ["binary vs text", "encodings", "memory allocation"],
  },
  {
    id: "nodejs-http-server-internals",
    topic: "nodejs",
    category: "HTTP",
    difficulty: "medium",
    question:
      "What does Node's http.Server actually do for each request, and which knobs (keep-alive, timeouts, maxRequestsPerSocket) matter in production?",
    idealAnswer:
      "http.Server accepts TCP connections, parses HTTP with llhttp on the main thread, emits 'request' events, and writes responses back to the socket — your handler runs as one event among all others, so blocking it stalls every connection. Production knobs: server.keepAliveTimeout (default 5s) must be longer than the load balancer's idle timeout or clients get race-y ECONNRESETs; headersTimeout and requestTimeout protect against slow-loris style attacks; server.maxRequestsPerSocket enables periodic connection recycling; and keep-alive to upstreams needs an http.Agent with keepAlive: true and a maxSockets cap — the default agent has no keep-alive, so every upstream call pays TCP+TLS setup. A queued-but-never-served request is the classic symptom: keep-alive race or an agent without socket limits under burst load.",
    explanation:
      "The keep-alive race is worth knowing cold: Node closes idle sockets after keepAliveTimeout (5s default); a client (or LB) that reuses a socket at exactly that moment gets a connection reset. The fixes: raise keepAliveTimeout above the LB idle timeout (e.g. LB 60s → server 65s) and set graceful shutdown that stops accepting first. Timeouts as a set: server.timeout (socket inactivity, 0 = disabled by default in modern Node), requestTimeout (whole request, default 300s in Node 18+), headersTimeout (must be lower than requestTimeout) — without them a malicious slow client pins a socket indefinitely. Outbound: one shared Agent with keepAlive and maxSockets sized to upstream capacity; unlimited sockets (maxSockets: Infinity default) against a rate-limited upstream causes cascading failures. For graceful shutdown: server.close() stops new connections, then closeIdleConnections() and closeAllConnections() with a deadline before process exit — this is what makes Kubernetes rolling deploys drop zero requests. HTTPS adds TLS handshake cost per connection, which is exactly why keep-alive matters more there.",
    code: `const http = require("node:http");

const server = http.createServer(handler);
server.keepAliveTimeout = 65_000;   // > LB idle timeout (e.g. 60s)
server.headersTimeout = 66_000;     // must exceed keepAliveTimeout
server.requestTimeout = 30_000;     // cap slow requests
server.maxRequestsPerSocket = 1000; // recycle connections periodically

// Shared keep-alive agent for upstream calls
const agent = new http.Agent({ keepAlive: true, maxSockets: 100 });
fetch(upstream, { agent });

// Graceful shutdown for zero-downtime deploys
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
  server.closeIdleConnections();
});`,
    tags: ["http server", "keep-alive", "timeouts", "graceful shutdown"],
    followUps: [
      "Why does the default 5s keepAliveTimeout cause ECONNRESET behind some load balancers?",
      "What is the shutdown sequence that drops zero in-flight requests?",
    ],
    interviewTip:
      "Structure as: what the server does per request, then the timeout family, then the keep-alive race. The LB-idle-timeout mismatch is a real incident everyone eventually debugs — mentioning it is the experience signal.",
    concepts: ["keep-alive", "connection management", "request timeouts", "graceful shutdown"],
  },
];
