import type { Question } from "@/lib/types";

export const systemDesignQuestions: Question[] = [
  {
    id: "system-design-approach",
    topic: "system-design",
    category: "Fundamentals",
    difficulty: "medium",
    question:
      "How do you structure a system design interview answer? Walk through your process from requirements to tradeoffs.",
    idealAnswer:
      "Work in four passes and say them out loud. First clarify functional requirements, then the non-functional ones (scale, latency target, consistency, availability, budget) and what is out of scope. Second do back-of-envelope estimation: users, requests per second, read/write ratio, payload size, storage growth per year and the peak multiplier — those numbers drive every later choice. Third sketch a high-level design (client, API, services, data stores, async paths) and walk one write and one read end to end. Fourth deep-dive the two or three hardest parts, stating tradeoffs explicitly and what you would monitor. Naming a bottleneck and how you would find it in production separates a good answer from a diagram.",
    explanation:
      "The interview tests structured reasoning, not recall of a reference architecture. Estimation anchors decisions: 1M daily active users doing 10 actions each is ~115 writes/sec average and several times that at peak, which tells you whether you need a cache, a queue or sharding — and if the numbers fit on one Postgres instance, saying so is a strength. Clarifying scope first also prevents the classic failure of designing for scale nobody asked for. State tradeoffs as a choice plus a cost: 'denormalise for read speed, accept write amplification and a second of staleness'. Close with operational reality — metrics, alerts, failure modes and graceful degradation.",
    code: `# Back-of-envelope template
registered users : 1,000,000 (100,000 daily active)
actions          : 10/day -> 1,000,000 actions/day
average rps      : 1e6 / 86,400  ~= 12 rps
peak (5x)        : ~60 rps
payload          : 2 KB average -> ~2 GB/day, ~730 GB/year
read:write       : 20:1 -> cache reads, batch writes
latency target   : p99 < 300 ms for reads`,
    tags: ["requirements", "estimation", "tradeoffs", "interview process"],
    followUps: [
      "How do you decide what is out of scope during a design interview?",
      "Which numbers most often change your architecture decision?",
    ],
    interviewTip:
      "Narrate the process instead of jumping to boxes and arrows. Say the numbers out loud, state each tradeoff as choice plus cost, and finish with how you would detect failure in production.",
    concepts: ["requirements gathering", "back-of-envelope estimation", "tradeoff analysis"],
  },
  {
    id: "system-design-url-shortener",
    topic: "system-design",
    category: "Case Studies",
    difficulty: "medium",
    question:
      "Design a URL shortener like bit.ly: what does the storage and ID generation look like at 100M new URLs per year, and how do redirects stay fast?",
    idealAnswer:
      "IDs: a base62 encode of a unique 64-bit counter or a pre-allocated range per server (or snowflake-style time+shard ids), giving short codes like '9xQ2kP' — random 7-char codes risk collisions and retry logic. Storage: a key-value shape (code -> long URL, owner, expiry) fits a wide-column store or a sharded Postgres; 100M/year at ~500 bytes is ~50 GB/year, so one primary plus read replicas works for years. Redirects are the hot path: cache aggressively (CDN-level for popular codes, Redis for the tail), return 301 only when caching is safe (browsers stop hitting you after a 301, which also breaks analytics — most shorteners use 302 so every click is countable), and make the redirect a single indexed lookup with no auth. Analytics via async events, not inline writes.",
    explanation:
      "The estimation drives choices: 100M/year is only ~3 writes/sec average, but reads can be 100x writes — a read-heavy design with a cache layer in front of a simple store is correct, and saying so is the point. Key design tensions worth surfacing: 301 vs 302 (permanent redirect caches at the browser and loses click tracking; temporary keeps control at the cost of load), custom aliases need a uniqueness check on a reserved namespace, and abuse (malware links) needs a validation or blocklist step at creation. Sharding comes up in follow-ups: range-based sharding by code prefix is simple but hotspot-prone; hash-based sharding is even but complicates range scans (rarely needed here). TTLs and cleanup: expiry as a column with periodic batch deletion, not per-key timers.",
    code: `# Estimation
writes : 100M/year ~= 3/sec (peak ~30/sec)
reads  : 100:1 read:write ~= 300/sec (peak ~3000/sec)
storage: 500 bytes x 100M = ~50 GB/year

# Write
POST /shorten { url }
  -> validate + blocklist check
  -> id = counter.next()          # 64-bit, pre-allocated ranges per node
  -> code = base62(id)            # 'aB3xK9'
  -> store.put(code, {url, owner, created, expires})

# Read (hot path, one indexed lookup + cache)
GET /aB3xK9 -> cache.get(code) ?? store.get(code) -> 302 Location: url`,
    tags: ["url shortener", "key-value stores", "caching", "id generation"],
    followUps: [
      "Why do most shorteners use 302 instead of 301 despite the caching cost?",
      "How would you handle two servers generating the same short code?",
    ],
    interviewTip:
      "Do the estimation first and let it justify the boring answer (one sharded KV store + cache). The 301-vs-302 tradeoff is the detail that shows real understanding.",
    concepts: ["base62 encoding", "read-heavy design", "redirect semantics", "capacity planning"],
  },
  {
    id: "system-design-feed-ranking",
    topic: "system-design",
    category: "Scalability",
    difficulty: "hard",
    question:
      "Design a Twitter-style feed: how do reads and writes scale differently, and when does fan-out-on-write break down?",
    idealAnswer:
      "Two models: fan-out-on-write precomputes each user's feed at post time (write to every follower's feed cache — fast reads, expensive writes for celebrities); fan-out-on-read assembles the feed at request time (cheap writes, expensive reads for users following many accounts). Real systems hybridize: fan out on write to normal users' feed lists, but merge celebrity posts at read time so a post with 100M followers costs one write plus per-reader merges. Storage: feed lists as per-user caches of post IDs (Redis lists, capped), posts themselves in a sharded store by post ID. Distribution of followers is the constraint: the fat-tail means pure fan-out-on-write has unbounded write amplification, while pure fan-out-on-read has unbounded read cost for heavy users — the hybrid bounds both.",
    explanation:
      "The estimation frame: suppose 100M DAU reading their feed 10x/day — that is ~12k feed reads/sec average, tens of thousands at peak, and each read touches hundreds of post IDs, so precomputation is essential; writes are smaller (a few thousand posts/sec) but fan-out multiplies each one by follower count. The hybrid exists because the follower distribution is power-law: <0.1% of users hold most followers. Additional design points: cache eviction (feeds are capped at ~800 entries, older pages hit the store directly), consistency tolerance (a few seconds of feed lag is acceptable — eventual consistency is fine here, which is what makes aggressive caching legal), and ranking: a ranked feed cannot be purely precomputed, so you store candidate posts and score at read time, trading freshness of ranking against latency. Cache invalidation happens on delete/block, which is rare and can be async. This is a distribution-of-workload question dressed as a product question — always ask for the follower distribution.",
    code: `# Hybrid fan-out
POST /tweet (from user X):
  store.save(post)
  if followers(X) < FANOUT_LIMIT:        # normal user
    for follower in followers(X):        # async job, not inline
      feedCache.append(follower, post.id)
  else:                                   # celebrity
    # nothing to do — readers merge at read time
    pass

GET /feed (user U):
  ids = feedCache.get(U, limit=400)
  celebrityPosts = store.recentPosts(followedCelebrities(U), since=cursor)
  return rank(merge(fetchPosts(ids), celebrityPosts))`,
    tags: ["feed", "fan-out", "caching", "power-law", "sharding"],
    followUps: [
      "How does a ranked (algorithmic) feed change the precomputation strategy?",
      "What happens when a user unfollows — how do you remove already-fanned-out posts?",
    ],
    interviewTip:
      "Anchor on the follower distribution (power law) because it dictates the hybrid design. Sketch both pure models, name their unbounded cost, then present the hybrid — that is the expected arc.",
    concepts: ["fan-out-on-write", "fan-out-on-read", "power-law distribution", "feed caching"],
  },
  {
    id: "system-design-consistency-models",
    topic: "system-design",
    category: "Tradeoffs",
    difficulty: "hard",
    question:
      "A senior engineer says 'it depends on the consistency model you need.' What do strong, eventual, causal and read-your-writes consistency actually guarantee, and how do you choose for a checkout vs a comment section?",
    idealAnswer:
      "Strong consistency: every read sees the latest committed write (linearizability) — costs latency and availability during partitions (CP in CAP terms). Eventual consistency: replicas converge eventually; reads can be stale, writes always succeed — cheap and highly available, but users see their own disappeared comment reappear. Read-your-writes: a session always sees its own latest writes even if others' data is stale — usually the real requirement behind 'we need strong consistency'. Causal: reads respect causality orderings (a reply never appears before its parent) without paying for global ordering. Checkout needs strong consistency on inventory/balance (double-spend is a correctness bug, so pay the latency or use a serializing primary); comments tolerate eventual consistency — a stale comment feed is an annoyance, not corruption. Most systems need per-operation choices, not one global model.",
    explanation:
      "The practical skill is matching operations to guarantees: within one user's session, read-your-writes is often cheaply achievable with sticky routing (read from the primary, or a replica the session wrote to), which avoids paying global strong-consistency latency. Implementation levers: quorum reads/writes (W+R>N gives strong-ish behavior with tunable latency), serializing through a single primary (Postgres), CRDTs or last-write-wins for mergeable data (carts, profiles), and explicit versioning/conflict handling for concurrent updates. The famous failures come from ignoring this: seeing a 'payment failed' but the card was charged (two systems with different consistency), inventory oversell (eventual consistency on a correctness-critical counter), or a password change not taking effect on all replicas (a security hole — sessions must be read-your-writes). CAP nuance worth stating: the choice is only forced during a partition; at normal times it is a latency tradeoff, which is why the PACELC framing (partition vs latency) is more useful in practice.",
    code: `# Checkout: correctness-critical -> strong consistency
BEGIN;
  SELECT stock FROM inventory WHERE sku = $1 FOR UPDATE;  -- serialize
  UPDATE inventory SET stock = stock - 1 WHERE sku = $1;
  INSERT INTO orders (...);
COMMIT;

# Comments: availability-critical -> eventual + read-your-writes
POST /comments -> write to any replica, async replication
GET  /comments -> read local replica (may be ms stale)
GET  /my-comments -> route to primary (read-your-writes for the author)

# Sticky session achieves read-your-writes cheaply:
# after a write, pin the session's reads to that replica for N seconds`,
    tags: ["consistency", "cap theorem", "quorums", "replication"],
    followUps: [
      "How does read-your-writes differ from causal consistency, and which is cheaper to implement?",
      "What consistency does a shopping cart need, and how do CRDTs help?",
    ],
    interviewTip:
      "Define each model in one sentence with its user-visible symptom, then answer the checkout-vs-comments contrast explicitly. Saying 'per-operation choices, not one global model' is the senior-level conclusion.",
    concepts: ["linearizability", "eventual consistency", "read-your-writes", "quorum"],
  },
];
