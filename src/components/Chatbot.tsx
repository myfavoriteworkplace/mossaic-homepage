import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Mic, Volume2, VolumeX } from "lucide-react";
import "./Chatbot.css";
import {
  FAQS,
  FAQ_GREETING,
  FAQ_FALLBACK,
  FAQ_FALLBACK_OFFTOPIC,
  FAQ_FALLBACK_PROFANITY,
  FAQ_FALLBACK_GIBBERISH,
  type Faq,
} from "../data/faqs";

/* ──────────────────────────────────────────────────────────────────────────────
 * Chatbot
 *
 * Floating bottom-right FAQ assistant. Fully client-side — no backend, no
 * external API. Matches user input against a curated FAQ keyword index and
 * speaks the reply via the browser's Speech Synthesis API. Microphone input
 * uses the Web Speech Recognition API where supported (Chrome/Edge/Android +
 * iOS Safari); on unsupported browsers (Firefox, desktop Safari) the mic
 * button is hidden gracefully.
 *
 * Brand vocabulary mirrors the rest of the site: Aurora dark panel, cyan
 * border + outer glow, Inter type, lucide icons.
 * ────────────────────────────────────────────────────────────────────────── */

type Role = "bot" | "user";

type Message = {
  id: number;
  role: Role;
  text: string;
  showSuggestions?: boolean;
  /* Streaming/typing state for bot messages.
     - `isThinking` shows the three pulsing dots (someone is typing on the
       other end). `isTyping` reveals `displayText` letter-by-letter.
     - When neither flag is true, the bubble renders `text` directly. */
  isThinking?: boolean;
  isTyping?: boolean;
  displayText?: string;
  /* FAQ id that produced this reply, when one matched. Used by the chip
     renderer to honor a per-FAQ `nextChips` override (contextual follow-up
     chips) instead of the global menu. */
  faqId?: string;
};

const MUTE_KEY = "mossaic.chatbot.muted";
const ACCENT = "rgba(34, 211, 238, 0.55)";
const ACCENT_SOFT = "rgba(34, 211, 238, 0.18)";

/* ── Streaming/typing cadence ──────────────────────────────────────────────
   How long the three "thinking" dots show before the reply starts streaming,
   how fast each character is revealed, and how much extra pause to add after
   sentence-ending punctuation so the rhythm reads natural rather than
   machine-gun. Tweak these to dial the feel. */
const THINKING_DELAY_MS = 600;
const TYPE_CHAR_INTERVAL_MS = 22;
const TYPE_PUNCT_EXTRA_MS = 140;

/* ── Speech synthesis helpers ───────────────────────────────────────────── */

/* Voice-name hints used to bias the picker toward a feminine, brand-friendly
 * Mossie voice. Browsers don't expose a gender flag, so we sniff the voice
 * `name` against well-known female / male voice identifiers across Windows,
 * macOS, iOS, Android and Chrome's network voices. */
const FEMALE_HINTS = [
  "female",
  "woman",
  // en-IN female voices commonly shipped by OSes / browsers
  "heera",
  "veena",
  "lekha",
  "priya",
  "neerja",
  "raveena",
  "aditi",
  "kalpana",
  "swara",
  // Common female English voices on macOS / iOS / Windows / Chrome
  "samantha",
  "karen",
  "tessa",
  "moira",
  "fiona",
  "victoria",
  "allison",
  "ava",
  "susan",
  "zira",
  "hazel",
  "catherine",
  "serena",
];
const MALE_HINTS = [
  "male",
  "man ",
  // en-IN male voices commonly shipped by OSes / browsers
  "ravi",
  "hemant",
  "prabhat",
  "rishi",
  // Common male English voices on macOS / iOS / Windows / Chrome
  "daniel",
  "alex",
  "fred",
  "tom",
  "oliver",
  "george",
  "david",
  "mark",
  "guy",
];

function isFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return FEMALE_HINTS.some((h) => n.includes(h));
}

function isMaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return MALE_HINTS.some((h) => n.includes(h));
}

function pickIndianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const enIN = voices.filter((v) => v.lang === "en-IN");
  const en = voices.filter((v) => v.lang.startsWith("en"));
  // Preference order:
  //   1. en-IN female
  //   2. en-IN not known to be male
  //   3. any English female
  //   4. any English not known to be male
  //   5. any en-IN voice
  //   6. any English voice
  //   7. anything
  return (
    enIN.find(isFemaleVoice) ??
    enIN.find((v) => !isMaleVoice(v)) ??
    en.find(isFemaleVoice) ??
    en.find((v) => !isMaleVoice(v)) ??
    enIN[0] ??
    en[0] ??
    voices[0] ??
    null
  );
}

/** Strip URLs / heavy punctuation so the spoken reply is cleaner. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "our website")
    .replace(/[a-z0-9.-]+\.(in|com|org|net|io|app)\b/gi, "our website")
    .replace(/·/g, ",")
    .replace(/—/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Speech recognition feature detection ───────────────────────────────── */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/* ── FAQ matching ───────────────────────────────────────────────────────── */

/** Score one FAQ against the normalized query. Higher = better match.
 *  Multi-word keywords (with spaces) score 2x to favor specific intent over
 *  generic single-word overlap. */
function scoreFaq(faq: Faq, normalized: string): number {
  let score = 0;
  for (const kw of faq.keywords) {
    const k = kw.toLowerCase();
    if (k.includes(" ")) {
      if (normalized.includes(k)) score += 2;
    } else {
      // Whole-word match using regex word boundaries so "ai" doesn't match
      // "available" etc.
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(normalized)) score += 1;
    }
  }
  return score;
}

