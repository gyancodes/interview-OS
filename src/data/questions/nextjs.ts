import type { Question } from "@/lib/types";

export const nextjsQuestions: Question[] = [
  {
    id: "nextjs-app-router-split",
    topic: "nextjs",
    category: "Server & Client Components",
    difficulty: "medium",
    question:
      "In the App Router, what runs on the server and what runs in the browser for a page whose server component fetches data and renders a client component with a form?",
    idealAnswer:
      "The server component runs only on the server (or at build time for static routes): it can await a database call directly, and its code and dependencies never ship to the browser. Its output is serialised into the RSC payload. The client component is prerendered on the server for the initial HTML, then hydrated and executed in the browser, where hooks, event handlers and browser APIs live. So on first request the server fetches data and produces HTML; in the browser React attaches interactivity. Only the client component's JavaScript plus the RSC payload crosses the network, and props passed across the boundary must be serialisable.",
    explanation:
      "The value is smaller bundles and fewer waterfalls: fetching in a server component removes a client-side request chain for initial data, and heavy libraries or secrets stay server-side. The constraints follow from the boundary: functions, class instances and Symbols cannot be passed to a client component because the payload must serialise; a client component cannot import a server component, but it can receive one as children from the server. Data fetching in a client component means useEffect plus fetch, a stale-while-revalidate library, or a route handler/server action, which re-introduces the waterfall. Names and caching defaults vary by Next version, so confirm against the docs for your release.",
    code: `// app/items/page.tsx  (server component, default)
import { db } from "@/lib/db";
import { ItemForm } from "./item-form";

export default async function ItemsPage() {
  const items = await db.item.findMany();      // server only, no API hop
  return <ItemForm initialItems={items} />;    // props must be serialisable
}

// app/items/item-form.tsx  (client component)
"use client";
import { useState } from "react";

export function ItemForm({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems); // hooks need the client
  return <form onSubmit={/* ... */}>{items.length}</form>;
}`,
    tags: ["app router", "server components", "hydration", "rsc payload"],
    followUps: [
      "Why can't you pass a function from a server component to a client component?",
      "How do you render a server component as a child of a client component?",
    ],
    interviewTip:
      "Anchor everything on the serialisation boundary and the bundle: explain what is shipped, not just what runs where. That distinguishes understanding from memorising directives.",
    concepts: ["RSC boundary", "hydration", "serialisable props"],
  },
  {
    id: "nextjs-caching-revalidation",
    topic: "nextjs",
    category: "Caching",
    difficulty: "hard",
    question:
      "Explain the caching layers behind a Next.js App Router request and how revalidation changes what a user sees. Which parts are version-dependent?",
    idealAnswer:
      "There are several distinct caches: the data cache for fetch/DB results, the full route cache of prerendered HTML and RSC payloads, the client-side router cache for visited routes, and any CDN in front. A statically rendered route is computed at build time and served from the full route cache until revalidated; dynamic rendering happens per request. Revalidation is triggered by time (revalidate: 60), by tag (revalidateTag('products') after a mutation) or by path, and the next request regenerates in the background. Client-side, a short-lived router cache decides whether navigating back refetches. Exact names, defaults and opt-in flags changed across Next 13/14/15, so confirm against the docs for your version.",
    explanation:
      "The model that stays useful: caching avoids recomputing per request, so correctness depends on knowing who invalidates what. Static rendering plus tags gives cheap pages and precise invalidation — render statically, attach a tag, call revalidateTag after the write, and the next visitor triggers a background regeneration while everyone else keeps the fast cached copy. Watch the failure modes: caching user-specific data in a shared route cache leaks one user's data to another (avoid it by reading cookies/headers so the route renders dynamically), and 'stale forever' pages usually mean a mutation path forgot to revalidate. Revalidation is lazy or background, not a queue you control, so do not expect instant global visibility unless you also update the client.",
    code: `// Per-request validity + tag-based invalidation
const products = await fetch(\`\${API}/products\`, {
  next: { revalidate: 60, tags: ["products"] },
});

// After a write, invalidate precisely
"use server";
export async function updateProduct(id: string, data: ProductInput) {
  await db.product.update({ where: { id }, data });
  revalidateTag("products");       // or revalidatePath("/products")
}

// User-specific data must not land in a shared route cache
import { cookies } from "next/headers";
const session = (await cookies()).get("session"); // route becomes dynamic`,
    tags: ["caching", "revalidation", "isr", "app router"],
    followUps: [
      "Why does reading cookies or headers make a route dynamic, and what does that cost?",
      "How would you keep a cached listing page fresh within seconds of a write?",
    ],
    interviewTip:
      "Say up front that layer names and defaults move between versions, then describe the invalidation model. Interviewers respect 'verify per version' over a confidently wrong detail.",
    concepts: ["data cache", "full route cache", "tag revalidation", "dynamic rendering"],
  },
  {
    id: "nextjs-server-actions",
    topic: "nextjs",
    category: "App Router",
    difficulty: "medium",
    question:
      "What are Server Actions, when do they replace an API route, and what are their limits around validation, error handling and calling from outside your app?",
    idealAnswer:
      "A Server Action is an async function marked 'use server' that the client can call directly — Next turns it into an HTTP POST endpoint automatically. They replace hand-written routes for mutations that belong to your UI: form submissions with progressive enhancement (action={fn} works without JS), optimistic updates paired with revalidatePath/revalidateTag, and redirect-after-mutate flows. Limits: they are not a public API — no stable contract for mobile clients or third parties, so anything consumed outside your app still needs a route handler. Inputs cross the network, so every action must validate its arguments (zod) and authorize the caller; errors need explicit handling because the client receives a serialized result, not your thrown stack; and long-running work belongs in a job, not an action, since actions run inside the request lifecycle.",
    explanation:
      "Server Actions collapse the client-fetch-handler round trip into one typed function, which removes a class of glue code and keeps the mutation next to the revalidation. Under the hood each action is a POST to the same route with an action id, so the usual HTTP considerations apply: they can be replayed, so idempotency still matters; they run with the caller's cookies, so authorization is on you; and they should not be exposed on GET-able pages expecting crawlers. Progressive enhancement is the differentiator: a plain form with a server action submits without JavaScript, which route-handler-plus-fetch flows cannot do. Where they fit poorly: file streaming responses, third-party APIs, webhooks, and anything needing precise status codes — route handlers remain the right tool. Version note: behavior and caching semantics around actions have changed across releases, so verify against your version's docs.",
    code: `"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateItem = z.object({ name: z.string().min(1).max(100) });

export async function createItem(formData: FormData) {
  const parsed = CreateItem.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Invalid name" };

  await db.item.create({ data: parsed.data });
  revalidatePath("/items");            // fresh list on next render
  return { ok: true };
}

// Client component
<form action={createItem}> <input name="name" /> <button>Add</button> </form>
// Works without JavaScript: the form posts and the server responds with rendered HTML`,
    tags: ["server actions", "mutations", "forms", "revalidation"],
    followUps: [
      "Why do Server Actions need input validation even though the function is typed?",
      "When would you keep a route handler instead of a Server Action?",
    ],
    interviewTip:
      "Frame them as typed mutation glue with progressive enhancement built in, then immediately list the limits — public API boundaries, validation, authorization. Knowing the limits reads as production experience.",
    concepts: ["server actions", "progressive enhancement", "revalidation"],
  },  {
    id: "nextjs-rendering-strategies",
    topic: "nextjs",
    category: "Rendering Strategies",
    difficulty: "medium",
    question:
      "For a product page, a search results page, and a user dashboard, which rendering strategy would you choose in Next.js and why?",
    idealAnswer:
      "Product page: static generation with tag-based revalidation — the content is identical for all visitors, changes rarely, and a revalidateTag on product update gives near-fresh content at CDN speed. Search results: dynamic rendering per request (or even client-side) because the response depends on query parameters and freshness matters more than latency; caching per-query is a cache-key explosion. User dashboard: dynamic, personalized rendering — read the session server-side so the route never lands in a shared cache, fetch user-specific data during server render, and keep highly interactive widgets in client components with their own data fetching. The decision rule: who sees this content, how often it changes, and what latency the user will forgive.",
    explanation:
      "Static wins when content is shared and stable: cost approaches zero per request and TTFB is CDN-fast, which is why marketing and product pages are the textbook case. The nuance is staleness tolerance — a price change appearing five minutes late may be unacceptable, which is where on-demand revalidation beats time-based (you control freshness at the mutation, not with a TTL guess). Dynamic rendering costs a compute round trip per request, so its defense is good data-layer latency and streaming: Suspense boundaries let the shell render immediately while slow widgets stream in, so perceived latency stays low even when the slowest widget is slow. Personalized pages have a subtle trap: caching any fragment that depends on the user leaks data across sessions, so user-specific fragments either render dynamically or cache with a user-scoped key. Hybrid is normal: one page can be static, stream personalized sections, and mount client components that fetch on interaction.",
    code: `// Product: static + on-demand revalidation
export const revalidate = false; // static until tag invalidated
const product = await fetch(\`.../products/\${id}\`, { next: { tags: [\`product:\${id}\`] } });

// Search: always fresh, per request
export const dynamic = "force-dynamic";
const results = await search(params.q); // depends on query params

// Dashboard: session-aware dynamic render with streamed slow panels
const session = await auth();          // makes the route dynamic
return (
  <>
    <Summary data={await getSummary(session.userId)} />   {/* fast */}
    <Suspense fallback={<ChartSkeleton />}>
      <Charts userId={session.userId} />                 {/* streams in */}
    </Suspense>
  </>
);`,
    tags: ["rendering strategies", "static generation", "dynamic rendering", "streaming"],
    followUps: [
      "How does streaming with Suspense change perceived performance on a dynamic page?",
      "What is the risk of caching personalized content, and how do you avoid it?",
    ],
    interviewTip:
      "Give a decision rule first (audience, freshness, latency tolerance), then map each page to it. Saying why the dashboard must not share a cache entry shows you understand the security dimension of rendering choices.",
    concepts: ["static vs dynamic", "on-demand revalidation", "streaming SSR", "cache scoping"],
  },
  {
    id: "nextjs-route-handlers-middleware",
    topic: "nextjs",
    category: "Routing & Middleware",
    difficulty: "easy",
    question:
      "What are Route Handlers in the App Router, when do you need them if Server Components can fetch data directly, and what does middleware do?",
    idealAnswer:
      "Route Handlers (route.ts files exporting GET/POST/etc.) define HTTP endpoints inside the app — the backend for client-side fetches, webhooks, third-party callbacks, and anything a non-browser client calls. You still need them even though server components can fetch data directly, because server components only serve your own rendering: a mobile app, a partner integration, or a Stripe webhook needs a real HTTP endpoint. Middleware is different: it runs before routing on every matching request and is for cross-cutting request logic — auth redirects, A/B cookie assignment, header rewriting, geo-based routing — not for handling the request itself. Middleware runs on the edge runtime with limited APIs, so it should be fast and stateless and delegate real work to routes and actions.",
    explanation:
      "The mental split: route handlers = responses, middleware = routing decisions. Middleware cannot return your page's data (except with rewrites) but can short-circuit with a redirect or rewrite, which is exactly what auth gates need — check a session cookie, redirect to /login before any rendering starts. Route handlers replace the pages-router /pages/api directory and participate in the same caching semantics as the rest of the app: a GET handler can be cached (method and configuration dependent per version), while POST/PUT/DELETE are always dynamic. Common production uses: POST /api/webhooks/stripe with signature verification, /api/revalidate called with a secret after a CMS publish, and JSON endpoints for client components that poll. Because handlers are full HTTP, they also own what server components get for free: status codes, headers, and non-HTML content types.",
    code: `// app/api/webhooks/stripe/route.ts — a real HTTP endpoint
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const event = stripe.webhooks.constructEvent(await req.text(), sig!, secret);
  await handleEvent(event);
  return Response.json({ received: true });
}

// middleware.ts — routing decisions before rendering
export function middleware(req: NextRequest) {
  if (!req.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
export const config = { matcher: ["/dashboard/:path*"] };`,
    tags: ["route handlers", "middleware", "webhooks", "edge runtime"],
    followUps: [
      "Why should middleware stay stateless and fast, and what belongs there vs in a route handler?",
      "How would you secure a revalidation endpoint that a CMS calls?",
    ],
    interviewTip:
      "Open with the one-line split — handlers respond, middleware routes — then give a concrete example of each (webhook, auth redirect). That framing answers the 'do we still need API routes?' part directly.",
    concepts: ["route handlers", "middleware", "request lifecycle"],
  },
];
      
