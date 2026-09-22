import type { Question } from "@/lib/types";

export const javascriptQuestions: Question[] = [
  {
    id: "js-fundamentals-eq",
    topic: "javascript",
    category: "Fundamentals",
    difficulty: "easy",
    question:
      "What is the difference between == and ===? Give one case where == surprises people and one case where it is genuinely useful.",
    idealAnswer:
      "=== compares without coercion, so mismatched types are simply false (NaN === NaN is false; use Object.is for that case). == runs the abstract equality algorithm: same types fall back to strict comparison, null and undefined only match each other, number vs string converts the string, and booleans are always converted to numbers first. That is why [] == false is true: [] becomes \"\" which becomes 0, and false becomes 0. The one idiomatic use is `value == null`, which is the only single check that catches both null and undefined.",
    explanation:
      "Abstract equality is a spec table of type pairs, not 'coerce the left to the right type'. Objects are converted with ToPrimitive (valueOf first, then toString), which is how a custom valueOf can make an object equal to a number. Booleans converting to numbers is the source of most surprises, including null == 0 being false while null == undefined is true. Misconceptions: that == is undefined behaviour (it is well specified, just easy to misuse) and that it always coerces one operand to the other's type. In application code === is the default because it makes type assumptions explicit; ESLint's eqeqeq with the null exception is a good middle ground.",
    code: `0 == "0";           // true  (string -> number)
0 == "";            // true  ("" -> 0)
[] == false;        // true  ([] -> "" -> 0, false -> 0)
null == undefined;  // true  (special case)
null == 0;          // false
NaN === NaN;        // false -> use Number.isNaN / Object.is`,
    tags: ["coercion", "equality", "type conversion"],
    followUps: [
      "When would you use Object.is instead of ===?",
      "How does valueOf let an object compare equal to a primitive?",
    ],
    interviewTip:
      "Describe the two algorithms instead of saying '=== is safer', then give one concrete surprise. Mentioning `value == null` shows you understand the algorithm rather than memorised a rule.",
    concepts: ["abstract equality", "ToPrimitive", "coercion"],
  },
  {
    id: "js-modules-esm-cjs",
    topic: "javascript",
    category: "Modules",
    difficulty: "easy",
    question:
      "What are the practical differences between ES modules and CommonJS, and why does the distinction still matter in 2026?",
    idealAnswer:
      "ES modules are statically linked: import specifiers are resolved before execution, exports are live read-only bindings, and cycles work because declarations are hoisted. CommonJS is dynamic: require() is a runtime call, module.exports is a plain object assembled as the file runs, and consumers get a value snapshot at require time. ESM is always strict mode and supports top-level await; CommonJS is not strict by default. It still matters because Node, bundlers and browsers all prefer ESM now, so libraries ship ESM with a CJS fallback, and mixing them changes how your code is loaded, tree-shaken and evaluated.",
    explanation:
      "The difference is when the module graph is known. Because ESM imports cannot be computed at runtime, bundlers can drop unused exports (tree shaking) and detect cycles before executing code; with CommonJS the whole module must run before you know what it exports, so tooling falls back to whole-file inclusion. Live bindings vs snapshots is the other practical consequence: an ESM importer sees a later reassignment of an exported `let`, while destructuring a CommonJS export captures the value at that moment — the classic circular-require bug where you get undefined. Interop details to know: importing CJS from ESM gives module.exports as default, `__dirname`/`require` do not exist in ESM, and package.json `type` plus the `exports` field decide what a consumer resolves.",
    code: `// CommonJS: value captured at require time
// counter.js
exports.count = 0;
setTimeout(() => { exports.count = 5; }, 10);
// main.js
const counter = require("./counter");
setTimeout(() => console.log(counter.count), 50); // 5 (property read)

// ESM: live binding, later writes are visible
export let count = 0;
setTimeout(() => { count = 5; }, 10);`,
    tags: ["esm", "commonjs", "modules", "tree shaking", "interop"],
    followUps: [
      "How does top-level await affect when a module's importers run?",
      "Why can a circular CommonJS require return undefined?",
    ],
    interviewTip:
      "Frame it as static vs dynamic linking and mention tree shaking plus live bindings. That is the level of detail that reads as real production experience.",
    concepts: ["static linking", "live bindings", "interop"],
  },
  {
    id: "js-scope-hoisting",
    topic: "javascript",
    category: "Scope",
    difficulty: "medium",
    question:
      "Explain hoisting and the temporal dead zone. Why does var read as undefined before assignment while let throws a ReferenceError?",
    idealAnswer:
      "Before executing a scope, the engine instantiates it: function declarations are initialised immediately with their implementation, var bindings are created and set to undefined, and let/const/class bindings are created but left uninitialised. Accessing an uninitialised binding throws a ReferenceError — the window between scope entry and the declaration executing is the temporal dead zone. So hoisting is not code being moved: declarations are registered early, initialisation happens where you wrote it. var is function-scoped, which is why loop callbacks with var share one binding, while let/const are block-scoped and per-iteration in loops.",
    explanation:
      "Scopes are environment records. At instantiation the engine collects declarations: var bindings live in the function or global record with the value undefined, while let and const go into the declarative record marked uninitialised (V8 uses an internal hole sentinel). Function declarations are fully hoisted, so they can be called before their textual position. Because let is block-scoped, each loop iteration gets a fresh binding, which is why closures capture the right counter. Misconceptions: that hoisting moves code (it does not, and const only prevents reassignment of the binding, not mutation of the value) and that the TDZ is just style — it exists to turn use-before-initialisation bugs into immediate errors. Function declarations inside blocks are block-scoped in strict mode but keep legacy sloppy-mode behaviour.",
    code: `console.log(a); // undefined (var initialised to undefined)
var a = 1;

try {
  console.log(b); // ReferenceError: Cannot access 'b' before initialization
} catch (error) {
  console.error(error.message);
}
let b = 2;

for (var i = 0; i < 3; i++) setTimeout(() => console.log("var", i)); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log("let", j)); // 0 1 2`,
    tags: ["hoisting", "tdz", "scope", "var vs let"],
    followUps: [
      "Why does `typeof undeclaredVariable` work but `typeof letInTdz` throw?",
      "How does block scoping change the behaviour of closures created inside loops?",
    ],
    interviewTip:
      "Say 'declarations are registered at instantiation, initialisation happens at the declaration' — that one sentence proves you know the mechanism instead of the slogan.",
    concepts: ["environment record", "temporal dead zone", "block scope"],
  },
  {
    id: "js-closures",
    topic: "javascript",
    category: "Closures",
    difficulty: "medium",
    question:
      "What is a closure? Then explain why this loop logs 3, 3, 3 and how you would fix it without changing var to let.",
    idealAnswer:
      "A closure is a function together with the lexical environment where it was created: it keeps access to those variable bindings after the outer function has returned. Here var creates a single function-scoped binding i, and all three arrow functions close over that same binding. By the time the timers fire the loop has finished, so all three read i === 3. Fix it by giving each callback its own binding: an IIFE that takes i as a parameter, forEach (a fresh parameter per call), or binding the value explicitly. Arrow functions cannot be rebound with bind, so with arrows you need a factory function.",
    explanation:
      "A function object holds an internal [[Environment]] reference to the environment record where it was defined, so captured variables live in heap-allocated records rather than on a stack frame that dies on return — that is why the values survive. Closures capture bindings, not values: two closures from the same call share writes to the same binding, which is the source of most closure bugs (shared counters, stale React state read inside a handler). Real usage: module-private state, memoisation caches, debounce and throttle timers, function factories, partial application. Any variable referenced by a live closure is retained, so a long-lived handler that captures a large object is a common leak in Node and the browser — fix by narrowing what the closure captures.",
    code: `// Broken: one shared binding
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3

// Fixed with a factory, keeping var
for (var i = 0; i < 3; i++) {
  (function (n) {
    setTimeout(() => console.log(n));
  })(i);
}

// Fixed with forEach: a fresh parameter per iteration
[0, 1, 2].forEach((n) => setTimeout(() => console.log(n)));`,
    tags: ["closures", "scope", "event loop", "memory"],
    followUps: [
      "Why does a debounce implementation require a closure?",
      "How can a closure cause a memory leak in a long-lived event handler?",
    ],
    interviewTip:
      "Answer in two halves: the definition, then the concrete loop bug. Explaining that closures capture bindings is what separates a memorised answer from real understanding.",
    concepts: ["lexical environment", "shared bindings", "IIFE"],
  },
  // --- Additional seed questions ---
  {
    id: "js-closures-counter",
    topic: "javascript",
    category: "Closures",
    difficulty: "medium",
    question:
      "In the loop `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))`, what prints and why? Give two ways to fix it and explain what each does internally.",
    idealAnswer:
      "It prints 3, 3, 3. `var` declares one function-scoped binding, so all three callbacks close over the same `i`, which is 3 by the time the timers fire. Fix 1: use `let` in the loop head — that creates a fresh binding per iteration, so each closure captures its own copy. Fix 2: wrap the body in an IIFE `(function(j) { setTimeout(() => console.log(j)) })(i)` — the inner function parameter is a new binding per call. Both work because closures capture variable bindings, not values.",
    explanation:
      "This is the canonical demonstration that closures capture the environment (the binding), not a snapshot of the value. `var` is hoisted to the function scope and reused across iterations; `let` in a for-head creates a per-iteration lexical environment (the spec copies the binding forward each iteration). The callback queue means the synchronous loop finishes before any timer runs, so by execution time the shared binding is 3. Common misconception: that setTimeout 'sees the old value' or that the delay matters — removing the timeout entirely still logs 3,3,3 because the timing is irrelevant; only the binding matters.",
    code: `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2

// Fix 2: IIFE creates a new function scope per iteration
for (var k = 0; k < 3; k++) {
  ((n) => setTimeout(() => console.log(n)))(k); // 0 1 2
}`,
    tags: ["closures", "var vs let", "event loop"],
    followUps: [
      "If we replaced setTimeout with Promise.resolve().then, would the output change?",
      "Where does the per-iteration binding for `let` live in memory?",
    ],
    interviewTip:
      "Lead with the mechanism — 'closures capture bindings, not values' — then give both fixes and say exactly why each works. That one sentence structure covers scope, closures and the event loop in one answer.",
    concepts: ["closures", "lexical scope", "hoisting"],
  },
  {
    id: "js-eventloop-microtasks",
    topic: "javascript",
    category: "Event Loop",
    difficulty: "medium",
    question:
      "Given a snippet mixing a synchronous log, a Promise.then, a queueMicrotask, a setTimeout(0) and an await, predict the output order and explain the rules that determine it.",
    idealAnswer:
      "Order: synchronous code first (the whole script runs to completion), then microtasks — promise reactions and queueMicrotask, in FIFO order — then the timer callback as a macrotask. `await` is syntax for promise chaining: everything after an await in an async function runs as a microtask continuation. The rules are: one macrotask (script, timer, I/O) runs at a time; when its stack empties, the entire microtask queue drains before the next macrotask; new microtasks created during the drain are processed in the same drain.",
    explanation:
      "The event loop alternates between running one macrotask and draining the microtask queue to completion. That 'drain to completion' rule is why an unbounded .then chain can starve timers in Node. await desugars to .then on the awaited value, so the continuation is queued as a microtask when the awaited promise settles — if you await an already-resolved promise, the continuation still runs asynchronously, never inline. Common misconception: setTimeout(fn, 0) runs 'after promises' vaguely — precisely, it is a new macrotask scheduled in the timer phase, so any microtask queued in the meantime runs first. Browser rendering also interleaves: the browser may paint between macrotasks, which is why long microtask chains block paint.",
    code: `console.log("1 script");
setTimeout(() => console.log("4 timeout"), 0);
Promise.resolve().then(() => console.log("3 promise"));
queueMicrotask(() => console.log("3 microtask"));
(async () => { await null; console.log("3 await"); })();
console.log("2 end of script");
// 1 script, 2 end of script, 3 promise, 3 microtask, 3 await, 4 timeout`,
    tags: ["event loop", "microtasks", "await"],
    followUps: [
      "How could a microtask chain block rendering in the browser?",
      "What is the difference between queueMicrotask and setTimeout(fn, 0)?",
    ],
    interviewTip:
      "State the two rules crisply — run-to-completion per macrotask, full microtask drain between them — then walk the snippet. Mentioning that await desugars to then shows you understand the mechanics, not just the mnemonic.",
    concepts: ["event loop", "microtask queue", "async/await semantics"],
  },
  {
    id: "js-this-binding",
    topic: "javascript",
    category: "this",
    difficulty: "medium",
    question:
      "How is `this` determined in JavaScript? Walk through the precedence: default binding, implicit binding, explicit binding, new binding, and arrow functions.",
    idealAnswer:
      "`this` is set by how a function is called, not where it is defined. Precedence from strongest: `new` binds this to the freshly created object; explicit binding (call/apply/bind, and class context) sets it to the given argument; implicit binding — obj.method() sets this to obj; default binding — a bare call gets undefined in strict mode or globalThis otherwise. Arrow functions are the exception: they have no own this and lexically capture the enclosing scope's this, so call/apply cannot change it. In class methods, this is whatever precedes the call, which is why extracting a method and passing it as a callback loses the instance.",
    explanation:
      "The binding rules evaluate at call time: the runtime looks at the call site — was there a new, a .method access, a call/bind, or nothing? Method extraction (`const m = obj.method; m()`) falls back to default binding and is the most common real-world bug, fixed by bind, an arrow wrapper, or class fields using arrow functions. Misconceptions: that this relates to the function's lexical location (that's only true for arrows), or that bind 'permanently' sets this (bind returns a new function; the original is untouched). Modules and strict mode make the default binding undefined instead of globalThis, which surfaces these bugs earlier.",
    code: `class Counter {
  count = 0;
  // Class field arrow: this is lexically the instance
  increment = () => { this.count++; };
}
const c = new Counter();
const detached = c.increment;   // no loss — arrow captured this
detached();

function regular() { return this; }
regular();                      // undefined (strict) / globalThis
callExample = regular.call({ x: 1 }); // { x: 1 }`,
    tags: ["this", "binding rules", "arrow functions", "classes"],
    followUps: [
      "Why do class methods passed as React callbacks lose `this`?",
      "What does bind return and can it be overridden by call?",
    ],
    interviewTip:
      "Say 'call site, not definition site' first, then list precedence in order and finish with the arrow exception and one extraction bug story. Structure beats memorized trivia here.",
    concepts: ["dynamic this", "lexical this", "bind/call/apply"],
  },
  {
    id: "js-prototypes-chain",
    topic: "javascript",
    category: "Prototypes",
    difficulty: "medium",
    question:
      "How does property lookup work on a JavaScript object, and how do `__proto__`, `prototype` and classes relate? What does `instanceof` actually check?",
    idealAnswer:
      "Property lookup walks the prototype chain: the object itself, then its [[Prototype]] (its `__proto__`), repeating until null; missing means undefined. Every function has a `prototype` property used only when the function is invoked with `new`: the new object's [[Prototype]] is set to Constructor.prototype. `class` is syntactic sugar over this — methods live on ClassName.prototype, and extends sets up chain linkage plus a constructor delegation. `instanceof` checks whether Constructor.prototype appears anywhere in the object's prototype chain, so it answers 'was this object built from (or extended from) this constructor', not 'does it have this shape'.",
    explanation:
      "The two similarly-named things trip people up: `prototype` is a property of functions; `__proto__` (the [[Prototype]] internal slot) is the actual chain link on every object. Lookup cost grows with chain depth, which is one reason hot-path code avoids deep chains. shadowing: writing obj.x never writes up the chain, but getters/setters on prototypes complicate that. `instanceof` can be fooled — Object.create(protoObj) makes instanceof work without a constructor — and `Symbol.hasInstance` customizes it. Modern practice: prefer classes or Object.create over manipulating __proto__ (which is slow and deopts engines). Structural typing doesn't exist at runtime in JS — instanceof is nominal.",
    code: `const animal = { eat() { return "eating"; } };
const dog = Object.create(animal);   // dog.__proto__ === animal
dog.eat();                            // found on animal

function Dog() {}
Dog.prototype.bark = () => "woof";
const d = new Dog();
d instanceof Dog;                     // true — Dog.prototype in d's chain
Object.getPrototypeOf(d) === Dog.prototype; // true`,
    tags: ["prototypes", "inheritance", "instanceof", "classes"],
    followUps: [
      "How do classes differ from plain prototype inheritance beyond syntax?",
      "Why might instanceof fail across module boundaries or iframes?",
    ],
    interviewTip:
      "Distinguish `prototype` (function property) from [[Prototype]] (chain link) explicitly — mixing them up is the fastest way to fail this question. Then explain lookup as a walk and instanceof as membership in that walk.",
    concepts: ["prototype chain", "constructor functions", "delegation"],
  },
];
