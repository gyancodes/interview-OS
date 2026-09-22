import type { TopicId } from "@/lib/types";

export const TRACKS = [
  "Languages",
  "Frontend",
  "Backend",
  "Platform & DevOps",
  "Architecture",
  "Practice Sets",
] as const;

export type Track = (typeof TRACKS)[number];

export interface Topic {
  id: TopicId;
  name: string;
  tagline: string;
  track: Track;
  categories: string[];
}

/**
 * Topic catalogue. `categories` drive the practice filters, the weak-area
 * grouping and the AI prompt context.
 */
export const TOPICS: Topic[] = [
  {
    id: "javascript",
    name: "JavaScript",
    tagline: "Language semantics, scope, async and the event loop.",
    track: "Languages",
    categories: [
      "Fundamentals",
      "Scope",
      "Closures",
      "Functions",
      "Objects",
      "Prototypes",
      "this",
      "Async JavaScript",
      "Promises",
      "Event Loop",
      "Modules",
      "Browser APIs",
      "Performance",
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    tagline: "Structural typing, generics and keeping the type system honest.",
    track: "Languages",
    categories: [
      "Type System",
      "Generics",
      "Narrowing",
      "Utility Types",
      "Type Safety",
      "Modules & Config",
    ],
  },
  {
    id: "nodejs",
    name: "Node.js",
    tagline: "Runtime internals, streams, concurrency and stability.",
    track: "Backend",
    categories: [
      "Runtime",
      "Event Loop",
      "Streams",
      "Buffers",
      "Modules",
      "HTTP",
      "Async programming",
      "Performance",
      "Worker Threads",
      "Clustering",
      "Error handling",
    ],
  },
  {
    id: "express",
    name: "Express",
    tagline: "Routing, middleware order, validation and error handling.",
    track: "Backend",
    categories: [
      "Routing",
      "Middleware",
      "Error Handling",
      "Request Lifecycle",
      "Validation",
      "Security",
    ],
  },
  {
    id: "backend",
    name: "Backend",
    tagline: "APIs, auth, databases, caching, queues and reliability.",
    track: "Backend",
    categories: [
      "REST APIs",
      "Authentication",
      "Authorization",
      "Databases",
      "Caching",
      "Redis",
      "Queues",
      "Rate limiting",
      "Scaling",
      "Load balancing",
      "Observability",
      "Reliability",
      "Security",
    ],
  },
  {
    id: "react",
    name: "React",
    tagline: "Rendering model, hooks, state and performance.",
    track: "Frontend",
    categories: [
      "Rendering",
      "Hooks",
      "State Management",
      "Performance",
      "Component Design",
      "Data Fetching",
    ],
  },
  {
    id: "nextjs",
    name: "Next.js",
    tagline: "App Router, server components, caching and rendering strategies.",
    track: "Frontend",
    categories: [
      "App Router",
      "Server & Client Components",
      "Data Fetching",
      "Rendering Strategies",
      "Caching",
      "Routing & Middleware",
    ],
  },
  {
    id: "fullstack",
    name: "Full Stack",
    tagline: "Joining frontend, API and data layer without leaking abstractions.",
    track: "Practice Sets",
    categories: [
      "API Design",
      "Authentication",
      "Data Modeling",
      "Deployment",
      "Performance",
      "Debugging",
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    tagline: "Linux, networking, containers, CI/CD and observability.",
    track: "Platform & DevOps",
    categories: [
      "Linux",
      "Networking",
      "Docker",
      "CI/CD",
      "Kubernetes",
      "Cloud",
      "Monitoring",
      "Logging",
      "Infrastructure",
      "Deployment",
    ],
  },
  {
    id: "system-design",
    name: "System Design",
    tagline: "Scalability, storage choices, reliability and tradeoffs.",
    track: "Architecture",
    categories: [
      "Fundamentals",
      "Scalability",
      "Storage & Data",
      "Reliability",
      "Tradeoffs",
      "Case Studies",
    ],
  },
];

export const TOPIC_MAP: Record<TopicId, Topic> = TOPICS.reduce(
  (acc, topic) => {
    acc[topic.id] = topic;
    return acc;
  },
  {} as Record<TopicId, Topic>,
);

export const TOPIC_NAMES: Record<TopicId, string> = TOPICS.reduce(
  (acc, topic) => {
    acc[topic.id] = topic.name;
    return acc;
  },
  {} as Record<TopicId, string>,
);

export function getTopic(topicId: TopicId): Topic {
  return TOPIC_MAP[topicId];
}

export function isTopicId(value: unknown): value is TopicId {
  return typeof value === "string" && value in TOPIC_MAP;
}

export function topicsByTrack(): { track: Track; topics: Topic[] }[] {
  return TRACKS.map((track) => ({
    track,
    topics: TOPICS.filter((topic) => topic.track === track),
  })).filter((group) => group.topics.length > 0);
}
