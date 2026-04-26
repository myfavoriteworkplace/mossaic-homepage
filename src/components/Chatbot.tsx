import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Mic, Volume2, VolumeX } from "lucide-react";
import { FAQS, FAQ_GREETING, FAQ_FALLBACK, type Faq } from "../data/faqs";

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
};

const MUTE_KEY = "mossaic.chatbot.muted";
const ACCENT = "rgba(34, 211, 238, 0.55)";
const ACCENT_SOFT = "rgba(34, 211, 238, 0.18)";

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
  return bestScore > 0 ? best : null;
}

/* ── Walk-in animation constants ────────────────────────────────────────── */

/** Seconds to traverse the bottom from the left edge to home (includes all
 *  mid-walk wave pauses — see WAVE_STARTS_S / WAVE_DURATION_S). */
const WALK_DURATION_S = 13.4;
/** Distance in pixels from Mossie within which the cursor "spooks" her home. */
const PROXIMITY_PX = 140;
/** Bubble width — used to compute the walk distance. */
const BUBBLE_PX = 56;
/** Side margin on both edges (matches `bottom-6 right-6` = 24px). */
const EDGE_MARGIN = 24;
/** Below this viewport width the walk is skipped (too little room). */
const MIN_WALK_VIEWPORT = 480;
/** Seconds the wave lasts. Body x-translation is held still for this long. */
const WAVE_DURATION_S = 1.4;
/** Seconds into the walk when each wave begins. Three evenly-spaced waves so
 *  Mossie greets the user halfway to mid-screen, at mid-screen, and halfway
 *  past mid-screen. Math: 4 walking legs of ~2.3s each + 3 wave pauses of
 *  1.4s each ≈ WALK_DURATION_S (13.4s). */
const WAVE_STARTS_S = [2.3, 6.0, 9.7];
/** Fraction of the walk distance Mossie has covered when each wave begins.
 *  Must be in the same order as WAVE_STARTS_S. */
const WAVE_AT_PCTS = [0.25, 0.5, 0.75];
/** Seconds for the walk-out animation when the user double-clicks Mossie to
 *  send her on another stroll. Faster than the walk-in (no wave pause). */
const OUT_DURATION_S = 3.5;
/** Milliseconds the open-chat click is debounced so a double-click can be
 *  detected first. Cost: ~250ms perceived latency on single-click open. */
const CLICK_DELAY_MS = 250;
/** Milliseconds the user must hold a touch on Mossie to trigger walk-again. */
const LONG_PRESS_MS = 600;
/** Milliseconds the cursor must hover Mossie before the tooltip appears. */
const TOOLTIP_HOVER_DELAY_MS = 200;
/** Milliseconds the tooltip auto-shows the first time Mossie settles, then
 *  hides — so users on hover-less devices still see her introduction. */
const TOOLTIP_AUTOSHOW_MS = 2500;
/** Phrase shown in Mossie's hover/auto-show tooltip. */
const TOOLTIP_TEXT = "Mossie here — ask me anything";

