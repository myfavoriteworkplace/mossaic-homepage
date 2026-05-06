# Mossie — Complete Reference

> Everything in one place: what Mossie is, how she's built, how to set up the infrastructure, what she can answer, and how to maintain her.

---

## 1. What Mossie is

Mossie is the friendly cyan bubble that walks in from the side of the Mossaic homepage. She is an **FAQ helper with an AI fallback** — visitors can tap a suggested topic or type (or speak) a question, and she replies with a short, curated answer. She can also read her answers out loud and listen to spoken questions.

Her replies come from one of two places, chosen automatically:

- **Local FAQ store** — for known questions (products, pricing, compliance, etc.), the answer is served instantly from a curated dataset in the browser. Zero network cost, zero latency.
- **Groq AI via Cloudflare Worker** — for anything the FAQ store doesn't cover, the question is sent to a Cloudflare Worker that proxies it to the Groq API (Llama 4). The API key never touches the browser.

The two layers are invisible to the visitor — they always get a reply within a few seconds regardless of which path handled it.

---

## 2. Architecture

```
User types / speaks in browser
        │
        ▼
[Client-side guards]
  • Empty / too long → local reply, stop
  • Pure punctuation → local ack, stop
  • Name capture (stored for later)
  • Frustration detected (note queued for Groq)
        │
        ▼
[FAQ matcher — instant, zero network]
  FAQ score ≥ 2?  ──yes──▶  Local answer from faqs.ts, stop
        │ no
        ▼
[More client guards]
  Jailbreak pattern?  ──yes──▶  Local refusal, stop
  Profanity?          ──yes──▶  Local rejection, stop
        │
        ▼
[Build enhanced message for Groq]
  Prepend: [Context: day, date, time IST, weekday/weekend]
  Prepend: [User's name: X]  (if captured)
  Prepend: [Note: frustrated] (if detected)
  For Malayalam: [Language: …]
        │
        ▼
Cloudflare Worker
(mossaic-faq-bot.itsmyfavoriteworkplace.workers.dev)
        │
        ▼  POST { message (annotated), history (last 6 turns) }
     Groq API
     meta-llama/llama-4-scout-17b-16e-instruct
        │
        ▼
  { reply: "plain text" }
        │
        ▼
  Streamed character-by-character in UI
```

Three layers: **client FAQ** (zero latency), **Cloudflare edge proxy** (keeps the API key off the browser, enforces security rules), **Groq LLM** (answers anything the FAQ doesn't cover).

---

## 3. Technologies

| Technology | What it does for Mossie |
|---|---|
| **React 18** | Draws her on screen and updates the chat as messages come in |
| **TypeScript** | Catches wiring mistakes before the page loads |
| **Vite 5** | Dev server and production bundler |
| **Tailwind CSS 3** | Colours, spacing, layout — the visual shell |
| **Framer Motion** | Walk-in, squash-stretch, leg flail, panel fade, halo pulse |
| **Web Speech API** | Built into modern browsers — SpeechSynthesis (talks) + SpeechRecognition (listens) |
| **Browser localStorage** | Remembers the visitor's mute preference across reloads |
| **Cloudflare Workers** | Edge proxy — receives questions from the browser, applies security rules, calls Groq, returns `{ reply }`. API key lives here only |
| **Groq API** | Hosted LLM (Llama 4 Scout) — answers questions the local FAQ store doesn't cover |

---

## 4. Where the code lives

| File | Purpose |
|---|---|
| `src/components/Chatbot.tsx` | The whole chatbot: bubble, panel, animation, matching, voice, Groq integration |
| `src/data/faqs.ts` | **The brain.** All FAQ entries, keywords, and answers. The only file to edit for content changes |
| `src/App.tsx` | One-line wire-up that drops the chatbot into the page |
| `src/data/site.ts` | Source of truth for company facts — FAQ answers stay consistent with this |
| `docs/cloudflare-worker-v2.02.js` | The current Worker script — paste into Cloudflare to deploy |

---

## 5. Groq setup

### 5.1 Account and API key

1. Sign up at **console.groq.com** — free tier, no credit card required.
2. Go to **API Keys → Create API key** → copy it immediately (shown once only).
3. Do **not** put the key in frontend code or any public repo. Store it only as a Cloudflare Worker environment variable (see §6.3).

### 5.2 Model

```
meta-llama/llama-4-scout-17b-16e-instruct
```

Found under **Text to Text** in the Groq model selector. Selected for speed, open-weights, and short factual answers suited to FAQ use.

**Worker call parameters (v2.02):**

| Parameter | Value | Reason |
|---|---|---|
| `temperature` | `0.3` | Factual and consistent, not creative |
| `max_tokens` | `200` | Raised from 160 — gives headroom for Malayalam (script is ~30% more token-dense than English) |
| `top_p` | `0.9` | Slightly diverse sampling |
| `frequency_penalty` | `0.3` | Discourages repetition |
| `presence_penalty` | `0.1` | Nudges toward covering new ground |

### 5.3 API call format (for reference / re-testing)

```json
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer <GROQ_API_KEY>
Content-Type: application/json

{
  "model": "meta-llama/llama-4-scout-17b-16e-instruct",
  "messages": [
    { "role": "system",    "content": "…system prompt…" },
    { "role": "user",      "content": "user message"    }
  ],
  "temperature": 0.3,
  "max_tokens": 200
}
```

The Worker extracts `choices[0].message.content` and returns `{ reply: "…" }` to the browser — the browser never sees the raw Groq response.

### 5.4 Testing the key before wiring to Cloudflare

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "messages": [{"role":"user","content":"hello"}],
    "max_tokens": 20
  }'
