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

function pickIndianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer en-IN, then any English voice.
  const enIN = voices.find((v) => v.lang === "en-IN");
  if (enIN) return enIN;
  const en = voices.find((v) => v.lang.startsWith("en"));
  return en ?? voices[0] ?? null;
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

/** Seconds to traverse the bottom from the left edge to home (includes the
 *  mid-walk wave pause — see WAVE_START_S / WAVE_DURATION_S). */
const WALK_DURATION_S = 13.4;
/** Distance in pixels from Mossie within which the cursor "spooks" her home. */
const PROXIMITY_PX = 140;
/** Bubble width — used to compute the walk distance. */
const BUBBLE_PX = 56;
/** Side margin on both edges (matches `bottom-6 right-6` = 24px). */
const EDGE_MARGIN = 24;
/** Below this viewport width the walk is skipped (too little room). */
const MIN_WALK_VIEWPORT = 480;
/** Seconds into the walk when Mossie pauses to wave at the user. Picked so
 *  she's roughly mid-screen when the wave begins. */
const WAVE_START_S = 6;
/** Seconds the wave lasts. Body x-translation is held still for this long. */
const WAVE_DURATION_S = 1.4;
/** Fraction of the walk distance Mossie has covered when she pauses to wave. */
const WAVE_AT_PCT = 0.5;

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

  const recognitionCtor = useMemo(() => getRecognitionCtor(), []);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const nextId = useRef(2);
  // Guard so the spook reaction only fires once per walk.
  const spookFiredRef = useRef(false);

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

  /* Walk-in: settle when the cursor approaches Mossie. The first time the
   * cursor enters the spook radius, briefly show a surprise face, *then*
   * spring her into her home spot. The surprise reaction adds a beat of
   * personality to the otherwise instant settle. */
  useEffect(() => {
    if (settled) return;
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
  }, [settled]);

  /* Walk-in: schedule the mid-walk wave. Triggers WAVE_START_S into the walk,
   * lasts WAVE_DURATION_S, then resumes walking. Skipped if Mossie has
   * already settled (e.g. because of cursor proximity or a tap). */
  useEffect(() => {
    if (settled) return;
    const startTimer = window.setTimeout(() => {
      // Don't start the wave if she's been spooked / settled in the meantime.
      if (spookFiredRef.current) return;
      setWaving(true);
    }, WAVE_START_S * 1000);
    const endTimer = window.setTimeout(
      () => setWaving(false),
      (WAVE_START_S + WAVE_DURATION_S) * 1000,
    );
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [settled]);

  /* While walking (and not waving / spooked), pupils look forward in the
   * direction of travel. Set once on the relevant state changes. */
  useEffect(() => {
    if (settled) return;
    if (waving || spooked) {
      setPupilOffset({ x: 0, y: 0 });
    } else {
      setPupilOffset({ x: 1.2, y: 0 });
    }
  }, [settled, waving, spooked]);

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

  /* Walk-in: settle on the first tap anywhere on touch devices. */
  useEffect(() => {
    if (settled) return;
    const handler = () => setSettled(true);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => window.removeEventListener("touchstart", handler);
  }, [settled]);

  /* Walk-in: auto-settle once the walk duration completes. */
  useEffect(() => {
    if (settled) return;
    const t = window.setTimeout(() => setSettled(true), WALK_DURATION_S * 1000);
    return () => window.clearTimeout(t);
  }, [settled]);

  /* Opening the panel always settles Mossie. */
  useEffect(() => {
    if (open && !settled) setSettled(true);
  }, [open, settled]);

  const speak = useCallback(
    (text: string) => {
      if (muted) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleanForSpeech(text));
      utter.lang = "en-IN";
      utter.rate = 1.0;
      utter.pitch = 1.0;
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

  return (
    <>
      {/* ── Floating action button (Mossie) ────────────────────────────── */}
      <motion.button
        ref={btnRef}
        type="button"
        onClick={() => {
          setSettled(true);
          setOpen((o) => !o);
        }}
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
          // X-translation: walks from far-left, holds the mid-screen position
          // for the wave, then continues home. The hold is built into the
          // keyframes so a single linear animation covers the whole journey.
          x: settled
            ? 0
            : [
                -walkDistance,
                -walkDistance * (1 - WAVE_AT_PCT),
                -walkDistance * (1 - WAVE_AT_PCT),
                0,
              ],
          // Calm A — gentle stroll: 8 px hop, soft squash. During the wave
          // the body holds still (a tiny breathing scale stays). Once settled,
          // everything snaps to rest.
          y: settled ? 0 : waving ? 0 : [0, -8, 0],
          scaleX: settled ? 1 : waving ? 1.04 : [1.06, 0.94, 1.06],
          scaleY: settled ? 1 : waving ? 1.04 : [0.94, 1.06, 0.94],
        }}
        transition={{
          opacity: { duration: 0.35 },
          x: settled
            ? { type: "spring", stiffness: 220, damping: 24, mass: 0.7 }
            : {
                duration: WALK_DURATION_S,
                ease: "linear",
                times: [
                  0,
                  WAVE_START_S / WALK_DURATION_S,
                  (WAVE_START_S + WAVE_DURATION_S) / WALK_DURATION_S,
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