/** Compute the maximum leftward translation for the walk-in. */
function computeWalkDistance(): number {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  if (window.innerWidth < MIN_WALK_VIEWPORT) return 0;
  return Math.max(0, window.innerWidth - BUBBLE_PX - EDGE_MARGIN * 2);
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

/* ── Component ──────────────────────────────────────────────────────────── */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_KEY) === "1";
  });
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "bot", text: FAQ_GREETING, showSuggestions: true },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  // Walk-in state — Mossie enters from the far-left, strolls to her home spot
  // in the bottom-right, pauses mid-screen to wave at the user, and "settles"
  // when the user comes near, taps, opens the chat, or the walk timer ends.
  const [walkDistance] = useState<number>(() => computeWalkDistance());
  const [settled, setSettled] = useState<boolean>(() => computeWalkDistance() === 0);
  // Mid-walk wave state. While `waving` is true, body x is held still and the
  // face switches to a happy expression with a small waving "hand".
  const [waving, setWaving] = useState(false);
  // Brief surprise reaction the moment the cursor enters the spook radius —
  // mouth becomes a small "o" and eyes widen for a beat before settling.
  const [spooked, setSpooked] = useState(false);
  // Where the pupils look. Forward (+x) while walking, mouse-tracked when
  // settled. Centred during wave / surprise via the face component itself.
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // Walk-again state — when the user double-clicks (or long-presses on touch)
  // Mossie at her home spot, she walks left across the screen, then loops
  // back and walks in again from the start.
  const [walkingOut, setWalkingOut] = useState(false);
  // Bumped each time a fresh walk-in cycle should start. Used as a dependency
  // on the walk-in lifecycle effects so they re-arm on each replay.
  const [walkInToken, setWalkInToken] = useState(0);
  // Hover state — true once the cursor has been over Mossie for the hover
  // delay. Drives the tooltip and the happy face on hover.
  const [hovered, setHovered] = useState(false);
  // Whether the tooltip is currently visible (combined hover-shown + auto-
  // shown). Final visibility also requires settled && !open.
  const [tooltipShown, setTooltipShown] = useState(false);

  const recognitionCtor = useMemo(() => getRecognitionCtor(), []);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const nextId = useRef(2);
  // Guard so the spook reaction only fires once per walk.
  const spookFiredRef = useRef(false);
  // Click delay timer — used to defer the chat-open by CLICK_DELAY_MS so a
  // double-click (which fires after two clicks) can cancel the open.
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

  /* Persist mute preference. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [muted]);

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
      const t = window.setTimeout(() => inputRef.current?.focus(), 220);
      return () => window.clearTimeout(t);
    }
    // Stop any speaking / listening when panel closes.
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setListening(false);
  }, [open]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  /* Walk-in lifecycle — schedules the mid-walk wave and the auto-settle
   * timer. Re-runs each time `walkInToken` changes (initial mount + every
   * walk-again replay). Early-returns when she's settled or walking out. */
  useEffect(() => {
    if (settled || walkingOut) return;
    // Re-arm the spook guard for this walk-in cycle.
    spookFiredRef.current = false;
    // Mid-walk waves — schedule a start/end pair for each WAVE_STARTS_S entry.
    // Each wave only fires if the spook hasn't already interrupted the walk.
    const waveTimers: number[] = [];
    for (const startS of WAVE_STARTS_S) {
      waveTimers.push(
        window.setTimeout(() => {
          if (spookFiredRef.current) return;
          setWaving(true);
        }, startS * 1000),
      );
      waveTimers.push(
        window.setTimeout(
          () => setWaving(false),
          (startS + WAVE_DURATION_S) * 1000,
        ),
      );
    }
    // Auto-settle when the walk completes.
    const settleTimer = window.setTimeout(
      () => setSettled(true),
      WALK_DURATION_S * 1000,
    );
    return () => {
      for (const t of waveTimers) window.clearTimeout(t);
      window.clearTimeout(settleTimer);
    };
  }, [settled, walkingOut, walkInToken]);

  /* Walk-in: settle when the cursor approaches Mossie. The first time the
   * cursor enters the spook radius, briefly show a surprise face, *then*
   * spring her into her home spot. The surprise reaction adds a beat of
   * personality to the otherwise instant settle. */
  useEffect(() => {
    if (settled || walkingOut) return;
    const handler = (e: MouseEvent) => {
      if (spookFiredRef.current) return;
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (dx * dx + dy * dy < PROXIMITY_PX * PROXIMITY_PX) {
        spookFiredRef.current = true;
        setSpooked(true);
        // Wave is interrupted — drop it immediately so the surprise reads.
        setWaving(false);
        window.setTimeout(() => setSettled(true), 360);
        window.setTimeout(() => setSpooked(false), 900);
      }
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [settled, walkingOut, walkInToken]);

  /* Walk-out: when the user triggers walk-again, schedule the transition
   * back into a fresh walk-in cycle once the out-walk completes. */
  useEffect(() => {
    if (!walkingOut) return;
    spookFiredRef.current = false;
    const t = window.setTimeout(() => {
      setWalkingOut(false);
      setWalkInToken((tok) => tok + 1);
    }, OUT_DURATION_S * 1000);
    return () => window.clearTimeout(t);
  }, [walkingOut]);

  /* While walking (and not waving / spooked), pupils look forward in the
   * direction of travel — right while walking in, left while walking out. */
  useEffect(() => {
    if (settled) return;
    if (waving || spooked) {
      setPupilOffset({ x: 0, y: 0 });
    } else if (walkingOut) {
      setPupilOffset({ x: -1.2, y: 0 });
    } else {
      setPupilOffset({ x: 1.2, y: 0 });
    }
  }, [settled, waving, spooked, walkingOut]);

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

  /* Walk-in: settle on the first tap anywhere on touch devices. Disabled
   * during walk-out so a long-press on Mossie isn't interrupted. */
  useEffect(() => {
    if (settled || walkingOut) return;
    const handler = () => setSettled(true);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => window.removeEventListener("touchstart", handler);
  }, [settled, walkingOut, walkInToken]);

  /* Opening the panel always settles Mossie. */
  useEffect(() => {
    if (open && !settled) setSettled(true);
  }, [open, settled]);

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

  const sendQuery = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const userMsg: Message = { id: nextId.current++, role: "user", text };
      const faq = findBestFaq(text);
      const replyText = faq?.answer ?? FAQ_FALLBACK;
      const botMsg: Message = {
        id: nextId.current++,
        role: "bot",
        text: replyText,
        showSuggestions: !faq,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      speak(replyText);
    },
    [speak],
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

  /* Trigger a walk-again cycle: walk-out, then loop back to a fresh walk-
   * in. Only available when Mossie is settled and not already mid-walk. */
  const triggerWalkAgain = useCallback(() => {
    if (walkingOut) return;
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setSettled(false);
    setWaving(false);
    setSpooked(false);
    setHovered(false);
    setTooltipShown(false);
    spookFiredRef.current = false;
    setWalkingOut(true);
  }, [walkingOut]);

  /* Click handler with CLICK_DELAY_MS debounce so a double-click can be
   * detected first. Cancels any in-progress walk-out so the panel always
   * opens predictably when Mossie is clicked. */
  const handleBubbleClick = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (clickTimerRef.current) return; // already pending — wait for double-click
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      setWalkingOut(false);
      setSettled(true);
      setOpen((o) => !o);
    }, CLICK_DELAY_MS);
  }, []);

  /* Double-click handler — cancels the pending single-click open and walks
   * Mossie out for a fresh stroll. Only acts when she's settled. */
  const handleBubbleDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (!settled || walkingOut) return;
    triggerWalkAgain();
  }, [settled, walkingOut, triggerWalkAgain]);

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

  /* Touch handlers — long-press triggers walk-again on touch devices where
   * double-click isn't a natural gesture. Only active once Mossie is settled
   * so it doesn't conflict with the touch-to-settle behaviour. */
  const handleBubbleTouchStart = useCallback(() => {
    if (!settled || walkingOut) return;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      longPressFiredRef.current = true;
      triggerWalkAgain();
    }, LONG_PRESS_MS);
  }, [settled, walkingOut, triggerWalkAgain]);

  const handleBubbleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <>
      {/* ── Floating action button (Mossie) ────────────────────────────── */}
      <motion.button
        ref={btnRef}
        type="button"
        onClick={handleBubbleClick}
        onDoubleClick={handleBubbleDoubleClick}
        onMouseEnter={handleBubbleMouseEnter}
        onMouseLeave={handleBubbleMouseLeave}
        onTouchStart={handleBubbleTouchStart}
        onTouchEnd={handleBubbleTouchEnd}
        onTouchCancel={handleBubbleTouchEnd}
        aria-label={open ? "Close Mossie" : "Open Mossie"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[900] flex items-center justify-center rounded-full text-white"
        style={{
          width: BUBBLE_PX,
          height: BUBBLE_PX,
          background: "linear-gradient(135deg, #0a1628 0%, #11233b 100%)",
          border: `1px solid ${ACCENT}`,
          boxShadow:
            "0 12px 32px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.06), 0 0 28px -6px rgba(34,211,238,0.45)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        initial={{
          opacity: 0,
          x: -walkDistance,
          y: 0,
          scaleX: 0.92,
          scaleY: 0.92,
        }}
        animate={{
          opacity: 1,
          // X-translation has three phases:
          //  · walking-in: keyframes from off-screen-left to home, with a
          //    held position in the middle for the wave;
          //  · walking-out: linear slide from home to off-screen-left;
          //  · settled: spring to home (x = 0).
          x: walkingOut
            ? -walkDistance
            : settled
              ? 0
              : [
                  -walkDistance,
                  -walkDistance * (1 - WAVE_AT_PCTS[0]),
                  -walkDistance * (1 - WAVE_AT_PCTS[0]),
                  -walkDistance * (1 - WAVE_AT_PCTS[1]),
                  -walkDistance * (1 - WAVE_AT_PCTS[1]),
                  -walkDistance * (1 - WAVE_AT_PCTS[2]),
                  -walkDistance * (1 - WAVE_AT_PCTS[2]),
                  0,
                ],
          // Calm A — gentle stroll: 8 px hop, soft squash. Hops during walk-
          // in *and* walk-out. Held still during the wave. Snaps to rest
          // once settled.
          y: settled ? 0 : waving ? 0 : [0, -8, 0],
          scaleX: settled ? 1 : waving ? 1.04 : [1.06, 0.94, 1.06],
          scaleY: settled ? 1 : waving ? 1.04 : [0.94, 1.06, 0.94],
        }}
        transition={{
          opacity: { duration: 0.35 },
          x: walkingOut
            ? { duration: OUT_DURATION_S, ease: "linear" }
            : settled
              ? { type: "spring", stiffness: 220, damping: 24, mass: 0.7 }
              : {
                  duration: WALK_DURATION_S,
                  ease: "linear",
                  // 8 keyframes → 8 normalized times. For each wave: arrival
                  // moment (start of pause) and end-of-pause moment.
                  times: [
                    0,
                    WAVE_STARTS_S[0] / WALK_DURATION_S,
                    (WAVE_STARTS_S[0] + WAVE_DURATION_S) / WALK_DURATION_S,
                    WAVE_STARTS_S[1] / WALK_DURATION_S,
                    (WAVE_STARTS_S[1] + WAVE_DURATION_S) / WALK_DURATION_S,
                    WAVE_STARTS_S[2] / WALK_DURATION_S,
                    (WAVE_STARTS_S[2] + WAVE_DURATION_S) / WALK_DURATION_S,
                    1,
                  ],
                },
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
              {/* Mossie's face — swaps expressions based on what she's
                  doing right now. Spook reaction has highest priority,
                  then the mid-walk wave, then walking-vs-settled. */}
              <MossieFace
                expression={
                  spooked
                    ? "surprised"
                    : waving
                      ? "happy"
                      : hovered && settled
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

        {/* Mossie's waving hand — only present during the mid-walk wave. A
            small cyan capsule that sprouts from the upper-right of the body
            and rocks back and forth three times. Pivots from the wrist. */}
        <AnimatePresence>
          {waving && (
            <motion.span
              key="wave-hand"
              aria-hidden
              className="absolute pointer-events-none"
              initial={{ opacity: 0, scaleY: 0.4, rotate: -20 }}
              animate={{
                opacity: 1,
                scaleY: 1,
                rotate: [-20, 28, -20, 28, -20, 28, -20],
              }}
              exit={{ opacity: 0, scaleY: 0.4, rotate: -10 }}
              transition={{
                opacity: { duration: 0.18 },
                scaleY: { duration: 0.18 },
                rotate: { duration: WAVE_DURATION_S, ease: "easeInOut" },
              }}
              style={{
                width: 7,
                height: 12,
                top: 4,
                right: -4,
                borderRadius: 4,
                background:
                  "linear-gradient(180deg, rgba(34,211,238,0.95) 0%, rgba(34,211,238,0.7) 100%)",
                boxShadow: "0 0 6px rgba(34,211,238,0.55)",
                transformOrigin: "50% 100%",
              }}
            />
          )}
        </AnimatePresence>

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

      {/* ── Hover/intro tooltip — small dark pill above Mossie ─────────── */}
      <AnimatePresence>
        {tooltipShown && settled && !open && (
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
                      {m.text}
                    </div>
                  </div>

                  {/* Suggestion chips — only on the latest bot message that asks for them */}
                  {m.role === "bot" &&
                    m.showSuggestions &&
                    idx === lastBotIndex && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {FAQS.map((f) => (
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
                    )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
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
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse keyframes injected once (scoped via unique animation name). */}
      <style>{`
        @keyframes mossaic-chat-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(34,211,238,0.40); }
          70%  { box-shadow: 0 0 0 14px rgba(34,211,238,0); }
          100% { box-shadow: 0 0 0 0   rgba(34,211,238,0); }
        }
      `}</style>
    </>
  );
}