```

If you see a **model-not-found** error, check the model name spelling exactly — Groq is case and hyphen-sensitive.

---

## 6. Cloudflare Worker setup

### 6.1 Create the Worker

1. Sign up at **cloudflare.com** (free tier — 100,000 requests/day).
2. Dashboard → **Workers & Pages → Create application → Create Worker**.
3. Name it `mossaic-faq-bot` → click **Deploy** on the Hello World stub.

### 6.2 Paste the Worker script

Open the Worker editor (Worker name → **Edit code**), select all, delete, and paste the full contents of `docs/cloudflare-worker-v2.02.js`. Click **Save and deploy**.

### 6.3 Add the Groq API key as an environment variable

This is the most important security step — the key must never appear in code.

1. Worker → **Settings → Variables and Secrets → Add variable**.
2. Name: `GROQ_API_KEY` — Value: the key from Groq.
3. Tick **Encrypt → Save**.

The script reads it as `env.GROQ_API_KEY` at runtime. No one can read it once encrypted.

### 6.4 CORS — allowed origins

The Worker checks the `Origin` header and only responds to listed domains. Update `ALLOWED_ORIGINS` at the top of the script whenever you add a new environment:

```js
const ALLOWED_ORIGINS = [
  "https://mossaic.in",
  "https://www.mossaic.in",
  "https://bookmyslot.dental.mossaic.in",
  // add staging / production domains here
];
```

Without this, any third-party site could POST to your Worker and consume your Groq quota.

### 6.5 What the Worker does (v2.02)

The Worker applies security checks before Groq is ever called:

| Layer | Check | Action on failure |
|---|---|---|
| 1 | CORS origin allowlist | Returns `403 Forbidden` |
| 2 | HTTP method check | Returns `405 Method Not Allowed` |
| 3 | Valid JSON body | Returns `400 Bad Request` |
| 4 | Empty message | Returns empty-message reply |
| 5 | Message length ≤ 600 chars | Returns "too long" reply (raised from 400 in v2.02 to absorb client-side annotation prefixes) |
| 6 | Off-topic pattern match | Returns "out of scope" reply |
| 7 | Jailbreak keyword match | Returns firm refusal |
| 8 | Groq API 8-second timeout | Falls back to error reply |
| 9 | Markdown stripping on reply | Cleans `**bold**`, `# headings`, `- lists` before returning |

**Request format:**

