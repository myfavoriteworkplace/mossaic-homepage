# Mossie — the Mossaic FAQ Chatbot

A plain-English guide to what Mossie is, what she's built with, where her brain lives, and how she decides what to say.

---

## 1. What Mossie is

Mossie is the friendly little cyan bubble that hops in from the side of the Mossaic homepage. She's an **FAQ helper** — visitors can either tap one of her suggested topics or type (or speak) a question, and she replies with a short, curated answer. She can also **read her answers out loud** and **listen to spoken questions**. She is **not** an AI model — she does not call any external service, she does not "make up" answers, and she does not send anything to the cloud. Everything she knows is hard-coded into the site itself.

---

## 2. The building blocks (technologies)

Mossie is built entirely from things that already exist in the website — no extra servers, no third-party chatbot service, no monthly bill.

| Technology | What it does for Mossie |
|---|---|
| **React 18** | The framework that draws her on screen and updates the chat as messages come in. |
| **TypeScript** | Adds safety nets — catches typos and wiring mistakes before the page ever loads. |
| **Vite 5** | The development tool that serves the site instantly while we work. |
| **Tailwind CSS 3** | A styling shorthand we use to lay her out — colours, spacing, rounded corners. |
| **Framer Motion** | The animation library powering her walk-in, the squash-stretch hop, the leg flail, the panel fade-in/out, and the halo pulse when she settles. |
| **Web Speech API** | Built into modern browsers — no library needed. Two halves: **SpeechSynthesis** lets her talk, **SpeechRecognition** lets her listen. |
| **Browser localStorage** | Remembers whether the visitor muted her, so the choice survives page reloads. |

That's the entire toolbox. No backend, no database, no API keys.

---

## 3. Where the code lives

Just four files matter:

- **`src/components/Chatbot.tsx`** — the whole chatbot: the bubble, the panel, the animation, the matching logic, the voice features. About 720 lines, all in one place.
- **`src/data/faqs.ts`** — **the brain.** All twelve questions, their keywords, and their answers live here. This is the single file to edit when you want to add, remove, or rewrite anything Mossie says.
- **`src/App.tsx`** — one-line wire-up that drops the chatbot into the page.
- **`src/data/site.ts`** — the source of truth for company facts (products, mission, contact). The FAQ answers in `faqs.ts` are written to stay consistent with this file.

---

## 4. Where the questions are stored

Every question Mossie can answer lives in **`src/data/faqs.ts`**, in a single list called `FAQS`. Each entry is one self-contained block with five pieces of information:

```ts
{
  id: "bookmyslot",                    // unique identifier
  label: "bookMySlot",                 // short label for the suggestion chip
  question: "What is bookMySlot?",     // the canonical question
  keywords: [                          // the words/phrases that should trigger this FAQ
    "bookmyslot", "book my slot", "dental", "clinic",
    "practice management", "appointments", "scheduling", "smile deals",
  ],
  answer: "bookMySlot is our live dental practice management product …",
}
```

Today there are **12 such entries**, covering: about Mossaic, products, bookMySlot, pricing, compliance (DISHA / IT Act), data hosting, Retail CRM, AI Imaging, demos / trials, contact, location, and the tech stack.

Two extra strings live in the same file:

- **`FAQ_GREETING`** — the very first thing Mossie says when the panel opens.
- **`FAQ_FALLBACK`** — what she says when she can't confidently match a question.

**To add a new FAQ:** open `src/data/faqs.ts`, copy any existing entry, change the five fields, save. The chatbot picks it up on the next reload — no other file needs to change.

---

## 5. How she finds the right answer (the matching engine)

This is the most important part to understand. Mossie does **not** use AI or a language model to interpret questions. She uses a small, transparent **scoring system** that runs entirely in the visitor's browser. There are exactly four steps.

### Step 1 — Clean up the question

Whatever the visitor typed (or spoke) gets:

1. Converted to **lowercase**, so "DISHA" and "disha" are treated the same.
2. Stripped of punctuation — commas, question marks, full stops are replaced with spaces. So `"What's bookMySlot?"` becomes `"what's bookmyslot "`.

This cleaned-up version is the only thing the matcher looks at.

### Step 2 — Score every FAQ against the question

Mossie walks through all 12 FAQs, one at a time, and gives each one a **score** based on how many of its keywords appear in the question. The scoring rules are deliberately simple:

- **Single-word keyword found as a whole word → +1 point**
  - The "whole word" rule is critical. We use word-boundary matching, so a keyword like `ai` will match `"is your ai any good"` but **not** `"is it available"`. Without this, the keyword `book` would wrongly match `bookkeeping`, the keyword `crm` would match nothing weird (no risk), but the keyword `hq` could match `chq`, and so on.
- **Multi-word keyword (phrase containing a space) found in the question → +2 points**
  - This deliberately favours specific intent. If someone asks `"how much does it cost"`, the multi-word phrase `"how much"` (worth 2) outranks the more generic single-word `"price"` (worth 1) — making sure the **Pricing** FAQ wins, not whatever else might happen to mention the word "cost".

### Step 3 — Pick the winner

After all 12 FAQs have been scored, Mossie picks the **single FAQ with the highest score** and shows its answer. Ties are broken by FAQ order (first one wins) — but ties almost never happen in practice because the keyword lists are tuned.

