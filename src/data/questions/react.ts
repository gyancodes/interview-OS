import type { Question } from "@/lib/types";

export const reactQuestions: Question[] = [
  {
    id: "react-rendering-phases",
    topic: "react",
    category: "Rendering",
    difficulty: "medium",
    question:
      "Explain React's render and commit phases. Why is doing side effects or mutating state during render a bug, and what does StrictMode double-invoking reveal?",
    idealAnswer:
      "Render is the pure phase: React calls your components with props and state and produces a description of the UI (the element tree). It can run more than once, be thrown away, or be partially interrupted, so it must not mutate state, touch the DOM or fire requests. Commit is the phase where React applies the resulting changes to the DOM, runs layout effects, then passive effects, and only then are refs and layout measurements up to date. Calling setState during an unconditional render is an infinite loop because each set triggers another render; mutations during render break the assumption that a render is a pure function of inputs, which StrictMode surfaces by intentionally double-invoking render, effects and updaters in development.",
    explanation:
      "The separation exists so React can batch, prioritise and abandon work (concurrent rendering): a render with side effects could otherwise execute them twice or in an unpredictable order. Passing a function to setState lets React call it during render, which is why updaters must be pure — StrictMode calls them twice to prove it. Commit is split as well: layout effects run synchronously before paint (measuring, syncing DOM state), passive effects run after paint (subscriptions, fetches), and refs attach between them. Common misconceptions: that useEffect runs before paint (useLayoutEffect does) and that a re-render implies a DOM update — React diffs first, and identical output commits nothing. Expensive work belongs in useMemo or event handlers, not inline in render.",
    code: `function Counter() {
  // BAD: side effect during render (runs twice in StrictMode, loops if it sets state)
  // document.title = "count";

  // BAD: mutating props/state
  // items.push(newItem);

  // GOOD: derive during render, keep render pure
  const total = items.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    // commit phase: after paint, safe for subscriptions
    const id = setInterval(tick, 1000);
    return () => clearInterval(id); // cleanup runs before re-running
  }, []);

  return <p>{total}</p>;
}`,
    tags: ["render", "commit", "strict mode", "purity", "effects"],
    followUps: [
      "Why does useEffect run twice in development with StrictMode, and what is the intended fix?",
      "When do you need useLayoutEffect instead of useEffect?",
    ],
    interviewTip:
      "Use the words pure for render and effects for commit, then explain StrictMode as a correctness check rather than an annoyance. That framing is what senior interviewers look for.",
    concepts: ["render phase purity", "commit phase", "StrictMode"],
  },
  {
    id: "react-state-batching",
    topic: "react",
    category: "State Management",
    difficulty: "medium",
    question:
      "Why does calling setCount(count + 1) twice in one handler increment the counter only once, and how does the functional updater fix it?",
    idealAnswer:
      "State is a snapshot, not a mutable variable. Both calls in the same handler close over the same `count` value from the render they belong to, so both compute the same next value and the second update wins. React batches all updates from the handler into one re-render, so you never observe the intermediate value. setCount(prev => prev + 1) queues an updater that React applies to the latest pending state when it processes the queue, so two queued updaters produce +2. The same mechanism explains stale values in setTimeout, subscriptions and event listeners: they captured an older render's state, and the fix is the functional updater or reading from a ref that always holds the newest value.",
    explanation:
      "React 18 made automatic batching universal: updates inside promises, timeouts and native event handlers are batched too, unlike React 17 where only React event handlers batched. Batching is also why you should derive values during render instead of syncing them into state in an effect, which removes a class of extra renders and bugs. Updaters must stay pure because React may call them twice in StrictMode and may replay queued updaters during an interrupted render. Use the function form whenever the next state depends on the previous state; a plain value is fine when it depends only on the event payload. flushSync exists to opt out of batching for measurement, but it is a workaround rather than a design tool.",
    code: `function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1); // both read count = 0 from this render
    setCount(count + 1); // identical value -> net +1
    setCount((prev) => prev + 1); // queued updaters -> net +2 with the next line
    setCount((prev) => prev + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
    tags: ["state", "batching", "closures", "setState"],
    followUps: [
      "Why is state read inside a setInterval callback stale, and how do you fix it without re-subscribing?",
      "What changed about batching in React 18 and which existing code patterns did it break?",
    ],
    interviewTip:
      "Lead with 'state is a snapshot per render' — it explains batching, stale closures and effect dependencies in one idea, which is exactly the mental model interviewers test.",
    concepts: ["state snapshots", "functional updates", "automatic batching"],
  },
  {
    id: "react-hooks-dependencies",
    topic: "react",
    category: "Hooks",
    difficulty: "medium",
    question:
      "Why do useEffect dependency arrays cause so many bugs? Explain stale closures, when to use the empty array, and how cleanup functions fit in.",
    idealAnswer:
      "Effects close over the render's props and state, and the dependency array tells React when to re-run the effect to get fresh values. A wrong array produces stale closures — the effect keeps reading old values — or infinite loops when a set inside the effect triggers a re-run. The empty array means 'run once after mount', correct only when the effect genuinely uses nothing reactive (subscriptions with stable setup, one-time logging) — otherwise it hides bugs. Cleanup functions run before re-running and on unmount, which is what makes subscriptions, timers and in-flight request handling correct: cancel or ignore stale work there. The modern answer is to make dependencies complete and redesign around what changes, not to suppress with an incomplete array.",
    explanation:
      "The model: after every commit, React compares dependencies with Object.is; any change re-runs the effect after running cleanup. Every reactive value used inside must be listed — including props, derived objects and functions defined in the component — which is why inline objects/functions as dependencies cause re-runs every render (new identity), and why useMemo/useCallback exist to stabilize them when the cost is justified. Effects that fetch need an abort/ignore flag in cleanup to avoid setting state after unmount or a race where an older response lands last. Common anti-patterns: synchronizing state with effects when it can be derived during render; effects responding to events (event logic belongs in handlers); and exhaustive-deps disabled, which trades compile-time-visible bugs for runtime ones. React 18 StrictMode double-runs effects in dev to prove mount/unmount/re-mount safety — an effect that breaks under that cycle has a missing or incorrect cleanup.",
    code: `function Profile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ignore = false;              // guard against races + unmount
    fetchUser(userId).then((u) => { if (!ignore) setUser(u); });
    return () => { ignore = true; }; // cleanup before next run / unmount
  }, [userId]);                      // complete deps: re-runs when userId changes

  // Derived during render — no effect needed:
  const displayName = user?.name ?? "Loading…";
  return <h1>{displayName}</h1>;
}`,
    tags: ["useEffect", "dependencies", "cleanup", "stale closures"],
    followUps: [
      "When is an empty dependency array actually correct?",
      "How would you handle a fetch effect that races when props change quickly?",
    ],
    interviewTip:
      "Explain the mechanism (compare deps with Object.is, cleanup between runs) rather than the lint rule, then give the fetch-race example. Mechanism-first answers separate seniors from pattern-matches.",
    concepts: ["effect lifecycle", "stale closures", "race conditions", "cleanup"],
  },
  {
    id: "react-reconciliation-keys",
    topic: "react",
    category: "Rendering",
    difficulty: "medium",
    question:
      "What does React's reconciliation algorithm do when props change, and why do list keys matter so much? What breaks when you use the array index as a key?",
    idealAnswer:
      "On re-render React diffs the new element tree against the previous one, comparing element type and key at each position: same type and key means update-in-place (props reconciled, DOM mutated minimally), different type means unmount the subtree and mount fresh. Keys give elements in a list a stable identity across renders, so React can match items by identity instead of position. Using the index as a key breaks this when the list reorders or items are removed: React matches by position, so the item at index 2 is treated as 'the same' element as the previous index 2 — state (inputs, focus, local component state) stays attached to the wrong item and DOM updates multiply. A stable unique ID per item is the fix.",
    explanation:
      "Reconciliation is a heuristic O(n) tree diff, made fast by two assumptions: different element types produce different subtrees, and keys disambiguate siblings. Position-based matching without keys is why a removed middle item in an unkeyed list causes every following item to re-render with shifted props — usually just wasteful, but with index keys it is state-corrupting: an input's value typed into row 3 'moves' to row 2 after a deletion because React thinks that DOM is the same element. Keys must be stable and unique among siblings — not Math.random() per render, which forces full remounts every render and destroys performance and focus. Related detail: keys only need sibling uniqueness, not global; and re-parenting a component (moving it in the tree) also remounts it regardless of key, which matters for layout wrappers and conditional branches (a ternary that swaps wrapper elements unmounts children — use layout components or keep the tree shape stable).",
    code: `{/* BAD: index key — state corruption on reorder/delete */}
{items.map((item, index) => (
  <TodoRow key={index} item={item} />
))}