```json
POST https://mossaic-faq-bot.itsmyfavoriteworkplace.workers.dev
Content-Type: application/json

{
  "message": "[Context: Tuesday, 6 May 2026, 3:03 PM IST, weekday] what are your prices?",
  "history": [
    { "role": "user",      "content": "previous user message" },
    { "role": "assistant", "content": "previous bot reply"    }
  ]
}
```

**Response format:**

```json
{ "reply": "plain text answer — no markdown" }
```

### 6.6 System prompt — client annotation instructions (v2.02 addition)

The v2.02 system prompt teaches the model to read bracketed annotations silently and never echo them back verbatim:

| Annotation | What it carries | Model behaviour |
|---|---|---|
| `[Context: day, date, time IST, weekday]` | Current day/time | Answers time questions; uses day-aware greetings |
| `[User's name: X]` | Captured name | Addresses user by name (once per reply at most) |
| `[Note: User seems frustrated. Lead with empathy.]` | Frustration signal | Opens reply with a brief empathetic acknowledgement |
| `[Language: User wrote in Malayalam. …]` | Language instruction | Greets in Malayalam; asks if they want to continue in English or Malayalam |

None of these annotations ever appear verbatim in a reply — the model is explicitly instructed to use them as silent context only.

### 6.7 Worker URL

```
https://mossaic-faq-bot.itsmyfavoriteworkplace.workers.dev
```

This is the value stored in `GROQ_WORKER_URL` in `src/components/Chatbot.tsx`. If you rename the Worker, move to a custom domain, or add a staging Worker, update that constant.

### 6.8 Version history

| Version | Key changes |
|---|---|
| v2.01 | Initial Groq proxy with conversation history, jailbreak + off-topic guards |
| v2.02 | `MAX_INPUT_CHARS` 400→600 · `MAX_TOKENS` 160→200 · System prompt annotation block added |

---

## 7. Custom domain: Cloudflare + GoDaddy

This routes `bot.mossaic.in` to your Worker so you can use a clean branded URL instead of the `.workers.dev` default.

### 7.1 Cloudflare Worker route

**Path:** Cloudflare Dashboard → Workers & Pages → select `mossaic-faq-bot` → **Triggers → Add Route**

| Field | Value |
|---|---|
| Route | `bot.mossaic.in/*` |
| Worker | `mossaic-faq-bot` |

### 7.2 GoDaddy DNS record

**Path:** GoDaddy Dashboard → My Products → mossaic.in → **DNS Management → Add Record**

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `bot` | `mossaic-faq-bot.YOURACCOUNT.workers.dev` | Default (1 hour) |

Replace `YOURACCOUNT` with your actual Cloudflare account subdomain.

### 7.3 Verify and test

Wait 15–30 minutes for DNS propagation, then test:

