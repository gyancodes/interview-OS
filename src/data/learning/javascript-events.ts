import type { LearningMaterial } from "@/lib/types";

/**
 * Curated learning material: JavaScript Events.
 * Curated from a real learner Q&A session that worked through two projects —
 * a background color changer and a BMI calculator — covering forEach,
 * addEventListener, the event object (e), e.target, form submit,
 * preventDefault, reading input values and validation. Served by
 * GET /api/materials — never imported into client components.
 */
export const javascriptEventsMaterial: LearningMaterial = {
  title: "JavaScript Events: From the Color Changer to the BMI Calculator",
  overview:
    "Built from a real Q&A session around two beginner projects: a background color changer and a BMI calculator. It answers the questions that confuse everyone: what (btn) and (e) actually are, where the event object's value comes from without you writing it, what e.target gives you, why forms need preventDefault(), and how to read, validate and display user input correctly.",
  prerequisites: [
    "Basic HTML: tags, ids and classes",
    "Functions, parameters and callbacks",
    "How to open the browser console and log values",
  ],
  sections: [
    {
      title: "The setup: querySelectorAll + forEach + addEventListener",
      content:
        "- document.querySelectorAll(\".color-button\") collects every matching element into a list. You want one instruction to apply to all four buttons without writing the same code four times.\n- forEach() walks that list one by one and runs your callback for each element. The parameter — btn — is simply the name you give to the current element; it could be banana and the code would work identically.\n- Inside the loop, btn.addEventListener(\"click\", ...) registers a function on that specific button: 'whenever this button is clicked, run this function.'\n- Two different callbacks are in play: the forEach callback runs once per button at setup time; the click callback runs later, every time that button is clicked. Keeping those two moments separate is the key to the whole pattern.",
      code: "const buttons = document.querySelectorAll(\".color-button\");\nconst body = document.querySelector(\"body\");\n\nbuttons.forEach((btn) => {\n  // Setup time: runs once per button, at script load.\n  btn.addEventListener(\"click\", (e) => {\n    // Click time: runs later, every time THIS button is clicked.\n    console.log(btn);      // the button we configured\n    console.log(e);        // the event object from the browser\n    console.log(e.target); // the element that was clicked\n\n    if (e.target.id === \"grey\") {\n      body.style.backgroundColor = \"grey\";\n    }\n  });\n});",
      keyPoints: [
        "forEach gives your callback the current item, one at a time",
        "btn is just a parameter name — the name is yours to choose",
        "addEventListener registers a function to run later, when the event occurs",
      ],
    },
    {
      title: "What (e) is — and where its value comes from",
      content:
        "- When an event happens, the browser builds an event object: a little report describing what happened — the event type, which element was involved, pointer coordinates, key values, plus methods like preventDefault().\n- You never create or assign e yourself. The browser calls your callback and passes the event object as the first argument — conceptually yourCallback(eventObject), which makes e = eventObject.\n- The name is yours: (e), (event) and (clickInformation) all work identically. e or event are the conventional choices.\n- If you do not need the event information, you can omit the parameter entirely: btn.addEventListener(\"click\", () => { ... }) is perfectly valid.",
      code: "// The browser does (conceptually):\n// yourCallback({ type: \"click\", target: redButton, ... })\n\nbtn.addEventListener(\"click\", (e) => console.log(e));\nbtn.addEventListener(\"click\", (event) => console.log(event));\nbtn.addEventListener(\"click\", (clickInformation) => console.log(clickInformation));\n// All three are identical — the name is yours.\n\n// No event info needed? Omit the parameter entirely:\nbtn.addEventListener(\"click\", () => {\n  body.style.backgroundColor = btn.id;\n});",
      keyPoints: [
        "The event object is created and passed in by the browser, not by you",
        "e is just the parameter name receiving that object",
        "Omitting the parameter is fine when you need no event information",
      ],
    },
    {
      title: "e.target — which element was clicked",
      content:
        "- e.target is the element where the event originated. Click the Grey button and target is the Grey button itself; e.target.id is then \"grey\".\n- btn and e.target are different things: btn is the button you are configuring at setup time (it comes from forEach); e.target is the element involved in the event at click time (it comes from the browser's event object).\n- For a direct click on a simple button, btn and e.target usually refer to the same element — but they are obtained in different ways, and that distinction matters as soon as your markup gets nested (clicking a span inside the button gives target = the span).",
      code: "<button id=\"grey\">Grey</button>\n\n// After clicking the Grey button:\nbtn.addEventListener(\"click\", (e) => {\n  console.log(e.target);    // <button id=\"grey\">Grey</button>\n  console.log(e.target.id); // \"grey\"\n});",
      keyPoints: [
        "e.target is the element where the event originated",
        "btn is setup-time configuration; e.target is event-time information",
        "They often match on simple buttons but diverge inside nested markup",
      ],
    },
    {
      title: "Forms: the submit event and preventDefault",
      content:
        "- Listen for submit on the form element, not click on the submit button: pressing Enter also submits a form, and that never touches the button's click handler.\n- By default, submitting a form makes the browser attempt its normal submission behavior, which can navigate away or reload the page.\n- e.preventDefault() cancels that default action so your JavaScript can handle the submission itself. It does not stop your callback — it stops the browser. Code after it runs normally.\n- This is the reason the BMI calculator needs (e) at all: without the event object you cannot call preventDefault().",
      code: "const form = document.querySelector(\"form\");\n\nform.addEventListener(\"submit\", (e) => {\n  e.preventDefault(); // stop the browser's default submission\n\n  // ...validation and calculation run here, page stays put\n});",
      keyPoints: [
        "submit belongs on the form element — Enter key submissions bypass the button",
        "preventDefault() stops the browser's default action, not your callback",
        "You need the event object (e) precisely to call preventDefault()",
      ],
    },
    {
      title: "Reading input: .value is a string, and when you read it matters",
      content:
        "- document.querySelector(\"#height\").value returns what the user typed as a string: \"170\", not 170.\n- Convert before doing math: parseInt(\"170\") gives 170. But parseInt stops at the first non-integer character — parseInt(\"170.5\") gives 170. Use Number() when decimal input should be accepted.\n- Read the values INSIDE the submit callback. There are two moments in time: when the script first loads (the inputs are still empty) and when the user submits (the inputs hold their values). Reading inside the callback gets the values as of submission time.\n- 'Taking values inside the form' does not make them part of the form — they are ordinary local variables of the callback's function scope, created fresh on every submission.",
      code: "form.addEventListener(\"submit\", (e) => {\n  e.preventDefault();\n\n  // Read INSIDE the callback: values as of submit time.\n  const rawHeight = document.querySelector(\"#height\").value; // \"170\"\n  const height = Number(rawHeight); // 170 (parseInt(\"170.5\") would give 170)\n});",
      keyPoints: [
        ".value always hands you a string, even when the user typed digits",
        "parseInt truncates decimals; Number() keeps them",
        "Read inputs inside the submit callback to capture what the user entered",
      ],
    },
    {
      title: "Validation done right: order, NaN and early returns",
      content:
        "- The ordering bug from the original code: it converted with parseInt first, then checked height === \"\". But parseInt(\"\") is NaN, not \"\", so the empty-string check can never fire. Check the raw .value before converting.\n- || means OR: the whole condition is true if any part is true. In the original code, isNaN(height) was the check that actually caught bad input like \"abc\" (which becomes NaN).\n- Zero slips through a height < 0 check — and a height of 0 breaks the BMI formula. Validate with !Number.isFinite(height) || height <= 0, which rejects NaN, Infinity, zero and negatives in one line.\n- return exits the callback immediately, so the calculation only runs after every check passes. This is why the improved version does not need a big else block. An else if chain also skips all remaining checks once one branch matches.",
      code: "form.addEventListener(\"submit\", (e) => {\n  e.preventDefault();\n\n  const rawHeight = document.querySelector(\"#height\").value;\n  const height = Number(rawHeight);\n  const results = document.querySelector(\"#results\");\n\n  // Empty check FIRST, on the raw string.\n  if (rawHeight.trim() === \"\") {\n    results.textContent = \"Please enter a height.\";\n    return; // exit the callback — nothing below runs\n  }\n\n  // Then numeric validity: rejects NaN, Infinity, 0 and negatives.\n  if (!Number.isFinite(height) || height <= 0) {\n    results.textContent = \"Please give a valid height.\";\n    return;\n  }\n\n  // ...same for weight, then calculate\n});",
      keyPoints: [
        "parseInt(\"\") is NaN — check the raw string before converting",
        "Validate with !Number.isFinite(x) || x <= 0 to also reject zero",
        "return exits the callback, replacing the need for nested else blocks",
      ],
    },
    {
      title: "Showing results: textContent, template literals and the BMI math",
      content:
        "- element.textContent = \"text\" replaces the element's content with plain text. innerHTML interprets its string as HTML — more power than needed here and unsafe with user-derived text.\n- Template literals (`...${value}`) insert variables into strings; toFixed(2) formats a number to two decimal places but returns a string — fine, because it is only being displayed.\n- BMI = weight (kg) / height (m) squared. With height in centimeters that becomes weight / ((height * height) / 10000) — for 170 cm and 65 kg: 65 / (1.7 x 1.7) = 22.49.",
      code: "// BMI = weight(kg) / height(m)^2. Height arrives in cm:\n// (height / 100)^2 = (height * height) / 10000\nconst bmi = weight / ((height * height) / 10000);\n\n// 170 cm, 65 kg  ->  65 / (1.7 * 1.7) = 22.49\nresults.textContent = bmi.toFixed(2); // \"22.49\" — a string, fine for display",
      keyPoints: [
        "textContent for plain text; innerHTML only when you really mean HTML",
        "Template literals insert variables; toFixed(2) returns a formatted string",
        "Dividing cm-squared by 10000 converts the BMI denominator to meters squared",
      ],
    },
    {
      title: "Where events go next: bubbling, delegation and cleanup",
      content:
        "- Once click and submit feel natural, three ideas extend this model to production code. First, events travel through the DOM in phases: capture from window down to the target, then bubble back up — which lets one parent listener handle clicks for many children (event delegation using e.target and closest()).\n- Second, listeners added inside components must be removed on cleanup; an AbortController signal removes many listeners with one abort() call.\n- Third, elements can communicate through CustomEvent with a detail payload — DOM-native publish/subscribe. The (e) you learned here is the same object in every one of these patterns.",
      code: "// One listener handles every item, even ones added later.\nlist.addEventListener(\"click\", (e) => {\n  const item = e.target.closest(\"li\");\n  if (item) item.classList.toggle(\"done\");\n});",
      keyPoints: [
        "Events capture down and bubble up — the basis of event delegation",
        "Component listeners need cleanup; AbortController does it in one call",
        "The same event object powers delegation, cleanup and custom events",
      ],
    },
  ],
  commonMistakes: [
    {
      mistake: "Checking height === \"\" after converting with parseInt.",
      fix: "parseInt(\"\") is NaN, not \"\", so that check never fires. Check the raw .value string first, then convert.",
    },
    {
      mistake: "Using parseInt() when decimal input should be accepted.",
      fix: "parseInt(\"170.5\") returns 170. Use Number() (or parseFloat) so decimal heights and weights survive conversion.",
    },
    {
      mistake: "Accepting 0 as a valid height or weight.",
      fix: "height < 0 does not reject zero, and zero breaks the BMI formula. Use !Number.isFinite(height) || height <= 0.",
    },
    {
      mistake: "Listening for click on the submit button instead of submit on the form.",
      fix: "Pressing Enter submits the form without clicking the button. Attach the listener to the form and handle the submit event.",
    },
    {
      mistake: "Using innerHTML to display user-derived values.",
      fix: "innerHTML parses its string as HTML. Use textContent for plain text results and messages.",
    },
    {
      mistake: "Confusing btn with e.target.",
      fix: "btn is the button you configured at setup time (from forEach); e.target is the element involved in the event at click time. They often match but are obtained differently.",
    },
  ],
  interviewFocus: [
    "Explain where the event object comes from and why you never assign e yourself",
    "Explain the difference between btn (setup time) and e.target (event time)",
    "Explain what preventDefault() stops and what it does not stop",
    "Explain why form inputs must be read inside the submit callback",
    "Walk through why parseInt(\"\") is NaN and how that breaks empty-input validation",
  ],
  studyChecklist: [
    "Rebuild the color changer: forEach + addEventListener, logging btn and e on every click",
    "Rebuild the BMI calculator with Number(), empty-input checks before conversion, and early returns",
    "Extend the BMI calculator to also display the entered height and weight using template literals",
    "Log btn and e.target in nested markup and describe when they differ",
    "Submit a form without preventDefault(), explain what the browser did, then fix it",
    "Explain the two moments — script load vs form submit — out loud, and why values are read inside the callback",
  ],
};