{/* GOOD: stable identity from data */}
{items.map((item) => (
  <TodoRow key={item.id} item={item} />
))}

{/* Subtle: swapping wrapper type remounts children */}
{loading ? <Spinner><Panel /></Spinner> : <Panel />} // Panel remounts
{<Panel loading={loading} />}                        // Panel persists`,
    tags: ["reconciliation", "keys", "diffing", "lists"],
    followUps: [
      "Why does Math.random() as a key destroy performance and focus?",
      "What is reconciliation's cost model, and what makes an update cheap or expensive?",
    ],
    interviewTip:
      "Explain diffing by type-and-key, then demonstrate the index-key state bug with the todo-list example. Interviewers often probe keys because they reveal whether someone understands the diff or just follows lint rules.",
    concepts: ["reconciliation", "keys", "element identity", "remounting"],
  },
  {
    id: "react-performance-memo",
    topic: "react",
    category: "Performance",
    difficulty: "hard",
    question:
      "A React list page re-renders slowly on every keystroke in a search box. Walk through how you would diagnose and fix it — including when memo/useMemo/useCallback help and when they are noise.",
    idealAnswer:
      "Diagnose first: React DevTools Profiler shows which components re-render and why (state change, parent render, changed context). Every keystroke sets state in the page component, re-rendering the entire tree, so the fixes in order: move the query state down into the input's component so only it re-renders (state colocation beats memoization); render the list from a memoized child or wrap rows in React.memo when re-rendering them is expensive and props are referentially stable — which usually requires useCallback for handlers and useMemo for computed props passed down, otherwise memo is defeated by fresh object identities every render; and for very large lists, virtualize (react-window) so only visible rows exist in the tree. The key judgment: memoization trades memory and code complexity for avoiding wasted renders — it pays off on large subtrees with stable props and is pure noise on cheap components where render cost is trivial.",
    explanation:
      "The renderer's cost is 'render everything under the state owner', so the cheapest render is the one that never happens — state placement is the first-order fix and memoization is the second. memo does a shallow compare of props; anything that changes identity each render (inline objects, arrays, functions) breaks it, which is why useCallback/useMemo exist — not for performance of the hook itself but to keep props referentially stable for children. Common misuses: wrapping every component ('premature memoization' adds overhead and hides data flow), useMemo on cheap computations (comparison can cost more than the compute), and virtualizing lists where the row count is small. React Compiler (memoization done automatically) is changing this calculus, but the underlying model — re-render scope equals state-owner scope — stays the same. Also profile in production mode and with realistic data: dev-mode double renders and empty lists flatter the numbers.",
    code: `function SearchPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filter(ITEMS, query), [query]); // stable array
  const onSelect = useCallback((id) => open(id), []);         // stable fn

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <RowList rows={rows} onSelect={onSelect} /> {/* memo(RowList) */}
    </>
  );
}

const RowList = memo(function RowList({ rows, onSelect }) {
  return rows.map((row) => <Row key={row.id} row={row} onSelect={onSelect} />);
});`,
    tags: ["performance", "memo", "useCallback", "virtualization", "profiling"],
    followUps: [
      "Why does memo fail when handlers are defined inline, and how does useCallback fix it?",
      "What does the React Compiler change about memoization discipline?",
    ],
    interviewTip:
      "Say 'profile first, state placement second, memoization third' — that ordering is the senior signal. Explaining WHY memo needs stable props shows you understand the mechanism, not the API.",
    concepts: ["re-render scope", "referential equality", "memoization", "virtualization"],
  },
  {
    id: "react-data-fetching-suspense",
    topic: "react",
    category: "Data Fetching",
    difficulty: "medium",
    question:
      "Compare data fetching in useEffect versus frameworks/libraries that fetch during render (React Query, SWR, RSC, Suspense). Why is useEffect fetching considered an anti-pattern at scale?",
    idealAnswer:
      "useEffect fetching happens after paint, so the user sees a loading state, then a second round trip; it produces waterfalls when parent and child both fetch in effects, needs manual caching (each mount refetches), and needs manual race handling. Render-time fetchers (React Query/SWR) start requests when the component renders, cache and deduplicate across components, and handle retries, refetching and race conditions for you. Server Components move fetching to the server entirely — no client round trip, no loading spinner for the initial payload, secrets stay server-side. Suspense makes loading states declarative: the component suspends, boundaries define fallbacks, and React can start renders before data arrives instead of gating the whole page on one effect.",
    explanation:
      "The problems with effect-fetching are structural: it is sequential (effects run after commit), uncoordinated (no shared cache means sibling components fetching the same thing each fetch), and error-prone (abort flags, error state, refetch logic each hand-rolled). React Query/SWR formalize it: a query key identifies data, staleness is configurable, mutations invalidate related queries, and the cache persists across mounts so navigating back is instant. Server Components shift the fetch to the server where latency to the database is tiny — the client receives rendered output, though interactivity requires client components and the request is per-navigation rather than per-interaction. Suspense's real value is coordination: instead of every component managing isLoading booleans, React tracks which subtree is waiting, shows the nearest fallback, and can reveal content progressively as each piece resolves (streaming SSR). The mental model shift: data fetching moves from an effect concern to a render concern, which is what makes caching and coordination possible.",
    code: `// Anti-pattern: effect fetch — waterfall, no cache, manual races
function User({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(\`/api/users/\${id}\`).then(r => r.json()).then(u => !ignore && setUser(u));
    return () => { ignore = true; };
  }, [id]);
}

// React Query: cached, deduped, race-safe
const { data, isPending } = useQuery({
  queryKey: ["user", id],
  queryFn: () => getUser(id),
  staleTime: 30_000,
});

// Server Component: fetch on the server, no client round trip
async function User({ id }) {
  const user = await getUser(id); // runs on server during render
  return <Profile user={user} />;
}`,
    tags: ["data fetching", "react query", "suspense", "server components"],
    followUps: [
      "How do query keys enable cache invalidation after a mutation?",
      "What does Suspense change about how loading states are composed?",
    ],
    interviewTip:
      "Structure as: effect problems (waterfalls, no cache, races) → what libraries formalize → where RSC moves the work. Saying 'fetching becomes a render concern' shows you get the architectural shift, not just API differences.",
    concepts: ["waterfalls", "query caching", "Suspense", "Server Components"],
  },  {
    id: "react-state-management-spectrum",
    topic: "react",
    category: "State Management",
    difficulty: "hard",
    question:
      "What kinds of state exist in a React app, and how do you decide between local state, context, server-state libraries, and a global store like Redux or Zustand?",
    idealAnswer:
      "First classify: server-state (data owned by the backend — users, orders) is cache management, not state management, and belongs in React Query/SWR or RSC; URL state (filters, pagination) belongs in the router so it is shareable and survives refresh; form and local UI state belongs in the component; genuinely global client state (theme, auth session, feature flags) is the small remainder — context for read-mostly values, Zustand/Redux for read-write shared state with many consumers. The decision rule is ownership: who mutates it and who reads it. Most 'we need Redux' situations are actually server-state being stored in client state, which then needs manual cache invalidation — the bug class Redux-for-everything apps drown in. Context is not a state manager: it re-renders all consumers when the value changes, so it fits low-frequency values, not rapidly changing ones.",
    explanation:
      "The classification matters because each kind has different correctness requirements: server-state needs staleness tracking, deduplication and invalidation; URL state needs serialization; client state needs referential discipline. Context's re-render semantics: every consumer re-renders when the context value identity changes, so a theme object recreated each render makes the whole subtree re-render — the fixes are value memoization, splitting contexts by update frequency, or selectors (Zustand's useStore(selector) subscribes to slices, so components only re-render when their slice changes). Redux's value was centralized, traceable updates for complex cross-cutting state; its cost is indirection. Modern Redux Toolkit removes much boilerplate, and Zustand covers the 'small global store' niche with subscriptions and selectors. Lifting state up stays the most underused tool: moving state to the closest common ancestor beats introducing infrastructure, and colocating it down beats lifting when siblings do not care.",
    code: `// Server state -> cache library, not global store
const { data: orders } = useQuery({ queryKey: ["orders", userId], queryFn: ... });

// URL state -> router params (shareable, refresh-safe)
const [searchParams, setSearchParams] = useSearchParams();

// Local UI state -> component
const [isOpen, setIsOpen] = useState(false);

// Small global client state -> Zustand with selectors
const useCart = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));
const count = useCart((s) => s.items.length); // only re-renders when count changes`,
    tags: ["state management", "context", "zustand", "server state", "architecture"],
    followUps: [
      "Why is putting server data in Redux usually a mistake?",
      "How do Zustand selectors avoid the context re-render problem?",
    ],
    interviewTip:
      "Classify state by ownership before naming tools — the question tests judgment, not library knowledge. The line 'server-state is caching, not state management' is the one senior engineers listen for.",
    concepts: ["state ownership", "server state vs client state", "context re-renders", "selectors"],
  },
];
      