```bash
curl https://bot.mossaic.in \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Expected: `{ "reply": "Hi, I'm Mossie …" }`

### 7.4 Update the frontend constant

Once the custom domain is live, update `GROQ_WORKER_URL` in `src/components/Chatbot.tsx`:

```ts
const GROQ_WORKER_URL = "https://bot.mossaic.in";
```

Note: the Worker returns `{ reply: "…" }` — not `data.choices[0].message.content` (that is the raw Groq format, which the Worker wraps before returning to the browser).

### 7.5 Add to ALLOWED_ORIGINS

Add `"https://bot.mossaic.in"` to the `ALLOWED_ORIGINS` array in the Worker script and redeploy.

---

## 8. FAQ data structure

Every question Mossie can answer locally lives in `src/data/faqs.ts`, in a single list called `FAQS`. Each entry is one self-contained block:

```ts
{
  id: "bookmyslot",                // unique identifier
  label: "bookMySlot",             // short label for the suggestion chip
  question: "What is bookMySlot?", // the canonical question
  keywords: [                      // words/phrases that trigger this FAQ
    "bookmyslot", "book my slot", "dental", "clinic",
    "practice management", "appointments", "scheduling",
  ],
  answer: "bookMySlot is our live dental practice management product …",
  showSuggestions: true,           // show chip menu under this reply?
  hideFromChips: false,            // exclude this from the chip list itself?
  nextChips: ["pricing", "demo"],  // optional: contextual follow-up chips
  dynamicAnswer: () => string,     // optional: runtime-generated reply (e.g. time-of-day greeting)
}
```

Two extra strings live in the same file:

- **`FAQ_GREETING`** — the very first thing Mossie says when the panel opens.
- **`FAQ_FALLBACK`** — what she says when she can't confidently match a question.

**To add a new FAQ:** copy any existing entry in `src/data/faqs.ts`, fill in the five required fields, save. No other file needs to change.

---

## 9. The matching engine

Mossie uses a transparent **keyword scoring system** that runs entirely in the browser. There are four steps.

### Step 1 — Clean up the question

The input is lowercased and punctuation is replaced with spaces, so `"What's bookMySlot?"` becomes `"what's bookmyslot "`.

### Step 2 — Score every FAQ

Each FAQ gets a score based on how many of its keywords appear in the cleaned query:

- **Single-word keyword found as a whole word → +1 point**
  Whole-word matching (regex `\b`) prevents `ai` from matching `available`, `book` from matching `bookkeeping`, etc.
- **Multi-word keyword (phrase with a space) found in the query → +2 points**
  Specific phrases outrank generic single words. `"how much"` (+2) beats `"cost"` (+1).

### Step 3 — Pick the winner

The FAQ with the highest score wins. Ties break by array order (first wins) — rare in practice because keyword lists are tuned.

### Step 4 — Handle no match

If no FAQ scored ≥ 2, the message moves on to the Groq path (not shown as a failure to the user).

### Worked example

Visitor types: **"how much does bookMySlot cost in rupees?"**
After cleaning: `"how much does bookmyslot cost in rupees "`

| FAQ | Matched keywords | Score |
|---|---|---|
| Pricing | `"how much"` (+2), `"cost"` (+1), `"rupees"` (+1) | **4** |
| bookMySlot | `"bookmyslot"` (+1) | 1 |
| All others | — | 0 |

**Pricing wins** with 4. Mossie shows the pricing answer instantly, no API call.

---

## 10. Message routing

Every user message passes through this decision tree in strict order:

| Step | Check | Outcome |
|---|---|---|
| 1 | Empty string? | No-op, return |
| 2 | > 400 characters? | Local "please summarise" reply — API never called |
| 3 | Pure punctuation / pause signal (`...`, `??`)? | Local quiet acknowledgement — API never called |
| 4 | Name detected (`my name is X`, `call me X`, `I'm Dr X`)? | Name stored in session ref — continues routing |
| 5 | FAQ keyword score ≥ 2? | Instant local answer from `faqs.ts` — API never called |
| 6 | Jailbreak pattern matched? | Local firm refusal — API never called |
| 7 | Profanity matched? | Local polite rejection — API never called |
| 8 | Malayalam script detected? | Enhanced message sent to Groq with language note — hardcoded Malayalam reply used as fallback |
| 9 | Everything else | Enhanced message sent to Groq — reply streamed character-by-character |

Steps 1–7 cost zero network calls. Only steps 8 and 9 ever reach Cloudflare / Groq.

---

## 11. Conversational intelligence (B1–B6)

Six improvements added to make Mossie feel more live and personal. All are client-side only — no backend changes needed except for the corresponding Worker v2.02 system prompt update.

### B1 — Context prefix (time and date awareness)

Every Groq call is prefixed with the current day, date, time, and whether it's a weekday or weekend:

```
[Context: Tuesday, 6 May 2026, 3:03 PM IST, weekday]
```

This lets Mossie answer questions like "what time is it?", "is the office open today?", and use natural day-aware greetings ("hope your Tuesday is going well"). The raw user text is still what goes into `conversationHistoryRef` — history stays clean.

### B2 — Name capture

Mossie detects phrases like "my name is John", "I'm Dr Priya", or "call me Rahul" and stores the name for the rest of the session. Every subsequent Groq call gets a `[User's name: John]` prefix so the model can address the user personally. The name is cleared when the chat panel closes.

### B3 — Frustration detection

A set of phrases (`confused`, `not helping`, `makes no sense`, `frustrat*`, `i give up`, etc.) triggers an empathy note prepended to the Groq message:

```
[Note: User seems frustrated. Lead with empathy.]
```

