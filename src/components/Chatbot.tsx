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

/** Seconds to traverse the bottom from the left edge to home. */
const WALK_DURATION_S = 10;
/** Distance in pixels from Mossie within which the cursor "spooks" her home. */
const PROXIMITY_PX = 140;
/** Bubble width — used to compute the walk distance. */
const BUBBLE_PX = 56;
/** Side margin on both edges (matches `bottom-6 right-6` = 24px). */
const EDGE_MARGIN = 24;
/** Below this viewport width the walk is skipped (too little room). */
const MIN_WALK_VIEWPORT = 480;

/** Compute the maximum leftward translation for the walk-in. */
function computeWalkDistance(): number {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  if (window.innerWidth < MIN_WALK_VIEWPORT) return 0;
  return Math.max(0, window.innerWidth - BUBBLE_PX - EDGE_MARGIN * 2);
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

  // Walk-in state — Mossie enters from the far-left, struts to her home spot
  // in the bottom-right, and "settles" when the user comes near, taps, opens
  // the chat, or the walk timer completes.
  const [walkDistance] = useState<number>(() => computeWalkDistance());
  const [settled, setSettled] = useState<boolean>(() => computeWalkDistance() === 0);

  const recognitionCtor = useMemo(() => getRecognitionCtor(), []);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const nextId = useRef(2);

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

  /* Walk-in: settle when the cursor approaches Mossie. */
  useEffect(() => {
    if (settled) return;
    const handler = (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (dx * dx + dy * dy < PROXIMITY_PX * PROXIMITY_PX) setSettled(true);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [settled]);

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
        initial={{ opacity: 0, x: -walkDistance, y: 0, scale: 0.92 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: 0,
          // Steppy "walking" hop while Mossie is in transit; flat once settled.
          y: settled ? 0 : [0, -3, 0, -3, 0],
        }}
        transition={{
          opacity: { duration: 0.35 },
          scale: { type: "spring", stiffness: 260, damping: 22 },
          x: settled
            ? { type: "spring", stiffness: 220, damping: 24, mass: 0.7 }
            : { duration: WALK_DURATION_S, ease: "linear" },
          y: settled
            ? { duration: 0.25, ease: "easeOut" }
            : { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
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
              <MessageCircle size={22} strokeWidth={2 } />
            </motion.span>
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
