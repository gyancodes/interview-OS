import type { LearningMaterial } from "@/lib/types";

/**
 * Curated learning material: JavaScript Events.
 * Authored from a deep-dive conversation on JavaScript events and maintained
 * in-repo; served by GET /api/materials instead of being bundled into client
 * JavaScript.
 */
export const javascriptEventsMaterial: LearningMaterial = {
  title: "JavaScript Events: From First Click to Event Delegation",
  overview:
    "Events are how the browser tells your code that something happened — a click, a key press, a finished network request. This guide builds the full mental model: how events travel through the DOM, how to listen and clean up correctly, and the delegation pattern that separates working code from interview-grade answers.",
  prerequisites: [
    "Basic HTML and the DOM tree",
    "Functions, callbacks, and closures in JavaScript",
    "How a page loads in the browser",
  ],
  sections: [
    {
      title: "What an event actually is (and where it runs)",
      content:
        "An event is a signal that something happened: a click, a key press, a form submission, a finished network request, even a tab becoming visible.\n- Your code never polls for these things. The browser detects them and dispatches an event object to every listener registered for that signal.\n- Key mental model: JavaScript runs on a single main thread. The browser keeps a queue of tasks. When you click, the browser places a task on that queue; the event loop picks it up and runs your handler.\n- This is why handlers never run in the middle of other code — only between tasks. It also means one heavy handler delays every other event the user triggers.",
      keyPoints: [
        "An event is a browser-dispatched signal, not something your code detects",
        "Handlers run as tasks on the main thread via the event loop",
        "One slow handler delays every other event in the page",
      ],
    },
    {
      title: "Listening the right way: addEventListener",
      content:
        "- Prefer addEventListener over inline onclick and on-property handlers: it supports multiple listeners per element, options, and clean removal.\n- The options object: capture (run during the capture phase), once (auto-remove after the first call), passive (promise not to call preventDefault, letting the browser scroll immediately), and signal (an AbortSignal for bulk removal).\n- removeEventListener requires the exact same function reference that was added. An inline arrow function can never be removed, which is the root cause of most listener leaks.\n- Modern cleanup: pass one AbortController's signal to many addEventListener calls, then call abort() once to remove them all. This is the cleanest pattern in component-based apps.",
      code: "const button = document.querySelector(\"#save\");\n\nfunction onSave() {\n  console.log(\"saved\");\n}\n\nbutton.addEventListener(\"click\", onSave);\nbutton.addEventListener(\"click\", onSave, { once: true, passive: true });\n\n// Removal matches by reference — same function in, same function out.\nbutton.removeEventListener(\"click\", onSave);\n\n// Bulk cleanup with an AbortSignal\nconst controller = new AbortController();\nbutton.addEventListener(\"click\", onSave, { signal: controller.signal });\nwindow.addEventListener(\"resize\", onResize, { signal: controller.signal });\ncontroller.abort(); // removes both listeners in one call",
      keyPoints: [
        "addEventListener supports options that on-property handlers cannot express",
        "removeEventListener matches by function reference, not by code",
        "AbortController.signal is the modern way to remove many listeners at once",
      ],
    },
    {
      title: "The event object and the three phases",
      content:
        "Every listener receives an event object describing what happened: event.type, the target element, mouse coordinates, key values, and methods that change default behavior.\n- Events travel through the DOM in three phases: the capture phase travels from window down to the target, the target phase runs listeners on the target itself, and the bubble phase travels back up to window.\n- Listeners you write normally run in the bubble phase, because that is the default (capture: false).\n- target is the element the event originated on. currentTarget is the element whose listener is currently running. In delegation code this distinction is the entire trick.\n- stopPropagation stops the event from traveling further. stopImmediatePropagation also stops other listeners attached to the same element. preventDefault cancels the browser's default action (following a link, submitting a form) without stopping propagation.",
      code: "list.addEventListener(\"click\", (event) => {\n  console.log(event.target);        // deepest element clicked, e.g. the <span>\n  console.log(event.currentTarget); // element the listener is attached to, the <ul>\n});",
      keyPoints: [
        "Capture goes down the tree, target runs in place, bubble goes back up",
        "target is where the event started; currentTarget is whose listener is running",
        "preventDefault cancels the default action; stopPropagation only affects listeners",
      ],
    },
    {
      title: "Event delegation: one listener for many elements",
      content:
        "- Because events bubble, a parent can listen for events that happen to any of its descendants. One listener on the list handles clicks for every item — including items added after the listener was attached.\n- The pattern: attach one listener to a stable container, find the real target with closest(selector), and branch on what was clicked.\n- This is the standard technique for dynamic lists, tables, and any UI where elements come and go. It reduces memory, removes rebinding bugs, and survives re-renders.\n- Limits: delegation relies on bubbling. Events that do not bubble (focus, blur, element scroll) need either the bubbling alternatives focusin/focusout, or capture: true on the container.",
      code: "document.querySelector(\"#todos\").addEventListener(\"click\", (event) => {\n  const item = event.target.closest(\"li\");\n  if (!item) return;\n\n  if (event.target.matches(\".delete\")) {\n    item.remove();\n  } else {\n    item.classList.toggle(\"done\");\n  }\n});\n// Works for items added later — no re-binding needed.",
      keyPoints: [
        "Delegation exploits bubbling: one stable listener, many dynamic children",
        "closest() finds the meaningful ancestor of the actual click target",
        "Non-bubbling events need focusin/focusout or capture instead",
      ],
    },
    {
      title: "Events you will actually debug: input, submit, scroll, keys",
      content:
        "- input fires on every value change as the user types; change fires when the value is committed (blur for text fields, immediately for checkboxes). Use input for live validation, change for final values.\n- For forms, listen to submit on the form element, never click on the submit button — Enter-key submissions bypass the button. Call preventDefault() in the submit handler to take over.\n- keydown is the key event that works for everything; keypress is deprecated. To react to text actually being inserted, use the input event.\n- Scroll and touch handlers run while the browser is trying to paint frames. Mark them passive, keep the work minimal, and debounce or throttle anything expensive.",
      code: "// Tells the browser this handler never calls preventDefault(),\n// so scrolling is not blocked while waiting for JavaScript.\nwindow.addEventListener(\"scroll\", onScroll, { passive: true });\n\n// input: every keystroke. change: committed value.\ninput.addEventListener(\"input\", updatePreview);\nform.addEventListener(\"change\", persistDraft);\n\n// Take over form handling the correct way\nform.addEventListener(\"submit\", (event) => {\n  event.preventDefault();\n  submitWithFetch(new FormData(form));\n});",
      keyPoints: [
        "input for live values, change for committed values, submit on the form element",
        "keydown replaces the deprecated keypress; input replaces text-matching key logic",
        "passive listeners keep scrolling smooth; debounce expensive work",
      ],
    },
    {
      title: "Cleaning up and custom events",
      content:
        "- In single-page apps, listeners on document or window outlive the component that added them. Every listener added in an effect must be removed on cleanup, or you get duplicate handlers, stale state, and memory leaks. An AbortSignal removes many listeners with one call.\n- Components can also communicate through custom events: create a CustomEvent with a detail payload and dispatch it on a shared ancestor such as document. This is a lightweight publish/subscribe mechanism built into the DOM, useful when two components share no direct relationship.",
      code: "// Declare and dispatch a domain event\nconst cartChanged = new CustomEvent(\"cart:changed\", {\n  detail: { itemCount: 3 },\n  bubbles: true,\n});\ndocument.dispatchEvent(cartChanged);\n\n// Any part of the app can react without direct coupling\ndocument.addEventListener(\"cart:changed\", (event) => {\n  badge.textContent = `${event.detail.itemCount} items`;\n});",
      keyPoints: [
        "Every added listener needs a removal path in component-based apps",
        "AbortController turns N removals into one abort() call",
        "CustomEvent with detail is DOM-native pub/sub for decoupled components",
      ],
    },
  ],
  commonMistakes: [
    {
      mistake: "Calling stopPropagation() to stop a form from submitting or a link from navigating.",
      fix: "Use preventDefault(). stopPropagation only affects which listeners run, never the browser's default action.",
    },
    {
      mistake: "Trying to removeEventListener with a new inline arrow function.",
      fix: "Store the handler in a variable first, or add listeners with an AbortSignal and call abort(); removal matches by function reference.",
    },
    {
      mistake: "Reading event.target assuming it is the element the listener is attached to.",
      fix: "target is the deepest element clicked. Use currentTarget for the listener's element, or closest(selector) to find a meaningful ancestor of target.",
    },
    {
      mistake: "Adding listeners inside a component effect without a cleanup function.",
      fix: "Return a cleanup that removes the listeners, or pass an AbortController signal and call abort() in the cleanup.",
    },
    {
      mistake: "Delegating events that do not bubble, like focus and blur.",
      fix: "Use focusin and focusout (which bubble), or attach the container listener with capture: true.",
    },
  ],
  interviewFocus: [
    "Walk through the capture, target, and bubble phases and state where a normal listener runs",
    "Implement event delegation live for a dynamic list and explain why it survives new items and re-renders",
    "Explain the difference between target, currentTarget, preventDefault, and stopPropagation",
    "Describe how listeners leak in single-page apps and how AbortController solves cleanup",
    "Explain what passive listeners do for scroll performance on the main thread",
  ],
  studyChecklist: [
    "Build a todo list where one delegated listener handles add, toggle, and delete actions",
    "Log a click in a nested list and identify target vs currentTarget at each level",
    "Convert a snippet using inline onclick to addEventListener with options",
    "Demonstrate stopPropagation versus stopImmediatePropagation with two listeners on the same element",
    "Use one AbortController to add and remove three different listeners",
    "Explain the three event phases out loud in under two minutes without notes",
  ],
};