The model opens its reply with a brief acknowledgement before answering. Only applies on the Groq path — FAQ-matched replies are not affected.

### B4 — Malayalam → Groq

Previously, Malayalam input triggered a hardcoded dead-end reply redirecting the user to email. Now it is passed to Groq with a language instruction:

```
[Language: User wrote in Malayalam. Greet warmly in Malayalam,
then ask if they want to continue in English or Malayalam.]
```

Mossie can genuinely respond in Malayalam and guide the conversation. The original hardcoded Malayalam greeting is kept as a silent fallback if the Worker is unreachable.

### B5 — Thinking-message gaps

Phrases like "one sec", "hold on", "let me think", "just a sec", and pure-punctuation inputs (`...`, `??`, `!`) now get an immediate quiet acknowledgement without touching the FAQ scorer or the API. These were previously either unhandled or reaching Groq unnecessarily.

### B6 — Idle nudge

If the chat panel has been open for 45 seconds with no message sent, Mossie sends one gentle prompt:

> "Wondering where to start? You can ask me about bookMySlot, our pricing, or how to get in touch."

Rules: fires at most once per panel open · suppressed if the user has already sent a message · resets when the panel closes · no emoji.

---

## 12. Conversation history

- **Storage:** `conversationHistoryRef` — a React ref (not state), so pushing to it never triggers a re-render.
- **Growth:** after a successful Groq reply, both the user turn and assistant turn are appended, then trimmed to `GROQ_HISTORY_MAX` (12 turns).
- **Error path:** fallback / error replies are not recorded — they are not real AI turns and would mislead the model on the next call.
- **Session reset:** the ref is wiped when the chat panel closes. A fresh session starts on next open.
- **Wire limit:** only the last 6 turns are sent to the Worker per call, capping payload size regardless of session length.

---

## 13. Jailbreak protection (double-layer)

Both the browser and the Worker independently reject injection attempts:

**Client-side (`JAILBREAK_RE` in `Chatbot.tsx`):**
```
/system prompt/i
/your (instructions|rules|guidelines|constraints)/i
/\bignore\b.*\brules?\b/i
/repeat after me/i
/\b(act as|pretend (you are|to be)|roleplay|you are now)\b/i
/\b(jailbreak|dan mode|developer mode|unrestricted mode)\b/i
/\b(chatgpt|openai|gpt-?4|gemini|copilot|claude|mistral)\b/i
```

**Worker-side (`JAILBREAK_SOFT` + `OFF_TOPIC_PATTERNS`):** mirrors the client patterns and adds medical, political, legal, and explicit content guards.

If the client check fires, the reply is local — zero API cost. The Worker check is a second independent barrier.

---

## 14. Key frontend constants

Located near the top of `src/components/Chatbot.tsx` — tune here, not deeper in the logic:

| Constant | Value | What it controls |
|---|---|---|
| `GROQ_WORKER_URL` | Worker URL string | Where `fetchGroqReply` POSTs to |
| `GROQ_WORKER_TIMEOUT_MS` | `8000` | AbortController timeout — user never waits more than 8 seconds |
| `INPUT_MAX_CHARS` | `400` | Client-side cap on raw user input before any annotation is added |
| `GROQ_HISTORY_MAX` | `12` | Max turns stored in `conversationHistoryRef` per session |
| `THINKING_DELAY_MS` | `600` | How long the "…" thinking dots show before text starts appearing |
| `TYPE_CHAR_INTERVAL_MS` | `22` | Milliseconds per character in the streaming reveal |
| `NAME_CAPTURE_RE` | Regex | Detects "my name is X", "call me X", "I'm Dr X" |
| `FRUSTRATION_RE` | Regex | Detects frustrated/confused phrasing |

---

## 15. What Mossie can handle

### Tier 0 — Substantive product and company FAQs (instant, local)

