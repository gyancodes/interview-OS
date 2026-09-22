import type { Question } from "@/lib/types";

export const typescriptQuestions: Question[] = [
  {
    id: "ts-typesystem-structural",
    topic: "typescript",
    category: "Type System",
    difficulty: "medium",
    question:
      "TypeScript is structurally typed. Explain what that means, and show a case where structural typing accepts something you did not intend.",
    idealAnswer:
      "Types are compared by shape, not by name or declaration site: if a value has all the required members with compatible types, it is assignable. So two unrelated interfaces with the same members are interchangeable. The classic surprise is that a function expecting a narrower parameter accepts a wider one, because parameter bivariance lets { a, b } be passed where { a } is expected — and object literals bypass freshness checks only when assigned through a variable, so 'excess property' errors disappear after one hop. Structural typing also lets accidental 'brand' collisions happen: two different IDs that are both `string` are interchangeable, which is what branded types fix.",
    explanation:
      "The compiler computes compatibility by walking members recursively, so declaration identity is irrelevant — which is why you can write a type for a library you do not control (structural mocks, duck typing). Consequences worth knowing: `interface Foo { a: string }` and `interface Bar { a: string }` are mutually assignable; classes with private fields are nominally compatible only if they come from the same declaration, because private members must originate in one class; excess property checks only run on fresh object literals, so assigning through an intermediate variable is a common silent widening; and functions are checked bivariantly for method-style parameters unless `strictFunctionTypes` (on with strict) makes function-typed properties contravariant. Branded types use a phantom intersection (string & { __brand: 'UserId' }) so the compiler distinguishes values that are the same at runtime.",
    code: `interface Point { x: number; y: number }
interface Vec { x: number; y: number }

const p: Point = { x: 1, y: 2 };
const v: Vec = p; // OK: identical shape, different names

// Excess property checks only apply to fresh literals
const wide = { x: 1, y: 2, extra: true };
const point: Point = wide; // OK (no freshness check)

// Branded type prevents accidental mixing of ids
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };
declare const userId: UserId;
// const order: OrderId = userId; // Error: not assignable`,
    tags: ["structural typing", "assignability", "branded types"],
    followUps: [
      "Why do classes with private fields behave nominally?",
      "What does strictFunctionTypes change about function parameters?",
    ],
    interviewTip:
      "Define structural typing in one sentence, then prove it with the two-interface example. Add branded types as the production consequence — that is what makes it more than trivia.",
    concepts: ["structural typing", "excess property checks", "variance"],
  },
  {
    id: "ts-generics-keyof",
    topic: "typescript",
    category: "Generics",
    difficulty: "medium",
    question:
      "Explain this signature: function get<T, K extends keyof T>(obj: T, key: K): T[K]. What does each part mean, and why is the return type not just T[keyof T]?",
    idealAnswer:
      "T is inferred from the argument and stays an open generic instead of widening to a union. K extends keyof T is a constraint, not inheritance: it says K must be one of T's property names, so passing a bad key is a compile error. T[K] is an indexed access type, so the return type is the specific property type for the key that was passed. Returning T[keyof T] would be the union of all property types, losing the link between key and value and forcing every caller to narrow. The pair T and K is what makes the function's output depend on the input.",
    explanation:
      "Two mechanisms do the work. Constraints restrict what can be inferred for a type parameter, so `keyof T` acts as a union of literal property names; indexed access `T[K]` then projects that narrowed key back onto the object type. This is the shape of the standard library: Pick, Omit, Record, and libraries like Zod or Prisma all lean on `T[K]` plus mapped types. Practical details: inference order matters (T is inferred from obj first), `as const` on the key preserves string literals so K inference does not widen to string, and when T is a union of objects `T[K]` distributes over the union, which is usually what you want for heterogeneous results. A common misconception is that generics are runtime features — they are erased completely, so they can only describe relationships the compiler already knows.",
    code: `function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "ana", active: true };
const name = get(user, "name");   // string
const id = get(user, "id");       // number
// get(user, "email");            // Error: not assignable to keyof T

// Widened without a constraint:
function loose<T>(obj: T, key: keyof T): T[keyof T] {
  return obj[key]; // returns number | string | boolean
}`,
    tags: ["generics", "keyof", "indexed access", "constraints"],
    followUps: [
      "How do mapped types build on indexed access?",
      "Why does `as const` change generic inference for string keys?",
    ],
    interviewTip:
      "Walk through it parameter by parameter and contrast with T[keyof T] — that contrast is exactly the reasoning an interviewer wants to see.",
    concepts: ["type constraints", "indexed access", "inference"],
  },
  {
    id: "ts-narrowing-discriminated",
    topic: "typescript",
    category: "Narrowing",
    difficulty: "medium",
    question:
      "How does TypeScript narrow a union type, and why are discriminated unions the recommended pattern for modeling states like loading/success/error?",
    idealAnswer:
      "Narrowing is control-flow analysis: the compiler tracks checks and assignments, so within an if/else or switch, the type of a variable is the branch of the union consistent with the checks. Discriminated unions make this reliable by giving every member a shared literal tag field (kind: 'loading' | 'success' | 'error'), so a switch on kind narrows every other field precisely — data only exists on success, error only on error. Compared with optional fields (data?: T, error?: E), illegal states are unrepresentable: you cannot have data set while status is 'loading', and exhaustive switches with a never check force every new state to be handled at compile time.",
    explanation:
      "The compiler's CFA narrows via typeof, instanceof, in, equality on literal types, truthiness, and user-defined type predicates (x is Foo) and assertion functions. Truthiness narrowing has sharp edges: an empty string or 0 is falsy, so `if (value)` on a `string | null` also drops empty strings — use `value !== null` instead. Discriminated unions compose with exhaustiveness: `default: const _exhaustive: never = state;` turns 'forgot a case' into a compile error, which is why Redux, XState and API-result modeling all use them. Misconception: any property can be the discriminant — it must be a literal-typed field present on every member for the compiler to use it in the switch. For async flows, model the state machine explicitly (idle/loading/success/error) rather than booleans like isLoading plus isError plus data — the boolean-combination explosion is where bugs live.",
    code: `type Result<T> =
  | { kind: "loading" }
  | { kind: "success"; data: T }
  | { kind: "error"; message: string };

function render<T>(state: Result<T>): string {
  switch (state.kind) {
    case "loading": return "spinner";      // no .data here
    case "success": return state.data;     // narrowed
    case "error":  return state.message;   // narrowed
    default: {
      const _exhaustive: never = state;    // compile error if a case is missed
      return _exhaustive;
    }
  }
}`,
    tags: ["narrowing", "discriminated unions", "exhaustiveness"],
    followUps: [
      "What is a type predicate and when would you write one?",
      "Why is truthiness narrowing risky with numbers and strings?",
    ],
    interviewTip:
      "Show the loading/success/error union, point at what each branch can and cannot touch, and mention the never check. It demonstrates both language knowledge and design taste.",
    concepts: ["control flow analysis", "tagged unions", "exhaustiveness checking"],
  },
  {
    id: "ts-unknown-vs-any",
    topic: "typescript",
    category: "Type Safety",
    difficulty: "easy",
    question:
      "What is the difference between unknown and any, and why do most style guides ban any at boundaries like JSON.parse?",
    idealAnswer:
      "any disables checking: you can call, index and assign anything to and from it, and errors surface only at runtime. unknown is the safe top type — it accepts every value but permits no operations until you narrow it (typeof, instanceof, a type guard, or an explicit schema parse). At trust boundaries like JSON.parse or fetch responses, the data has no verified shape, so unknown forces validation, while any silently accepts whatever the API sends and moves the failure downstream. unknown is also a one-way door in the good sense: you must narrow before use, which documents where assumptions enter the codebase.",
    explanation:
      "The runtime story is that JSON.parse returns any in the standard lib — a design decision predating unknown — so real projects wrap boundaries: a zod/valibot parse, or hand-written type guards, so the rest of the program deals in verified types. Assignability differences: any is assignable to and from everything and spreads its unsafety through inference (a function returning any poisons callers); unknown is assignable from everything but to nothing except itself/any, so it contains the risk. Misconception: unknown is 'strict any' with a runtime cost — it has none, it is purely compile-time. Also know as-unknown-as-T double assertions and why they are a smell: they defeat exactly the protection unknown provides.",
    code: `const data: unknown = JSON.parse(raw);

// any: compiles, explodes at runtime
// data.foo.bar();

// unknown: must prove the shape
if (typeof data === "object" && data !== null && "id" in data) {
  const id = (data as { id: unknown }).id;
  if (typeof id === "number") console.log(id);
}

// Better: validate at the boundary once
const parsed = UserSchema.parse(data); // zod-style, typed result`,
    tags: ["unknown", "any", "runtime validation", "boundaries"],
    followUps: [
      "When is as-unknown-as-T justified, if ever?",
      "How does a type guard differ from a type assertion?",
    ],
    interviewTip:
      "Frame it as trust: any means 'trust me', unknown means 'prove it'. One sentence about validating at the network boundary makes the answer production-flavored.",
    concepts: ["top types", "runtime validation", "type assertions"],
  },
  {
    id: "ts-utility-types-pick-omit",
    topic: "typescript",
    category: "Utility Types",
    difficulty: "medium",
    question:
      "How do Pick, Omit, Partial and Record work internally, and how would you combine them to keep a form type in sync with its API model?",
    idealAnswer:
      "They are mapped types. Pick<T, K> = { [P in K]: T[P] } keeps only the listed keys; Omit<T, K> is Pick<T, Exclude<keyof T, K>> — a subtraction built on Pick; Partial<T> = { [P in keyof T]?: T[P] } makes every property optional; Record<K, V> = { [P in K]: V } builds an object from a key union. For a form derived from an API model you write type EditUser = Partial<Pick<User, 'name' | 'email'>> — the form type is derived, so adding a field to the model flows through, and the compiler flags places that need updating. Deriving types from one source of truth instead of declaring them twice is the whole point of utility types.",
    explanation:
      "Mapped types iterate keys of a type and produce a new shape, optionally with modifiers: ? (Partial), readonly (Readonly), or removing them (-readonly, -?). Homomorphic mapped types (over keyof T) preserve modifiers automatically, which is why Partial keeps existing optionality. Practical patterns: Omit<User, 'passwordHash'> for API responses; RequireId<T> = T & { id: string } intersection for database rows; ReturnType<typeof fn> and Awaited<ReturnType<typeof fn>> for a function's result without declaring it twice. Caveats: Omit distributes over keys naively, so Omit on a union collapses it — use a distributive Omit if needed; and very deep utility types hurt compile times and editor performance, so keep derivation shallow where the code is hot.",
    code: `interface User { id: string; name: string; email: string; passwordHash: string }

type PublicUser = Omit<User, "passwordHash">;
type LoginForm = Pick<User, "email" | "passwordHash">; // reuse + narrow
type EditableUser = Partial<Pick<User, "name" | "email">>;
type UsersById = Record<User["id"], User>;            // lookup map

// Custom utility: make selected keys required
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };`,
    tags: ["utility types", "mapped types", "type derivation"],
    followUps: [
      "What makes a mapped type homomorphic, and why does it matter for modifiers?",
      "How do ReturnType and Awaited compose for async functions?",
    ],
    interviewTip:
      "Show that you know they are just mapped types by writing Pick from memory, then pivot to the real skill: deriving types from one source of truth so the compiler keeps them in sync.",
    concepts: ["mapped types", "keyof", "modifiers"],
  },
];