### Step 4 — Handle "no good match"

If **no FAQ scored above zero** (meaning none of its keywords appeared at all), Mossie does **not guess**. Instead she shows the fallback line ("I don't know that one yet — but here's what I can help with:") and offers the visitor the **suggestion chips** for all 12 topics so they can tap their way to the right area. This is a deliberate design choice — better to admit she doesn't know than to confidently give a wrong answer.

### A worked example

The visitor types: **"how much does bookmyslot cost in rupees?"**

After cleaning: `"how much does bookmyslot cost in rupees "`

Scoring:

- **Pricing FAQ** — has `"how much"` (multi-word, +2), `"cost"` (+1), `"rupees"` (+1). **Total: 4**
- **bookMySlot FAQ** — has `"bookmyslot"` (+1). **Total: 1**
- All others: 0

**Pricing wins** with a score of 4. Mossie shows the pricing answer.

That's the whole brain. No machine learning, no API calls, no surprises — just a 15-line scoring function (`scoreFaq` and `findBestFaq` in `src/components/Chatbot.tsx`) reading the keyword lists from `src/data/faqs.ts`.

### Why it works well in practice

- **Predictable** — the same question always gets the same answer.
- **Editable** — to fix a wrong match, just adjust the keyword lists in one file.
- **Cheap** — no API costs, no rate limits, no network round-trip. Reply is instant.
- **Honest** — when she doesn't know, she says so and shows real options.

---

## 6. The walk-in performance

When the page loads, Mossie doesn't just appear — she **walks in** from the far left edge of the screen across to her home spot in the bottom-right corner.

- **Pace:** roughly 12 seconds end-to-end, linear (steady speed).
- **Style — pogo hop:** instead of sliding, she launches off the ground 14 px on each hop, traces a clear arc, and lands. About 20 hops over the full walk.
- **Squash and stretch:** classic cartoon physics. On landing she squashes wide and short. At the apex of the hop she stretches narrow and tall. Sells the impact.
- **Two cyan legs:** flail with opposite timing — when one kicks back, the other swings forward. ±35° arc each.
- **Five ways she settles:** moving the cursor within ~140 px of her, tapping the screen, clicking her, opening the chat panel, or letting the 12-second timer expire. Whichever happens first triggers a smooth spring into her home position. Body returns to neutral, legs retract up into the body.
- **When she's home:** a soft cyan halo pulses around her until you open the chat.
- **Skipped automatically when:** the visitor's screen is narrower than 480 px (mobile), **or** they've asked their operating system to reduce motion. In those cases she just appears at home without the show.

---

## 7. The voice features

Mossie can talk and listen — both using built-in browser features.

**Speaking (text-to-speech):**

- Every reply she gives is also queued through the browser's built-in voice synthesiser.
- She prefers an Indian English voice if one is available on the visitor's system, falling back to whatever English voice exists.
- A **mute toggle** in the panel header turns the voice off. The choice is remembered across visits via `localStorage`. Closing the panel or muting also immediately stops anything she was saying.

**Listening (speech-to-text):**

- A **microphone button** in the input row lets visitors speak instead of type.
- Tapping it asks the browser for mic permission and starts listening. Whatever's transcribed goes straight into the input box and is sent.
- If the visitor's browser doesn't support speech recognition (older Firefox, some mobile browsers), the mic button **hides itself** entirely — no broken button, no error message.

---

## 8. Design choices and why

- **Cyan accent (`rgba(34, 211, 238, …)`)** — matches the Aurora theme accent used across the site, so Mossie feels native rather than bolted on.
- **Glow + soft shadow instead of a heavy border** — keeps her feeling light and floaty against the dark background.
- **Pogo hop, not a slide** — playful and brief; visitors notice her, then she settles and stops competing for attention.
- **Strict matching with suggestions, not fuzzy guessing** — protects the brand. A wrong-but-confident answer is much worse than "I don't know — here are the topics I can help with."
- **Single source of truth in `faqs.ts`** — anyone (not just a developer) can read it, edit answers, and add new questions.

---

## 9. Accessibility and graceful degradation

Mossie is built to **never break**, regardless of the visitor's setup.

| If the visitor… | Mossie does this |
|---|---|
| Has a screen narrower than 480 px | Skips the walk-in, just appears at home. |
| Has set "reduce motion" in their OS | Skips the walk-in, just appears at home. |
| Uses a browser without speech synthesis | Hides the mute toggle. |
| Uses a browser without speech recognition | Hides the microphone button. |
| Denies microphone permission | The mic button stops glowing and gracefully exits. |
| Closes the chat mid-sentence | Mossie immediately stops speaking and listening. |
| Uses a screen reader | The bubble, panel header, mic, mute, and send buttons all have descriptive `aria-label`s; suggestion chips read as buttons. |

No feature **depends** on another feature being available. Anything missing is silently hidden, never shown as broken.

---

## At a glance

- **Brain:** `src/data/faqs.ts` — 12 entries, easy to edit.
- **Body:** `src/components/Chatbot.tsx` — UI, animation, matching, voice.
- **Method:** keyword scoring (single word = 1, phrase = 2, whole-word matching, highest score wins, fall back to suggestions).
- **Cost:** zero ongoing — no API, no server, no database.
- **Failure mode:** never wrong-and-confident; always either right, or "I don't know — pick one of these".