| Topic | Example inputs |
|---|---|
| About Mossaic | "What is Mossaic?", "What do you do?", "Tell me about Mossaic" |
| Products | "What products do you build?", "Your lineup", "Portfolio" |
| bookMySlot | "What is bookMySlot?", "dental software", "clinic scheduling", "Smile Deals" |
| Pricing | "How much does it cost?", "Pricing", "Plans", "Rupees", "Fees" |
| Compliance | "DISHA", "IT Act", "Is it compliant?", "audit trails", "GST" |
| Data hosting | "Where is data hosted?", "India region", "cloud", "servers" |
| Retail CRM | "What is Retail CRM?", "kirana", "loyalty", "WhatsApp billing" |
| AI Imaging | "What is AI Imaging?", "Grad-CAM", "explainable AI", "dental imaging" |
| Demo / trial | "Can I try bookMySlot?", "Get a demo", "Sign up", "Free trial" |
| Contact | "How do I get in touch?", "Email", "Support", "Speak to a human" |
| Location | "Where are you based?", "Kerala", "India", "Headquarters" |
| Tech stack | "What technology?", "React", "Node", "Postgres", "Python" |

### Tier 2 — Mossaic meta (answered naturally, not shown in chip menu)

Founder · hiring · customers · name origin · roadmap · refunds · payment methods · mobile app · integrations · privacy and terms · working hours · time-of-day greetings (dynamic)

### Tier 1 — Conversational / small-talk (handled gracefully)

Greetings (`hi`, `hello`, `namaste`, `vanakkam`) · wellness check (`how are you`, `hru`) · thanks · goodbye · acknowledgements (`ok`, `cool`, `got it`, `one sec`, `hold on`, `let me think`) · compliments · apologies · identity queries (`who are you`, `are you a bot`) · capabilities (`what can you do`) · provenance (`who built you`) · easter eggs (jokes, meaning of life, sing me a song)

### What Mossie will not do

| Attempt | Response |
|---|---|
| Off-topic question (movies, weather, stocks) | Polite redirect to Mossaic topics |
| Jailbreak / prompt injection | Firm local refusal — no API call |
| Profanity | Polite rejection |
| Message > 400 characters | Local prompt to summarise |
| Roleplay / "act as" / "ignore rules" | Double-blocked at client and Worker |
| Competitor mentions (Practo, Zocdoc) | Redirected to Mossaic topics |
| Medical advice / diagnosis | Redirected: "please consult a qualified dentist" |

---

## 16. Walk-in animation

When the page loads, Mossie walks in from the far left edge to her home position in the bottom-right corner.

- **Pace:** ~13 seconds end-to-end, steady speed.
- **Pogo hop:** she launches 14 px off the ground on each hop, traces a clear arc, and lands — about 20 hops over the full walk.
- **Squash and stretch:** on landing she squashes wide and short; at the apex she stretches narrow and tall.
- **Two cyan legs:** flail with opposite timing — ±35° arc each.
- **Three mid-walk waves:** at 25%, 50%, and 75% of the walk, Mossie pauses and waves toward the visitor.
- **Five settle triggers:** cursor within ~140 px, tap, click, opening the chat panel, or the 13-second timer expiring.
- **Aurora portal:** a glowing cyan circle frames her walk-in entrance.
- **Double-click / long-press to replay:** sends her on another walk.
- **Skipped automatically:** screen narrower than 480 px (mobile) or OS reduce-motion preference.

---

## 17. Voice features

**Speaking (text-to-speech):**
- Every reply is queued through the browser's built-in voice synthesiser.
- Prefers an Indian English (en-IN) female voice; falls back to any available English voice.
- Mute toggle in the panel header — choice persisted via `localStorage`.
- Closing the panel immediately cancels any in-progress speech.

**Listening (speech-to-text):**
- Microphone button in the input row — asks for browser mic permission, transcribes speech directly into the input, sends it.
- Mic button hides itself entirely on browsers without `SpeechRecognition` support (older Firefox, some mobile browsers) — no broken UI.

---

## 18. Design choices

- **Cyan accent (`rgba(34, 211, 238, …)`)** — matches the Aurora theme used across the site; Mossie feels native, not bolted-on.
- **Glow + soft shadow** — keeps her feeling light against the dark background.
- **Pogo hop, not a slide** — playful and brief; visitors notice her, then she settles and stops competing for attention.
- **FAQ-first, Groq-fallback** — protects brand voice. Known answers are always exact and instant; Groq only handles genuine unknowns.
- **Single source of truth in `faqs.ts`** — anyone can read it, edit answers, and add topics without touching the component code.
- **Streaming character reveal** — makes the AI reply feel responsive and human rather than a blank-then-sudden block of text.