function findBestFaq(query: string): Faq | null {
  const normalized = query.toLowerCase().replace(/[^\w\s'-]/g, " ");
  let best: Faq | null = null;
  let bestScore = 0;
  for (const faq of FAQS) {
    const s = scoreFaq(faq, normalized);
    if (s > bestScore) {
      bestScore = s;
      best = faq;
    }
  }
  // Score of 1 means a single common word matched — not enough confidence.
  // Require at least 2 (one keyphrase OR two distinct keyword words) before
  // treating this as a known FAQ. Anything below goes to Groq.
  return bestScore >= 2 ? best : null;
}

/* ── Fallback classifier ─────────────────────────────────────────────────
 * When no FAQ matches, classify the input so we can pick a fallback that
 * actually fits what the user just said. All four categories use polite,
 * brand-consistent copy from `faqs.ts`. */
type FallbackKind = "off-topic" | "profanity" | "gibberish" | "default";

/* Small, deliberately conservative profanity list (English + common Hindi).
 * Whole-word match only via \b boundaries to avoid false positives. */
const PROFANITY_RE =
  /\b(fuck|fucking|shit|bitch|asshole|bastard|dick|piss|cunt|chutiya|chutia|bhenchod|madarchod|behenchod|gandu|saala|kamina|harami|randi|lawde|lund)\b/i;

/* Topical hints that, when no Mossaic FAQ matched, indicate the user is
 * asking about something off-topic. Kept short on purpose — anything not
 * here just falls through to the generic default reply. */
const OFFTOPIC_HINTS = [
  "weather",
  "temperature",
  "rain",
  "joke",
  "funny",
  "time now",
  "news",
  "headline",
  "prime minister",
  "modi",
  "election",
  "politics",
  "cricket",
  "football",
  "ipl",
  "movie",
  "film",
  "song",
  "music",
  "netflix",
  "spotify",
  "recipe",
  "biryani",
  "stock",
  "crypto",
  "bitcoin",
  "dating",
  "girlfriend",
  "boyfriend",
  "homework",
];

function classifyFallback(raw: string): FallbackKind {
  const t = raw.trim().toLowerCase();
  if (!t) return "gibberish";
  if (PROFANITY_RE.test(t)) return "profanity";
  /* Pure symbols / very short / no-vowel mash → gibberish. */
  if (t.length <= 2) return "gibberish";
  if (/^[\W_]+$/.test(t)) return "gibberish";
  if (!/[aeiou]/i.test(t) && t.length < 6) return "gibberish";
  for (const hint of OFFTOPIC_HINTS) {
    if (t.includes(hint)) return "off-topic";
  }
  return "default";
}

const FALLBACK_REPLIES: Record<FallbackKind, string> = {
  "off-topic": FAQ_FALLBACK_OFFTOPIC,
  profanity: FAQ_FALLBACK_PROFANITY,
  gibberish: FAQ_FALLBACK_GIBBERISH,
  default: FAQ_FALLBACK,
};

/* Whether to render the chip menu under each fallback reply. We hide chips
 * after a profanity warning (don't reward it with the menu) and show them
 * for the other three so the user has a clear next step. */
const FALLBACK_SHOW_CHIPS: Record<FallbackKind, boolean> = {
  "off-topic": true,
  profanity: false,
  gibberish: true,
  default: true,
};

/* ── Mossie entrance animation constants ─────────────────────────────────── */

/** Bubble width — used to compute the walk distance. */
const BUBBLE_PX = 56;
/** Side margin on both edges (matches `bottom-6 right-6` = 24px). */
const EDGE_MARGIN = 24;
/** Keep the intro comfortably paced without holding up the page or controls. */
const INTRO_START_DELAY_MS = 320;
const INTRO_FLIGHT_MS = 1450;
const INTRO_IMPACT_MS = 720;
const INTRO_WALK_TO_CENTER_MS = 1700;
const INTRO_CENTER_PAUSE_MS = 1250;
const INTRO_WALK_HOME_MS = 1700;
/** Soft radial clouds used for the impact burst. */
const SMOKE_PUFFS = [
  { x: -16, y: -4, size: 42, tone: "cyan", delay: 0 },
  { x: 12, y: -9, size: 48, tone: "slate", delay: 35 },
  { x: -5, y: 13, size: 54, tone: "cyan", delay: 20 },
  { x: 18, y: 12, size: 38, tone: "slate", delay: 60 },
  { x: -22, y: 14, size: 34, tone: "slate", delay: 85 },
  { x: 0, y: -20, size: 40, tone: "cyan", delay: 75 },
  { x: 23, y: -2, size: 32, tone: "cyan", delay: 110 },
  { x: -2, y: 2, size: 58, tone: "slate", delay: 0 },
] as const;
const IMPACT_SPARKS = [
  { x: 0, y: -36 },
  { x: 25, y: -25 },
  { x: 38, y: 0 },
  { x: 26, y: 27 },
  { x: 0, y: 38 },
  { x: -27, y: 25 },
  { x: -38, y: 0 },
  { x: -25, y: -26 },
] as const;
/** Cloudflare Worker that proxies requests to the Groq API. Used only when
 *  no local FAQ entry matches the user's message — keeps known questions
 *  instant and free, calls the API only for genuine unknowns. */
const GROQ_WORKER_URL =
  "https://mossaic-faq-bot.itsmyfavoriteworkplace.workers.dev";
/** Milliseconds before an in-flight Worker fetch is aborted. Prevents the
 *  user staring at thinking dots indefinitely if Groq is slow. */
const GROQ_WORKER_TIMEOUT_MS = 8000;
/** Max characters accepted from the user before we return a local "too
 *  long" message without calling the API. Mirrors the Worker's Layer 2. */
const INPUT_MAX_CHARS = 400;
/** Max conversation turns stored client-side per session (user + assistant
 *  messages combined). The last 6 are sent to the Worker so Groq has
 *  context for follow-up questions. Trimmed on each push. */
const GROQ_HISTORY_MAX = 12;
/** Client-side jailbreak guard — mirrors the Worker's Layer 4 so obvious
 *  injection attempts are rejected locally with zero API cost. */
const JAILBREAK_RE = [
  /system prompt/i,
  /your (instructions|rules|guidelines|constraints)/i,
  /\bignore\b.*\brules?\b/i,
  /repeat after me/i,
  /\b(act as|pretend (you are|to be)|roleplay|you are now)\b/i,
  /\b(jailbreak|dan mode|developer mode|unrestricted mode)\b/i,
  /\b(chatgpt|openai|gpt-?4|gemini|copilot|claude|mistral)\b/i,
];
/** Detects "my name is X", "I'm Dr X", "call me X" so Mossie can address
 *  the user by name in follow-up Groq replies. */
const NAME_CAPTURE_RE =
  /(?:my name is|i(?:'m| am) (?:dr\.?\s+)?|call me)\s+([A-Za-z]+)/i;
/** Phrases that hint at frustration or confusion — triggers an empathy note
 *  injected into the Groq message so the model leads with compassion. */
const FRUSTRATION_RE =
  /\b(confused|confusing|don'?t understand|not clear|unclear|frustrat|annoyed|useless|doesn'?t work|not helping|not helpful|makes no sense|what do you mean|i give up|forget it|this is stupid|terrible)\b/i;
/** Milliseconds the open-chat click is debounced so a double-click can be
 *  detected first. Cost: ~250ms perceived latency on single-click open. */
const CLICK_DELAY_MS = 360;
/** Milliseconds the user must hold a touch on Mossie to trigger walk-again. */
const LONG_PRESS_MS = 600;
/** Milliseconds the cursor must hover Mossie before the tooltip appears. */
const TOOLTIP_HOVER_DELAY_MS = 200;
/** Milliseconds the tooltip auto-shows the first time Mossie settles, then
 *  hides — so users on hover-less devices still see her introduction. */
const TOOLTIP_AUTOSHOW_MS = 2500;
/** Phrase shown in Mossie's hover/auto-show tooltip. */
const TOOLTIP_TEXT = "Mossie here — ask me anything";

type IntroPhase =
  | "pending"
  | "flight"
  | "impact"
  | "walking"
  | "pause"
  | "returning"
  | "complete";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

/* ── MossieFace — eyes + mouth SVG ──────────────────────────────────────── */

type Expression = "walking" | "happy" | "surprised" | "idle";

/** A tiny SVG face that lives inside the bubble. Switches between four
 *  expressions and supports a small pupil offset (used for "looking forward"
 *  while walking and "tracking the cursor" once settled). Includes its own
 *  randomized blink scheduler. */
function MossieFace({
  expression,
  pupilOffset,
}: {
  expression: Expression;
  pupilOffset: { x: number; y: number };
}) {
  const [blinking, setBlinking] = useState(false);

  // Schedule the next blink between 2.6s and 5.2s out. Each blink lasts 110ms.
  useEffect(() => {
    let openTimer = 0;
    let closeTimer = 0;
    const scheduleNext = () => {
      const delay = 2600 + Math.random() * 2600;
      openTimer = window.setTimeout(() => {
        setBlinking(true);
        closeTimer = window.setTimeout(() => {
          setBlinking(false);
          scheduleNext();
        }, 110);
      }, delay);
    };
    scheduleNext();
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  const happy = expression === "happy";
  const surprised = expression === "surprised";
  // Pupils centre themselves when surprised so the "o" mouth + wide eyes read
  // as a unified expression rather than a glance.
  const pup = surprised ? { x: 0, y: 0 } : pupilOffset;

  return (
    <svg
      viewBox="0 0 36 36"
      width="36"
      height="36"
      style={{ display: "block" }}
      aria-hidden
    >
      {/* Left eye — squinty curve when happy, oval otherwise. */}
      {happy ? (
        <path
          d="M 9 15 Q 12 11 15 15"
          stroke="#e6faff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse
            cx="13"
            cy="14"
            rx="3"
            ry={blinking ? 0.4 : surprised ? 3.4 : 3}
            fill="#e6faff"
          />
          {!blinking && (
            <circle
              cx={13 + pup.x}
              cy={14 + pup.y}
              r="1.4"
              fill="#0a1628"
            />
          )}
        </>
      )}

      {/* Right eye — mirror of the left. */}
      {happy ? (
        <path
          d="M 21 15 Q 24 11 27 15"
          stroke="#e6faff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse
            cx="23"
            cy="14"
            rx="3"
            ry={blinking ? 0.4 : surprised ? 3.4 : 3}
            fill="#e6faff"
          />
          {!blinking && (
            <circle
              cx={23 + pup.x}
              cy={14 + pup.y}
              r="1.4"
              fill="#0a1628"
            />
          )}
        </>
      )}

      {/* Mouth — surprise "o", happy wide arc, or neutral smile. */}
      {surprised ? (
        <ellipse cx="18" cy="24" rx="2" ry="2.5" fill="#e6faff" />
      ) : (
        <path
          d={
            happy
              ? "M 11 22 Q 18 30 25 22"
              : "M 13 23 Q 18 27 23 23"
          }
          stroke="#e6faff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* ── Groq helper ─────────────────────────────────────────────────────────
 * Sends a single user message to the Cloudflare Worker and returns the
 * Groq reply string. Throws on any network or parse error so the caller
 * can decide how to handle the failure gracefully. Kept outside the
 * component so it has no access to state and is easy to unit-test later. */

/** Builds a compact context string injected at the front of every Groq
 *  message so the model knows the current day, date, time, and whether it's
 *  a weekday or weekend — enabling natural answers to "what time is it?" and
 *  day-aware personality ("hope your Monday's going well" etc.). */
function buildContextPrefix(): string {
  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July",
                  "August","September","October","November","December"];
  const day   = days[now.getDay()];
  const date  = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  let h = now.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const m    = now.getMinutes().toString().padStart(2, "0");
  const kind = now.getDay() === 0 || now.getDay() === 6 ? "weekend" : "weekday";
  return `[Context: ${day}, ${date}, ${h}:${m} ${ampm} IST, ${kind}]`;
}

async function fetchGroqReply(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    GROQ_WORKER_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(GROQ_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: userMessage,
        // Send last 6 turns so Groq has context for follow-up questions.
        // The user message we just added is excluded — Worker appends it.
        history: history.slice(-6),
      }),
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`Worker responded with ${res.status}`);
  }

  const data = await res.json();
  // Worker v2 returns { reply: "..." } — clean interface, no raw Groq JSON.
  const reply: string | undefined = data?.reply;

  if (!reply || reply.trim().length === 0) {
    throw new Error("Worker returned an empty reply");
  }

  // Strip any markdown the model snuck past the Worker's cleaning pass.
  return reply
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s/gm, "• ")
    .trim();
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mutePreferenceLoaded, setMutePreferenceLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: FAQ_GREETING,
      showSuggestions: true,
      /* Greeting starts in "thinking" so the first time the panel opens we
         get the same dots-then-typing reveal that ongoing replies use. The
         open-effect (further down) flips this into the streaming state. */
      isThinking: true,
      isTyping: false,
      displayText: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  // Entrance state — Mossie falls at the left edge, pauses at screen centre,
  // then continues to her bottom-right home position.
  const [settled, setSettled] = useState(true);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("pending");
  // Mossie pauses and waves at the midpoint of each entrance.
  const [waving, setWaving] = useState(false);
  // Pupils look forward while walking and track the cursor once settled.
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // Bumped to replay the same entrance on a double-click / double-tap.
  const [introRunId, setIntroRunId] = useState(0);
  // Hover state — true once the cursor has been over Mossie for the hover
  // delay. Drives the tooltip and the happy face on hover.
  const [hovered, setHovered] = useState(false);
  // Whether the tooltip is currently visible (combined hover-shown + auto-
  // shown). Final visibility also requires settled && !open.
  const [tooltipShown, setTooltipShown] = useState(false);

  const [recognitionCtor, setRecognitionCtor] =
    useState<SpeechRecognitionCtor | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const introRootRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(2);
  /** Conversation history sent to the Worker with every Groq call so the
   *  model can answer follow-up questions with context. Stored as a ref
   *  (not state) so pushing to it never triggers a re-render. Trimmed to
   *  GROQ_HISTORY_MAX entries and cleared whenever the panel closes. */
  const conversationHistoryRef = useRef<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  /* Tracks the in-flight per-character timer for the currently-streaming bot
     message so we can cancel it (snapping the message to its full text) when
     a new query arrives mid-stream or the panel closes. */
  const typingTimerRef = useRef<number | null>(null);
  /* Whether the user prefers reduced motion. Captured once on mount. When
     true we skip the thinking dots and per-char streaming entirely — the
     reply text appears immediately, just like the original behaviour. */
  const reducedMotionRef = useRef<boolean>(
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  /** Name captured from "my name is X" / "call me X" — injected into every
   *  subsequent Groq call so Mossie can address the user personally.
   *  Stored as a ref (no re-render) and cleared when the panel closes. */
  const capturedNameRef = useRef<string | null>(null);
  /** Whether the user has sent at least one message this panel session.
   *  Used to suppress the idle nudge if they've already been chatting. */
  const userHasChatted = useRef(false);
  /** Timer id for the 45-second idle nudge. Cleared on every message send
   *  and when the panel closes. */
  const idleNudgeTimerRef = useRef<number | null>(null);
  /** Guard so the idle nudge fires at most once per panel open. */
  const idleNudgeFiredRef = useRef(false);
  // Click delay timer — lets desktop double-clicks and mobile double-taps
  // replay Mossie's entrance instead of opening/closing the chat twice.
  const clickTimerRef = useRef<number | null>(null);
  // Hover delay timer — used to defer the tooltip by TOOLTIP_HOVER_DELAY_MS.
  const hoverTimerRef = useRef<number | null>(null);
  // Long-press timer — used on touch devices to detect a held press.
  const longPressTimerRef = useRef<number | null>(null);
  // Set true when a long-press fires, so the trailing click is suppressed.
  const longPressFiredRef = useRef(false);
  // Set true once the tooltip has auto-shown for the first time so it doesn't
  // re-trigger on every subsequent settle (e.g. after walk-again).
  const tooltipAutoShownRef = useRef(false);
  /* Ensures Mossie's greeting is spoken at most once per page session,
     no matter how many times the user opens and closes the chat panel. */
  const greetSpokenRef = useRef(false);

  /* Keep the server and first browser render identical, then enable
     viewport- and browser-specific chatbot behavior after hydration. */
  useEffect(() => {
    // Keep Mossie settled until the entrance reaches the walking phase.
    setSettled(true);
    const recognition = getRecognitionCtor();
    setRecognitionCtor(() => recognition);
  }, []);

  /* First-load and replay entrance — one requestAnimationFrame loop updates
   * only transform on a fixed root, so the page layout stays untouched and
   * React does not render on every animation frame. */
  useEffect(() => {
    const root = introRootRef.current;
    if (!root) {
      setIntroPhase("complete");
      return;
    }

    const homePosition = () => ({
      x: Math.max(0, window.innerWidth - BUBBLE_PX - EDGE_MARGIN),
      y: Math.max(0, window.innerHeight - BUBBLE_PX - EDGE_MARGIN),
    });
    const placeAtHome = () => {
      const home = homePosition();
      root.style.transform = `translate3d(${home.x}px, ${home.y}px, 0)`;
      root.style.opacity = "1";
      setWaving(false);
      setSettled(true);
      setIntroPhase("complete");
    };
    let frameId = 0;
    let startTimer = 0;
    let stopped = false;
    let phase: "flight" | "impact" | "walking" | "pause" | "returning" =
      "flight";
    let phaseStartedAt = 0;
    const finish = () => {
      if (stopped) return;
      stopped = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(startTimer);
      placeAtHome();
    };
    const handleResize = () => {
      if (!stopped) {
        finish();
        return;
      }
      const home = homePosition();
      root.style.transform = `translate3d(${home.x}px, ${home.y}px, 0)`;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      finish();
      return () => window.removeEventListener("resize", handleResize);
    }

    startTimer = window.setTimeout(() => {
      const start = { x: 18, y: -BUBBLE_PX };
      const landing = {
        x: EDGE_MARGIN,
        y: Math.max(4, window.innerHeight - BUBBLE_PX - EDGE_MARGIN),
      };
      const center = {
        x: Math.max(EDGE_MARGIN, (window.innerWidth - BUBBLE_PX) / 2),
        y: landing.y,
      };
      root.style.transform = `translate3d(${start.x}px, ${start.y}px, 0)`;
      root.style.opacity = "1";
      setIntroPhase("flight");

      const tick = (now: number) => {
        if (stopped) return;
        if (phaseStartedAt === 0) phaseStartedAt = now;
        const elapsed = now - phaseStartedAt;

        if (phase === "flight") {
          const progress = clamp01(elapsed / INTRO_FLIGHT_MS);
          const horizontalEase = 1 - Math.pow(1 - progress, 3);
          const x = start.x + (landing.x - start.x) * horizontalEase;
          // Accelerating downward gives the fall a gravity-like finish.
          const y = start.y + (landing.y - start.y) * progress * progress;
          root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          if (progress >= 1) {
            phase = "impact";
            phaseStartedAt = now;
            setIntroPhase("impact");
          }
        } else if (phase === "impact") {
          if (elapsed >= INTRO_IMPACT_MS) {
            phase = "walking";
            phaseStartedAt = now;
            setWaving(false);
            setSettled(false);
            setIntroPhase("walking");
          }
        } else if (phase === "walking") {
          const progress = clamp01(elapsed / INTRO_WALK_TO_CENTER_MS);
          const eased = easeInOutCubic(progress);
          const x = landing.x + (center.x - landing.x) * eased;
          root.style.transform = `translate3d(${x}px, ${center.y}px, 0)`;
          if (progress >= 1) {
            phase = "pause";
            phaseStartedAt = now;
            setWaving(true);
            setIntroPhase("pause");
          }
        } else if (phase === "pause") {
          if (elapsed >= INTRO_CENTER_PAUSE_MS) {
            phase = "returning";
            phaseStartedAt = now;
            setWaving(false);
            setIntroPhase("returning");
          }
        } else {
          const progress = clamp01(elapsed / INTRO_WALK_HOME_MS);
          const eased = easeInOutCubic(progress);
          const home = homePosition();
          const x = center.x + (home.x - center.x) * eased;
          const y = center.y + (home.y - center.y) * eased;
          root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          if (progress >= 1) {
            finish();
            return;
          }
        }

        frameId = window.requestAnimationFrame(tick);
      };

      frameId = window.requestAnimationFrame(tick);
    }, INTRO_START_DELAY_MS);

    return () => {
      stopped = true;
      window.clearTimeout(startTimer);
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [introRunId]);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(MUTE_KEY) === "1");
    } catch {
      setMuted(false);
    }
    setMutePreferenceLoaded(true);
  }, []);

  /* Persist mute preference. */
  useEffect(() => {
    if (!mutePreferenceLoaded) return;
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [mutePreferenceLoaded, muted]);

  /* Warm up the voice list (browsers populate it asynchronously). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    voiceRef.current = pickIndianVoice();
    const handler = () => {
      voiceRef.current = pickIndianVoice();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
  }, []);

  /* Auto-scroll to latest message + autofocus on open. */
  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      /* Only auto-focus the input on devices with a fine pointer + real
         hover (i.e. desktop with a mouse/trackpad). On phones and tablets,
         focusing the input would force the on-screen keyboard to slide
         up the moment the panel opens, hiding Mossie's greeting and the
         suggestion chips before the user has read them. The user can
         tap the input themselves when they actually want to type. */
      const isDesktopPointer =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!isDesktopPointer) return;
      const t = window.setTimeout(() => inputRef.current?.focus(), 220);
      return () => window.clearTimeout(t);
    }
    // Stop any speaking / listening when panel closes.
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setListening(false);
    // Clear conversation history, captured name, and activity flags so a
    // fresh session starts next open.
    if (!open) {
      conversationHistoryRef.current = [];
      capturedNameRef.current = null;
      userHasChatted.current = false;
      idleNudgeFiredRef.current = false;
      if (idleNudgeTimerRef.current !== null) {
        window.clearTimeout(idleNudgeTimerRef.current);
        idleNudgeTimerRef.current = null;
      }
    }
    /* Also snap any in-flight typing to its final text and clear its timer
       so reopening the panel doesn't reveal a stranded half-rendered reply
       or restart the per-character cadence from where it left off. */
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "bot" && (m.isThinking || m.isTyping)
          ? {
              ...m,
              isThinking: false,
              isTyping: false,
              displayText: m.text,
            }
          : m,
      ),
    );
  }, [open]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (idleNudgeTimerRef.current !== null) {
        window.clearTimeout(idleNudgeTimerRef.current);
        idleNudgeTimerRef.current = null;
      }
    };
  }, []);

  /* While walking, pupils look forward; they centre during the midpoint wave. */
  useEffect(() => {
    if (settled) return;
    if (waving) {
      setPupilOffset({ x: 0, y: 0 });
    } else {
      setPupilOffset({ x: 1.2, y: 0 });
    }
  }, [settled, waving]);

  /* Once settled (and the panel is closed), pupils gently track the cursor
   * around the page — a small detail that makes Mossie feel alive. */
  useEffect(() => {
    if (!settled || open) return;
    const handler = (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Capped at ±1.6 px so pupils never leave the eye-whites. Gentle ramp
      // so far-away cursor positions still produce a small, readable shift.
      const max = 1.6;
      const factor = Math.min(max, dist / 80);
      setPupilOffset({
        x: (dx / dist) * factor,
        y: (dy / dist) * factor,
      });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [settled, open]);

  /* Opening the panel after the entrance has completed settles Mossie. */
  useEffect(() => {
    if (open && introPhase === "complete" && !settled) setSettled(true);
  }, [open, introPhase, settled]);

  /* Auto-show the tooltip the first time Mossie settles (so users on touch
   * / hover-less devices still see her introduction). Fires once per page
   * load — subsequent walk-again replays don't re-pop the tooltip. */
  useEffect(() => {
    if (!settled || tooltipAutoShownRef.current) return;
    tooltipAutoShownRef.current = true;
    setTooltipShown(true);
    const t = window.setTimeout(
      () => setTooltipShown(false),
      TOOLTIP_AUTOSHOW_MS,
    );
    return () => window.clearTimeout(t);
  }, [settled]);

  /* Cleanup all pending interaction timers on unmount. */
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current)
        window.clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (muted) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleanForSpeech(text));
      utter.lang = "en-IN";
      // Slightly slower + slightly higher pitch reads as warmer and more
      // feminine — gives Mossie a friendlier brand voice on top of the
      // gender-biased voice selection above.
      utter.rate = 0.97;
      utter.pitch = 1.15;
      const v = voiceRef.current ?? pickIndianVoice();
      if (v) utter.voice = v;
      window.speechSynthesis.speak(utter);
    },
    [muted],
  );

  /* Snap any in-flight bot message (thinking-dots OR per-character typing)
     to its complete text and cancel pending timers. Used when the user fires
     a new query mid-stream, or when the panel closes — so we never leave a
     half-rendered message stranded behind. */
  const completeAllInFlight = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "bot" && (m.isThinking || m.isTyping)
          ? {
              ...m,
              isThinking: false,
              isTyping: false,
              displayText: m.text,
            }
          : m,
      ),
    );
  }, []);

  /* Drive a bot message through: (1) thinking dots → (2) speak + per-char
     reveal → (3) settled. Voice begins the moment the typing starts so the
     spoken reply and the visual stream arrive together. Honors reduced-
     motion by short-circuiting straight to the final state + speech. */
  const streamMessage = useCallback(
    (messageId: number, fullText: string) => {
      /* Reduced-motion / no-window: skip the show, jump to the answer. */
      if (reducedMotionRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isThinking: false,
                  isTyping: false,
                  displayText: fullText,
                }
              : m,
          ),
        );
        speak(fullText);
        return;
      }

      /* Phase 1 — make sure the message starts in the dots-state. */
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isThinking: true, isTyping: false, displayText: "" }
            : m,
        ),
      );

      /* Phase 2 — after the thinking pause, flip into typing and start the
         per-character reveal. Speech kicks off here so the voice and the
         visible text arrive together. */
      typingTimerRef.current = window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isThinking: false, isTyping: true, displayText: "" }
              : m,
          ),
        );
        speak(fullText);

        let i = 0;
        const tick = () => {
          i += 1;
          const next = fullText.slice(0, i);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, displayText: next } : m,
            ),
          );
          if (i >= fullText.length) {
            /* Phase 3 — done. Drop the typing flag so the caret disappears
               and any suggestion chips are allowed to render. */
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId
                  ? { ...m, isTyping: false, displayText: fullText }
                  : m,
              ),
            );
            typingTimerRef.current = null;
            return;
          }
          /* Pause a touch longer after sentence/clause punctuation so the
             rhythm reads natural rather than flat. */
          const lastChar = fullText.charAt(i - 1);
          const extra = ".!?,;:".includes(lastChar) ? TYPE_PUNCT_EXTRA_MS : 0;
          typingTimerRef.current = window.setTimeout(
            tick,
            TYPE_CHAR_INTERVAL_MS + extra,
          );
        };
        typingTimerRef.current = window.setTimeout(tick, TYPE_CHAR_INTERVAL_MS);
      }, THINKING_DELAY_MS);
    },
    [speak],
  );

  /* Idle nudge — 45 seconds after the panel opens with no user message sent,
   * fire one gentle prompt. Never repeats within a session; resets on close. */
  useEffect(() => {
    if (!open) return;
    idleNudgeFiredRef.current = false;
    idleNudgeTimerRef.current = window.setTimeout(() => {
      if (idleNudgeFiredRef.current) return;
      idleNudgeFiredRef.current = true;
      const nudgeText =
        "Wondering where to start? You can ask me about bookMySlot, our pricing, or how to get in touch.";
      const botId = nextId.current++;
      setMessages((prev) => {
        if (prev.some((m) => m.role === "user")) return prev;
        return [
          ...prev,
          { id: botId, role: "bot", text: nudgeText, showSuggestions: true,
            isThinking: true, isTyping: false, displayText: "" },
        ];
      });
      streamMessage(botId, nudgeText);
    }, 45_000);
    return () => {
      if (idleNudgeTimerRef.current !== null) {
        window.clearTimeout(idleNudgeTimerRef.current);
        idleNudgeTimerRef.current = null;
      }
    };
  }, [open, streamMessage]);

  /* On the first time the user opens the chat in this page session, kick off
     the greeting's stream — dots first, then her voice + the typed reveal.
     `speak()` already no-ops when `muted` is true and when the browser has
     no SpeechSynthesis support, so voice prefs are honored automatically.
     A small delay lets the panel mount first so the bubble is on screen
     before the dots appear. */
  useEffect(() => {
    if (!open) return;
    if (greetSpokenRef.current) return;
    greetSpokenRef.current = true;
    const t = window.setTimeout(() => streamMessage(1, FAQ_GREETING), 320);
    return () => window.clearTimeout(t);
  }, [open, streamMessage]);

  const sendQuery = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      /* Reject walls of text before any processing — mirrors Worker Layer 2
         and avoids feeding a massive string into the FAQ scorer. */
      if (text.length > INPUT_MAX_CHARS) {
        const botId = nextId.current++;
        const reply =
          "That message is a little long for me — could you summarise in a " +
          "sentence or two? I'm best at specific Mossaic questions.";
        setMessages((prev) => [
          ...prev,
          { id: nextId.current++, role: "user", text },
          { id: botId, role: "bot", text: reply, showSuggestions: false,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        streamMessage(botId, reply);
        return;
      }

      /* Snap any still-streaming bot reply to its full text and cancel any
         in-flight speech before starting a new turn. */
      completeAllInFlight();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      /* Cancel any pending idle nudge — the user is active now. */
      if (idleNudgeTimerRef.current !== null) {
        window.clearTimeout(idleNudgeTimerRef.current);
        idleNudgeTimerRef.current = null;
      }
      userHasChatted.current = true;

      const userMsg: Message = { id: nextId.current++, role: "user", text };

      /* B2 — Capture the user's name for personalised Groq replies. Runs on
         every message so it picks up a name even mid-conversation. */
      const nameMatch = NAME_CAPTURE_RE.exec(text);
      if (nameMatch?.[1]) capturedNameRef.current = nameMatch[1];

      /* ── Guard: pure punctuation / pause signals ("...", "??", "!") ────
       * These never score in the FAQ matcher and aren't worth an API call.
       * Reply with the same quiet acknowledgement as "hmm" / "hold on". */
      if (/^[\W\s]+$/.test(text)) {
        const reply = "Take your time — I'm right here whenever you're ready.";
        const botId = nextId.current++;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { id: botId, role: "bot", text: reply, showSuggestions: false,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        streamMessage(botId, reply);
        return;
      }

      /* ── Path 1: Malayalam ──────────────────────────────────────────────
       * If the user typed in Malayalam script, pass to Groq with a language
       * note so Mossie can genuinely converse in Malayalam and ask if they'd
       * like to continue in English. Hardcoded greeting is kept as fallback
       * so there's always a reply even if the Worker is unreachable. */
      if (/[\u0D00-\u0D7F]/.test(text)) {
        const MALAYALAM_FALLBACK =
          "നമസ്കാരം! ഞാൻ Mossie — Mossaic-ന്റെ FAQ helper. നിങ്ങളെ സഹായിക്കാൻ സന്തോഷം. ഇംഗ്ലീഷിൽ ചോദിച്ചാൽ കൂടുതൽ വിശദമായ ഉത്തരങ്ങൾ നൽകാം.";
        const botId = nextId.current++;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { id: botId, role: "bot", text: "", showSuggestions: false,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        const mlSnapshot = [...conversationHistoryRef.current];
        (async () => {
          let reply: string;
          let groqSucceeded = false;
          try {
            reply = await fetchGroqReply(
              `[Language: User wrote in Malayalam. Greet warmly in Malayalam, then ask if they want to continue in English or Malayalam.] ${buildContextPrefix()} ${text}`,
              mlSnapshot,
            );
            groqSucceeded = true;
          } catch {
            reply = MALAYALAM_FALLBACK;
          }
          if (groqSucceeded) {
            conversationHistoryRef.current = [
              ...mlSnapshot,
              { role: "user" as const,      content: text  },
              { role: "assistant" as const, content: reply },
            ].slice(-GROQ_HISTORY_MAX);
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, text: reply } : m)),
          );
          streamMessage(botId, reply);
        })();
        return;
      }

      /* ── Path 2: FAQ match ──────────────────────────────────────────────
       * Known question — answer instantly from the local dataset. Zero
       * network cost, zero latency, 100% brand-controlled. */
      const faq = findBestFaq(text);
      if (faq) {
        const reply = faq.dynamicAnswer ? faq.dynamicAnswer() : faq.answer;
        const botId = nextId.current++;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { id: botId, role: "bot", text: reply,
            showSuggestions: faq.showSuggestions ?? false, faqId: faq.id,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        streamMessage(botId, reply);
        return;
      }

      /* ── Path 3: Groq fallback ──────────────────────────────────────────
       * No FAQ entry matched. Three local guards run first (jailbreak,
       * profanity, length already checked above) so obvious bad inputs
       * never hit the API. Everything else goes to Worker → Groq.
       * Conversation history is passed so Groq can answer follow-up
       * questions with context. On any error (network, timeout, Worker
       * 5xx, empty body) the UI falls back to the default reply string —
       * the user never sees a blank message or an infinite spinner. */
      if (JAILBREAK_RE.some((re) => re.test(text))) {
        const botId = nextId.current++;
        const reply =
          "I'm a focused FAQ helper for Mossaic — I can't step outside " +
          "that role. Is there something about our products or company I " +
          "can help with?";
        setMessages((prev) => [
          ...prev,
          userMsg,
          { id: botId, role: "bot", text: reply, showSuggestions: false,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        streamMessage(botId, reply);
        return;
      }

      if (PROFANITY_RE.test(text)) {
        const botId = nextId.current++;
        const reply = FALLBACK_REPLIES.profanity;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { id: botId, role: "bot", text: reply, showSuggestions: false,
            isThinking: true, isTyping: false, displayText: "" },
        ]);
        setInput("");
        streamMessage(botId, reply);
        return;
      }

      const botId = nextId.current++;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: botId, role: "bot", text: "", showSuggestions: false,
          isThinking: true, isTyping: false, displayText: "" },
      ]);
      setInput("");

      // Snapshot history before the async call — the ref may mutate if the
      // user fires another message while we're waiting for Groq.
      const historySnapshot = [...conversationHistoryRef.current];

      /* Build the enhanced message sent to Groq.
         B1 — prepend date/time/day context so the model can answer time
              questions and use day-aware personality.
         B2 — prepend the captured name so Mossie can address the user.
         B3 — prepend an empathy note when frustration is detected.
         The raw `text` is still what goes into conversationHistoryRef so
         history stays clean for the model's context window. */
      let groqMessage = `${buildContextPrefix()} ${text}`;
      if (capturedNameRef.current) {
        groqMessage = `[User's name: ${capturedNameRef.current}] ${groqMessage}`;
      }
      if (FRUSTRATION_RE.test(text)) {
        groqMessage = `[Note: User seems frustrated. Lead with empathy.] ${groqMessage}`;
      }

      (async () => {
        let reply: string;
        let groqSucceeded = false;
        try {
          reply = await fetchGroqReply(groqMessage, historySnapshot);
          groqSucceeded = true;
        } catch {
          reply = FALLBACK_REPLIES.default;
        }

        /* Push this turn into conversation history only when Groq actually
           answered — fallback strings aren't real AI turns and would confuse
           the model's context on the next call. */
        if (groqSucceeded) {
          conversationHistoryRef.current = [
            ...historySnapshot,
            { role: "user" as const,      content: text  },
            { role: "assistant" as const, content: reply },
          ].slice(-GROQ_HISTORY_MAX);
        }

        /* Patch the stored text so completeAllInFlight() snaps to the right
           string if the user sends another message before this one finishes. */
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: reply } : m)),
        );
        streamMessage(botId, reply);
      })();
    },
    [completeAllInFlight, streamMessage],
  );

  const handleSuggestion = useCallback(
    (faq: Faq) => {
      sendQuery(faq.question);
    },
    [sendQuery],
  );

  const startListening = useCallback(() => {
    if (!recognitionCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    try {
      const rec = new recognitionCtor();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) sendQuery(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  }, [recognitionCtor, listening, sendQuery]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendQuery(input);
    },
    [input, sendQuery],
  );

  const lastBotIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "bot") return i;
    }
    return -1;
  }, [messages]);

  /* Replay the same entrance sequence on a double-click / double-tap. */
  const triggerWalkAgain = useCallback(() => {
    if (!settled) return;
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setSettled(true);
    setWaving(false);
    setHovered(false);
    setTooltipShown(false);
    setIntroPhase("pending");
    setIntroRunId((runId) => runId + 1);
  }, [settled]);

  /* Single clicks open the panel after a short delay. A second click inside
   * the same window replays the entrance instead (works for touch taps too). */
  const handleBubbleClick = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      triggerWalkAgain();
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      setSettled(true);
      setOpen((o) => !o);
    }, CLICK_DELAY_MS);
  }, [triggerWalkAgain]);

  /* Hover handlers — show the tooltip after a small delay so quick mouse
   * fly-bys don't flash it. */
  const handleBubbleMouseEnter = useCallback(() => {
    setHovered(true);
    if (hoverTimerRef.current) return;
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null;
      setTooltipShown(true);
    }, TOOLTIP_HOVER_DELAY_MS);
  }, []);

  const handleBubbleMouseLeave = useCallback(() => {
    setHovered(false);
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTooltipShown(false);
  }, []);

  /* Long-press remains an alternate replay gesture for touch users. */
  const handleBubbleTouchStart = useCallback(() => {
    if (!settled) return;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      longPressFiredRef.current = true;
      triggerWalkAgain();
    }, LONG_PRESS_MS);
  }, [settled, triggerWalkAgain]);

  const handleBubbleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <>
      {/* ── Floating action button (Mossie) ──────────────────────────────
       *  The fixed root is moved by the shared first-load / replay sequence. */}
      <div
        ref={introRootRef}
        className="fixed left-0 top-0 z-[900]"
        aria-hidden={introPhase !== "complete"}
        style={{
          width: BUBBLE_PX,
          height: BUBBLE_PX,
          opacity: introPhase === "pending" ? 0 : 1,
          pointerEvents: introPhase === "complete" ? "auto" : "none",
          willChange: introPhase === "complete" ? "auto" : "transform",
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <div
          aria-hidden
          className={`mossie-intro-trail${introPhase === "flight" ? " is-active" : ""}`}
        >
          <span className="mossie-intro-trail-dot mossie-intro-trail-dot--bright" />
          <span className="mossie-intro-trail-dot mossie-intro-trail-dot--mid" />
          <span className="mossie-intro-trail-dot mossie-intro-trail-dot--dim" />
        </div>
        <span
          aria-hidden
          className={`mossie-intro-core${introPhase === "flight" || introPhase === "impact" ? " is-active" : ""}`}
        />
        <div
          aria-hidden
          className={`mossie-intro-smoke${introPhase === "impact" ? " is-active" : ""}`}
        >
          {SMOKE_PUFFS.map((puff, index) => (
            <span
              key={`intro-smoke-${index}`}
              className={`mossie-smoke-puff mossie-smoke-puff--${puff.tone}`}
              style={{
                left: `calc(50% + ${puff.x}px)`,
                top: `calc(50% + ${puff.y}px)`,
                width: puff.size,
                height: puff.size,
                animationDelay: `${puff.delay}ms`,
              }}
            />
          ))}
        </div>
        <div className="mossie-impact-effects" aria-hidden>
          <span
            className={`mossie-impact-ring${introPhase === "impact" ? " is-active" : ""}`}
          />
          {IMPACT_SPARKS.map((spark, index) => (
            <span
              key={`impact-spark-${index}`}
              className={`mossie-impact-spark${introPhase === "impact" ? " is-active" : ""}`}
              style={
                {
                  "--spark-x": `${spark.x}px`,
                  "--spark-y": `${spark.y}px`,
                  animationDelay: `${index * 12}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      <motion.div
        className="absolute left-0 top-0 z-[900]"
        style={{ width: BUBBLE_PX, height: BUBBLE_PX }}
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity:
            introPhase === "impact" ||
            introPhase === "walking" ||
            introPhase === "pause" ||
            introPhase === "returning" ||
            introPhase === "complete"
              ? 1
              : 0,
          x: 0,
        }}
        transition={{
          opacity: { duration: introPhase === "impact" ? 0.3 : 0 },
          x: { duration: 0 },
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 100%",
          }}
          initial={{ scale: 0 }}
          animate={{
            scale:
              introPhase === "impact"
                ? [0, 1.18, 0.92, 1]
                : introPhase === "walking" ||
                    introPhase === "pause" ||
                    introPhase === "returning" ||
                    introPhase === "complete"
                  ? 1
                  : 0,
          }}
          transition={{
            scale:
              introPhase === "impact"
                ? {
                    duration: INTRO_IMPACT_MS / 1000,
                    ease: "easeOut",
                    times: [0, 0.42, 0.7, 1],
                  }
                : { duration: 0.18, ease: "easeOut" },
          }}
        >
          <motion.button
            ref={btnRef}
            type="button"
            onClick={handleBubbleClick}
            onMouseEnter={handleBubbleMouseEnter}
            onMouseLeave={handleBubbleMouseLeave}
            onTouchStart={handleBubbleTouchStart}
            onTouchEnd={handleBubbleTouchEnd}
            onTouchCancel={handleBubbleTouchEnd}
            aria-label={open ? "Close Mossie" : "Open Mossie"}
            aria-expanded={open}
            tabIndex={introPhase === "complete" ? 0 : -1}
            className="relative flex items-center justify-center rounded-full text-white"
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, #0a1628 0%, #11233b 100%)",
              border: `1px solid ${ACCENT}`,
              touchAction: "manipulation",
              boxShadow:
                "0 12px 32px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.06), 0 0 28px -6px rgba(34,211,238,0.45)",
            }}
            // Hover/tap pop only fires when she's settled — otherwise an
            // accidental hover during the walk would jump her to full size
            // and break the "from afar" illusion.
            whileHover={settled ? { scale: 1.05 } : undefined}
            whileTap={settled ? { scale: 0.94 } : undefined}
            initial={{ scaleX: 0.92, scaleY: 0.92 }}
            animate={{
              // Small gait while moving; hold the body still for the wave.
              y: settled ? 0 : waving ? 0 : [0, -8, 0],
              scaleX: settled ? 1 : waving ? 1.04 : [1.06, 0.94, 1.06],
              scaleY: settled ? 1 : waving ? 1.04 : [0.94, 1.06, 0.94],
            }}
            transition={{
              y: settled
                ? { duration: 0.25, ease: "easeOut" }
                : waving
                  ? { duration: 0.3, ease: "easeOut" }
                  : { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
              scaleX: settled
                ? { duration: 0.25, ease: "easeOut" }
                : waving
                  ? { duration: 0.3, ease: "easeOut" }
                  : { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
              scaleY: settled
                ? { duration: 0.25, ease: "easeOut" }
                : waving
                  ? { duration: 0.3, ease: "easeOut" }
                  : { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
            }}
          >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              <X size={22} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              {/* Mossie's face changes while walking, waving and settled. */}
              <MossieFace
                expression={
                  waving || (hovered && settled)
                    ? "happy"
                    : settled
                      ? "idle"
                      : "walking"
                }
                pupilOffset={pupilOffset}
              />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Mossie's two stepping feet — small cyan dots that lift and shift
            forward in alternating phase, like little stepping motions. No leg
            shaft connecting them to the body, which keeps the look minimal
            and matches the dot-and-curve face above. They plant flat and
            still during the mid-walk wave, then fade up into the body once
            she settles in her home spot. */}
        {/* Left foot — lifts first half of the cycle, plants second half. */}
        <motion.span
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          animate={{
            opacity: settled ? 0 : 1,
            scaleX: settled ? 0.3 : 1,
            scaleY: settled ? 0.3 : 1,
            y: settled ? 0 : waving ? 0 : [0, -3, 0],
            x: settled ? 0 : waving ? 0 : [0, 2, 0],
          }}
          transition={{
            opacity: { duration: 0.3, ease: "easeOut" },
            scaleX: { duration: 0.3, ease: "easeOut" },
            scaleY: { duration: 0.3, ease: "easeOut" },
            y: settled
              ? { duration: 0.25, ease: "easeOut" }
              : waving
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
            x: settled
              ? { duration: 0.25, ease: "easeOut" }
              : waving
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            width: 5,
            height: 5,
            bottom: -3,
            left: "calc(50% - 6px)",
            background:
              "radial-gradient(circle at 35% 35%, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.85) 60%, rgba(34,211,238,0.7) 100%)",
            boxShadow: "0 0 6px rgba(34,211,238,0.6)",
          }}
        />
        {/* Right foot — opposite phase: planted while left foot lifts. */}
        <motion.span
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          animate={{
            opacity: settled ? 0 : 1,
            scaleX: settled ? 0.3 : 1,
            scaleY: settled ? 0.3 : 1,
            y: settled ? 0 : waving ? 0 : [-3, 0, -3],
            x: settled ? 0 : waving ? 0 : [2, 0, 2],
          }}
          transition={{
            opacity: { duration: 0.3, ease: "easeOut" },
            scaleX: { duration: 0.3, ease: "easeOut" },
            scaleY: { duration: 0.3, ease: "easeOut" },
            y: settled
              ? { duration: 0.25, ease: "easeOut" }
              : waving
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
            x: settled
              ? { duration: 0.25, ease: "easeOut" }
              : waving
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            width: 5,
            height: 5,
            bottom: -3,
            left: "calc(50% + 1px)",
            background:
              "radial-gradient(circle at 35% 35%, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.85) 60%, rgba(34,211,238,0.7) 100%)",
            boxShadow: "0 0 6px rgba(34,211,238,0.6)",
          }}
        />

        {/* Soft pulsing halo — only after Mossie has settled in her home spot
            and only while the panel is closed. Suppressed during the walk so
            the bubble feels alive (walking) rather than asking-for-attention. */}
        {!open && settled && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: "0 0 0 0 rgba(34,211,238,0.45)",
              animation: "mossaic-chat-pulse 2.4s ease-out infinite",
            }}
          />
        )}
          </motion.button>
        </motion.div>
        </motion.div>
      </div>

      {/* ── Hover/intro tooltip — small dark pill above Mossie ─────────── */}
      <AnimatePresence>
        {introPhase === "complete" && tooltipShown && settled && !open && (
          <motion.div
            key="mossie-tooltip"
            aria-hidden
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed z-[898] pointer-events-none"
            style={{ right: 24, bottom: 24 + BUBBLE_PX + 12 }}
            role="tooltip"
          >
            <div className="relative">
              <div
                className="text-[12px] font-medium leading-tight whitespace-nowrap"
                style={{
                  background: "rgba(10, 22, 40, 0.96)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: `1px solid ${ACCENT_SOFT}`,
                  borderRadius: 12,
                  padding: "7px 12px",
                  color: "rgba(186, 230, 253, 0.95)",
                  boxShadow:
                    "0 6px 20px -6px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.05), 0 0 18px -6px rgba(34,211,238,0.35)",
                }}
              >
                {TOOLTIP_TEXT}
              </div>
              {/* Small downward tail aligned over the bubble's centre. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: 22,
                  bottom: -5,
                  width: 10,
                  height: 10,
                  background: "rgba(10, 22, 40, 0.96)",
                  borderRight: `1px solid ${ACCENT_SOFT}`,
                  borderBottom: `1px solid ${ACCENT_SOFT}`,
                  transform: "rotate(45deg)",
                  borderBottomRightRadius: 2,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.button
            key="chat-backdrop"
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            /* Only shown on small viewports — gives mobile users a tap-
               outside-to-close affordance since the panel covers most
               of the screen. */
            className="sm:hidden fixed inset-0 z-[898] bg-black/45"
          />
        )}
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed z-[899] flex flex-col text-white"
            style={{
              right: 24,
              bottom: 96,
              width: "min(92vw, 380px)",
              height: "min(72vh, 540px)",
              borderRadius: 18,
              background: "rgba(10, 22, 40, 0.96)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: `1px solid ${ACCENT_SOFT}`,
              boxShadow:
                "0 24px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,211,238,0.05), 0 0 36px -10px rgba(34,211,238,0.28)",
            }}
            role="dialog"
            aria-label="Mossie · Mossaic FAQ helper"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span
                aria-hidden
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: "rgba(34,211,238,0.12)",
                  border: `1px solid ${ACCENT_SOFT}`,
                }}
              >
                <MessageCircle size={15} className="text-cyan-300" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight">
                  Mossie
                </div>
                <div className="text-[11px] text-white/50 leading-tight">
                  Your Mossaic FAQ helper
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute voice" : "Mute voice"}
                aria-pressed={muted}
                className="flex items-center justify-center rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                title={muted ? "Voice off" : "Voice on"}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{ scrollbarWidth: "thin" }}
            >
              {messages.map((m, idx) => (
                <div key={m.id} className="space-y-2">
                  <div
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className="text-[13px] leading-relaxed px-3 py-2 max-w-[85%]"
                      /* `aria-live` only on the bot bubble — and only `polite`
                         so screen readers announce the final text once the
                         streaming reveal completes, instead of spamming on
                         every character. */
                      aria-live={m.role === "bot" ? "polite" : undefined}
                      style={
                        m.role === "user"
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.10) 100%)",
                              border: `1px solid ${ACCENT_SOFT}`,
                              borderRadius: "14px 14px 4px 14px",
                              color: "#e6faff",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "14px 14px 14px 4px",
                              color: "rgba(255,255,255,0.92)",
                            }
                      }
                    >
                      {m.role === "bot" && m.isThinking ? (
                        /* Three pulsing cyan dots — "someone is typing on
                           the other end". Staggered animation-delay gives
                           the classic wave rhythm. */
                        <span
                          aria-label="Mossie is typing"
                          className="inline-flex items-center gap-1 py-0.5"
                        >
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              aria-hidden
                              className="inline-block rounded-full"
                              style={{
                                width: 6,
                                height: 6,
                                background: "rgba(165,243,252,0.85)",
                                animation:
                                  "mossaic-typing-dot 1.2s ease-in-out infinite",
                                animationDelay: `${i * 0.18}s`,
                              }}
                            />
                          ))}
                        </span>
                      ) : m.role === "bot" && m.isTyping ? (
                        /* Per-character reveal + a soft blinking caret while
                           the stream is in flight. */
                        <>
                          {m.displayText ?? ""}
                          <span
                            aria-hidden
                            className="inline-block align-baseline ml-[2px]"
                            style={{
                              width: 2,
                              height: "0.95em",
                              background: "rgba(165,243,252,0.85)",
                              transform: "translateY(2px)",
                              animation:
                                "mossaic-typing-caret 1s steps(1, end) infinite",
                            }}
                          />
                        </>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>

                  {/* Suggestion chips — only on the latest bot message that
                      asks for them, and only once the message has finished
                      streaming (otherwise they'd float under an empty bubble
                      while the dots are still pulsing). */}
                  {m.role === "bot" &&
                    m.showSuggestions &&
                    !m.isThinking &&
                    !m.isTyping &&
                    idx === lastBotIndex &&
                    (() => {
                      /* Per-FAQ contextual chips override the global menu.
                         If the matched FAQ defines `nextChips` (an array of
                         FAQ ids), surface only those — useful for routing a
                         user from a product answer (e.g. bookMySlot) into
                         the most likely follow-ups (Pricing, Demo, …).
                         Falls back to the global chip menu otherwise. */
                      const sourceFaq = m.faqId
                        ? FAQS.find((f) => f.id === m.faqId)
                        : undefined;
                      const chipFaqs =
                        sourceFaq?.nextChips && sourceFaq.nextChips.length > 0
                          ? sourceFaq.nextChips
                              .map((id) => FAQS.find((f) => f.id === id))
                              .filter((f): f is Faq => Boolean(f))
                          : FAQS.filter((f) => !f.hideFromChips);
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {chipFaqs.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleSuggestion(f)}
                              className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                              style={{
                                background: "rgba(34,211,238,0.06)",
                                border: `1px solid ${ACCENT_SOFT}`,
                                color: "rgba(186,230,253,0.95)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(34,211,238,0.14)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(34,211,238,0.06)";
                              }}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-1 px-3 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                role="note"
                className="px-1 text-[11px] leading-relaxed text-white/55"
              >
                FAQ answers stay in your browser. For Malayalam or questions
                the FAQ can&apos;t answer, your message and up to six recent
                chat messages are sent via our Cloudflare Worker to Groq. A
                name you shared may be included. Please don&apos;t share
                sensitive information.
              </p>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    listening ? "Listening…" : "Ask about Mossaic or bookMySlot"
                  }
                  aria-label="Type your question"
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/35 text-white px-2 py-2 rounded-md"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                />

                {recognitionCtor && (
                  <button
                    type="button"
                    onClick={startListening}
                    aria-label={listening ? "Stop listening" : "Speak your question"}
                    aria-pressed={listening}
                    className="flex items-center justify-center rounded-md transition-all"
                    style={{
                      width: 36,
                      height: 36,
                      background: listening
                        ? "rgba(34,211,238,0.22)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        listening ? ACCENT : "rgba(255,255,255,0.08)"
                      }`,
                      color: listening ? "#22d3ee" : "rgba(255,255,255,0.75)",
                      boxShadow: listening
                        ? "0 0 18px -4px rgba(34,211,238,0.6)"
                        : "none",
                    }}
                    title={listening ? "Stop listening" : "Speak your question"}
                  >
                    <Mic size={15} />
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Send"
                  disabled={!input.trim()}
                  className="flex items-center justify-center rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    width: 36,
                    height: 36,
                    background:
                      "linear-gradient(135deg, rgba(34,211,238,0.85) 0%, rgba(34,211,238,0.65) 100%)",
                    color: "#04141f",
                    border: `1px solid ${ACCENT}`,
                    boxShadow: "0 4px 14px -4px rgba(34,211,238,0.55)",
                  }}
                >
                  <Send size={14} strokeWidth={2.4} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