---

## 19. Accessibility and graceful degradation

| If the visitor… | Mossie does this |
|---|---|
| Has a screen narrower than 480 px | Skips the walk-in, appears at home |
| Has set "reduce motion" in their OS | Skips the walk-in, appears at home |
| Uses a browser without speech synthesis | Hides the mute toggle |
| Uses a browser without speech recognition | Hides the microphone button |
| Denies microphone permission | Mic button exits gracefully |
| Closes the chat mid-sentence | Immediately stops speaking and listening |
| Uses a screen reader | Bubble, panel header, mic, mute, and send buttons all have descriptive `aria-label`s; suggestion chips read as buttons |
| Has a slow connection / Groq times out | Falls back to a local reply — never a blank message or infinite spinner |

No feature depends on another feature being available. Anything missing is silently hidden, never shown as broken.

---

## 20. How to update things

| Task | Where |
|---|---|
| Add or edit an FAQ answer | `src/data/faqs.ts` — edit `answer` or `dynamicAnswer` |
| Add new FAQ keywords | `src/data/faqs.ts` — append to `keywords` array |
| Add a new FAQ topic | `src/data/faqs.ts` — add a new object to `FAQS` |
| Change the Groq model | Worker script — update the `model` string, redeploy |
| Adjust AI creativity | Worker script — change `temperature` |
| Lengthen / shorten AI replies | Worker script — change `max_tokens` |
| Change the Worker timeout | `GROQ_WORKER_TIMEOUT_MS` in `Chatbot.tsx` |
| Change the client input cap | `INPUT_MAX_CHARS` in `Chatbot.tsx` |
| Add a new allowed origin | `ALLOWED_ORIGINS` in Worker script, redeploy |
| Rotate the Groq API key | Cloudflare → Worker → Settings → Variables → update `GROQ_API_KEY` |
| Move to a custom domain | Update `GROQ_WORKER_URL` in `Chatbot.tsx` + add to `ALLOWED_ORIGINS` |
| Add a jailbreak pattern | Append to `JAILBREAK_RE` in `Chatbot.tsx` AND the Worker script |
| Update the system prompt | Edit `SYSTEM_PROMPT` in the Worker script, redeploy |
| Adjust idle nudge timing | Change `45_000` in the idle nudge `useEffect` in `Chatbot.tsx` |
| Change frustration triggers | Edit `FRUSTRATION_RE` constant in `Chatbot.tsx` |

---

## 21. Quick-start replication checklist

If you need to rebuild this stack from scratch:

- [ ] Create Groq account → generate API key → test with curl (§5.4)
- [ ] Create Cloudflare account → create Worker named `mossaic-faq-bot`
- [ ] Paste `docs/cloudflare-worker-v2.02.js` into Worker editor → Save and deploy
- [ ] Add `GROQ_API_KEY` as an encrypted environment variable in Worker settings
- [ ] Add your domain(s) to `ALLOWED_ORIGINS` in the Worker script, redeploy
- [ ] Confirm `GROQ_WORKER_URL` in `Chatbot.tsx` matches the deployed Worker URL
- [ ] (Optional) Configure custom domain `bot.mossaic.in` via Cloudflare route + GoDaddy CNAME (§7)
- [ ] Open the chat widget → send a test message → confirm a reply arrives within 8 seconds
- [ ] Try a jailbreak phrase ("act as a pirate") → confirm local refusal fires
- [ ] Try a long message (> 400 chars) → confirm local "too long" reply fires
- [ ] Type "my name is [name]", then ask a follow-up → confirm Mossie uses the name
- [ ] Type in Malayalam → confirm Groq replies in Malayalam
- [ ] Ask a follow-up question → confirm Groq answers with context from the previous turn
- [ ] Leave the panel open for 45 seconds without typing → confirm idle nudge appears
