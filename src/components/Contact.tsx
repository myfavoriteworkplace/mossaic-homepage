import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { CheckCircle2, Globe, Mail, MapPin, Send } from "lucide-react";
import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { SITE, CONTACT_INTERESTS } from "../data/site";
import CONTACT_CONFIG from "../data/contact-config.json";
import "./Contact.css";

type ContactView = "form" | "flight" | "success";

type ContactPayload = {
  name: string;
  email: string;
  interest: string;
  message: string;
  gotcha: string;
};

type EnvelopeFlight = {
  left: number;
  top: number;
  xOffsets: number[];
  yOffsets: number[];
};

type FlightPhase = "travel" | "impact" | null;

export default function Contact() {
  const [view, setView] = useState<ContactView>("form");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envelopeFlight, setEnvelopeFlight] = useState<EnvelopeFlight | null>(null);
  const [flightPhase, setFlightPhase] = useState<FlightPhase>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailIconRef = useRef<HTMLSpanElement | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload: ContactPayload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      interest: String(formData.get("interest") ?? ""),
      message: String(formData.get("message") ?? ""),
      gotcha: String(formData.get("gotcha") ?? ""),
    };

    setErrorMessage(null);
    setSubmitting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(CONTACT_CONFIG.workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The email service returned an invalid response.");
      }

      const accepted =
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        result.success === true;

      if (!response.ok || !accepted) {
        throw new Error("The email service did not accept the message.");
      }

      form.reset();
      setErrorMessage(null);

      const submitButton =
        form.querySelector<HTMLButtonElement>(
          '[data-testid="button-submit-contact"]',
        );
      const emailIcon = emailIconRef.current;

      if (submitButton && emailIcon && !reduceMotion) {
        const buttonRect = submitButton.getBoundingClientRect();
        const emailRect = emailIcon.getBoundingClientRect();
        const startX = buttonRect.left + buttonRect.width / 2;
        const startY = buttonRect.top + buttonRect.height / 2;
        const targetX = emailRect.left + emailRect.width / 2;
        const targetY = emailRect.top + emailRect.height / 2;
        const { xOffsets, yOffsets } = createCurvedFlightOffsets(
          targetX - startX,
          targetY - startY,
        );

        setEnvelopeFlight({
          left: startX + window.scrollX - 20,
          top: startY + window.scrollY - 14,
          xOffsets,
          yOffsets,
        });
        setFlightPhase("travel");
        setView("flight");
      } else {
        setFlightPhase(null);
        setView("success");
      }
    } catch {
      setErrorMessage(
        controller.signal.aborted
          ? `The request timed out. Please try again or email ${SITE.email}.`
          : `We couldn't send your message. Please try again or email ${SITE.email}.`,
      );
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setErrorMessage(null);
    setEnvelopeFlight(null);
    setFlightPhase(null);
    setView("form");
  };

  return (
    <section
      id="contact"
      className="bg-page"
      style={{ padding: "var(--section-pad-y) var(--pad)" }}
    >
      <div className="max-w-container mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <Reveal>
          <div className="tag tag-green mb-5">Get in touch</div>
          <h2 className="section-title text-left">
            Let's build something
            <br />
            <em className="underline-mark">that matters.</em>
          </h2>
          <p className="text-[15px] text-ink-3 leading-[1.7] mb-7 mt-5">
            Whether you're a business exploring one of our products, a partner
            or investor curious about what we're building, or someone with a
            software problem we could solve — we'd love to hear from you.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-moss transition-colors no-underline"
            >
              <motion.span
                ref={emailIconRef}
                className={`relative inline-flex h-5 w-5 origin-center items-center justify-center rounded-full ${
                  flightPhase === "impact" && !reduceMotion
                    ? "contact-email-icon-impact"
                    : ""
                }`}
                initial={false}
                animate={
                  flightPhase === "impact"
                    ? {
                        scale: [1, 1.32, 0.9, 1.1, 1],
                        rotate: [0, -16, 9, -3, 0],
                      }
                    : { scale: 1, rotate: 0 }
                }
                transition={{
                  duration: flightPhase === "impact" ? 0.72 : 0,
                  times:
                    flightPhase === "impact"
                      ? [0, 0.22, 0.48, 0.72, 1]
                      : undefined,
                  ease: "easeOut",
                }}
                onAnimationComplete={() => {
                  if (flightPhase === "impact") {
                    setFlightPhase(null);
                    setView("success");
                  }
                }}
              >
                <Mail size={16} className="text-moss" strokeWidth={1.7} />
              </motion.span>
              <motion.span
                className={`inline-block ${
                  flightPhase === "impact" && !reduceMotion
                    ? "contact-email-address-impact"
                    : ""
                }`}
              >
                {SITE.email}
              </motion.span>
            </a>
            {SITE.alternateEmail && (
              <a
                href={`mailto:${SITE.alternateEmail}`}
                aria-label={`Alternative email: ${SITE.alternateEmail}`}
                className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-moss transition-colors no-underline"
              >
                <Mail size={16} className="text-moss" strokeWidth={1.7} />
                {SITE.alternateEmail}
              </a>
            )}
            <div className="flex items-center gap-2.5 text-sm text-ink-2">
              <MapPin size={16} className="text-moss" strokeWidth={1.7} />
              {SITE.location}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-ink-2">
              <Globe size={16} className="text-moss" strokeWidth={1.7} />
              {SITE.domains}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            layout
            transition={{
              layout: {
                duration: reduceMotion ? 0 : 0.42,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {view === "success" ? (
                <motion.div
                  key="contact-success"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 12, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.34,
                    ease: "easeOut",
                  }}
                  role="status"
                  aria-live="polite"
                  data-testid="status-contact-success"
                  className="relative overflow-hidden rounded-2xl border p-7 text-center sm:p-9"
                  style={{
                    background:
                      "linear-gradient(155deg, #ffffff 0%, #f2fbff 54%, #e8f6fc 100%)",
                    borderColor: "rgba(88, 174, 205, 0.42)",
                    boxShadow:
                      "0 18px 48px rgba(14, 165, 233, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                    color: "#102a43",
                  }}
                >
                  <div
                    className="relative mx-auto mb-5 h-[60px] w-[76px]"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 76 56"
                      className="h-full w-full"
                      fill="none"
                    >
                      <rect
                        x="2"
                        y="5"
                        width="72"
                        height="48"
                        rx="8"
                        fill="#ffffff"
                        stroke="#9bd3e7"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 9 38 34 72 9"
                        stroke="#69b6d3"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m4 50 24-21M72 50 48 29"
                        stroke="#a8dbea"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-md shadow-sky-500/25">
                      <CheckCircle2 size={16} strokeWidth={2.2} />
                    </span>
                  </div>
                  <h3
                    className="mb-2 text-2xl font-semibold tracking-tight"
                    style={{ color: "#102a43" }}
                  >
                    Message Received!
                  </h3>
                  <p
                    className="mx-auto mb-6 max-w-sm text-sm leading-relaxed"
                    style={{ color: "#52697b" }}
                  >
                    Thanks — your message was submitted. We&apos;ll get back
                    to you soon.
                  </p>
                  <MagneticButton
                    type="button"
                    onClick={handleSendAnother}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-moss px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-moss-dark"
                    data-testid="button-contact-send-another"
                  >
                    Send another message
                  </MagneticButton>
                </motion.div>
              ) : (
                <motion.form
                  key="contact-form"
                  ref={formRef}
                  onSubmit={handleSubmit}
                  exit={{
                    opacity: 0,
                    transition: { duration: reduceMotion ? 0 : 0.16 },
                  }}
                  data-testid="form-contact"
                  aria-hidden={view === "flight"}
                  style={{ pointerEvents: view === "flight" ? "none" : "auto" }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "-10000px",
                      width: 1,
                      height: 1,
                      overflow: "hidden",
                    }}
                  >
                    <label htmlFor="contact-gotcha">Leave this field empty</label>
                    <input
                      id="contact-gotcha"
                      type="text"
                      name="gotcha"
                      tabIndex={-1}
                      autoComplete="off"
                      data-testid="input-contact-gotcha"
                    />
                  </div>
                  <fieldset
                    disabled={view === "flight"}
                    className="flex min-w-0 flex-col gap-3.5"
                    style={{ border: 0, margin: 0, padding: 0 }}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: view === "flight" ? 0 : 1,
                        y: view === "flight" ? -14 : 0,
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.24,
                        delay: 0,
                        ease: "easeOut",
                      }}
                      className="grid grid-cols-1 gap-3 md:grid-cols-2"
                    >
                      <Field label="Name">
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Your name"
                          className="form-input"
                          data-testid="input-contact-name"
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="you@example.com"
                          className="form-input"
                          data-testid="input-contact-email"
                        />
                      </Field>
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: view === "flight" ? 0 : 1,
                        y: view === "flight" ? -14 : 0,
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.24,
                        delay: view === "flight" && !reduceMotion ? 0.07 : 0,
                        ease: "easeOut",
                      }}
                    >
                      <Field label="I'm interested in">
                        <select
                          name="interest"
                          className="form-input cursor-pointer"
                          data-testid="select-contact-interest"
                        >
                          {CONTACT_INTERESTS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: view === "flight" ? 0 : 1,
                        y: view === "flight" ? -14 : 0,
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.24,
                        delay: view === "flight" && !reduceMotion ? 0.14 : 0,
                        ease: "easeOut",
                      }}
                    >
                      <Field label="Message">
                        <textarea
                          name="message"
                          rows={4}
                          required
                          placeholder="Tell us what you're working on or what you need..."
                          className="form-input resize-none leading-relaxed"
                          data-testid="input-contact-message"
                        />
                      </Field>
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: view === "flight" ? 0 : 1,
                        y: view === "flight" ? -14 : 0,
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.24,
                        delay: view === "flight" && !reduceMotion ? 0.21 : 0,
                        ease: "easeOut",
                      }}
                    >
                      <MagneticButton
                        type="submit"
                        disabled={submitting || view === "flight"}
                        className="inline-flex items-center gap-2 rounded-[10px] bg-moss px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-moss-dark disabled:cursor-not-allowed disabled:opacity-70"
                        data-testid="button-submit-contact"
                      >
                        {submitting ? "Sending…" : "Send message"}
                        <motion.span
                          aria-hidden="true"
                          className="inline-flex"
                          animate={
                            submitting && !reduceMotion
                              ? {
                                  x: [0, 3, 0],
                                  y: [0, -2, 0],
                                  rotate: [0, -12, 0],
                                }
                              : { x: 0, y: 0, rotate: 0 }
                          }
                          transition={
                            submitting && !reduceMotion
                              ? {
                                  duration: 0.72,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.12 }
                          }
                        >
                          <Send size={13} />
                        </motion.span>
                      </MagneticButton>
                    </motion.div>
                    {errorMessage && (
                      <motion.p
                        initial={false}
                        animate={{
                          opacity: view === "flight" ? 0 : 1,
                          y: view === "flight" ? -14 : 0,
                        }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.24,
                          delay:
                            view === "flight" && !reduceMotion ? 0.28 : 0,
                          ease: "easeOut",
                        }}
                        className="text-sm text-ink-2"
                        role="alert"
                        aria-live="assertive"
                        data-testid="status-contact-error"
                      >
                        {errorMessage}
                      </motion.p>
                    )}
                  </fieldset>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

        </Reveal>
      </div>
      {envelopeFlight &&
        typeof document !== "undefined" &&
        createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute z-[1200] flex h-7 w-10 items-center justify-center"
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0.72,
              rotate: 0,
            }}
            animate={{
              x: envelopeFlight.xOffsets,
              y: envelopeFlight.yOffsets,
              opacity: [0, 1, 1, 1, 0],
              scale: [0.72, 1.04, 0.94, 1.04, 0.82],
              rotate: [0, -9, 7, -3, 0],
            }}
            transition={{
              x: { duration: 1.08, ease: "linear" },
              y: { duration: 1.08, ease: "linear" },
              opacity: {
                duration: 1.08,
                times: [0, 0.08, 0.72, 0.92, 1],
                ease: "easeInOut",
              },
              scale: {
                duration: 1.08,
                times: [0, 0.18, 0.62, 0.88, 1],
                ease: "easeOut",
              },
              rotate: {
                duration: 1.08,
                times: [0, 0.2, 0.58, 0.86, 1],
                ease: "easeOut",
              },
            }}
            onAnimationComplete={() => {
              setEnvelopeFlight(null);
              setFlightPhase("impact");
            }}
            style={{
              position: "absolute",
              left: envelopeFlight.left,
              top: envelopeFlight.top,
              filter: "drop-shadow(0 4px 8px rgb(var(--accent-rgb) / 0.28))",
            }}
          >
            <svg
              viewBox="0 0 40 28"
              width="40"
              height="28"
              fill="none"
            >
              <rect
                x="1.25"
                y="1.25"
                width="37.5"
                height="25.5"
                rx="4.5"
                fill="#f8fcff"
                stroke="#55b6d7"
                strokeWidth="1.5"
              />
              <path
                d="M2.5 4.5 20 17 37.5 4.5"
                stroke="#328eaf"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 25 14 14.8M37.5 25 26 14.8"
                stroke="#8ac9dc"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>,
          document.body,
        )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function createCurvedFlightOffsets(
  deltaX: number,
  deltaY: number,
): { xOffsets: number[]; yOffsets: number[] } {
  const distance = Math.hypot(deltaX, deltaY);
  if (distance === 0) return { xOffsets: [0], yOffsets: [0] };

  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const amplitude = Math.min(96, Math.max(18, distance * 0.2));
  const direction = Math.random() < 0.5 ? -1 : 1;
  const firstBend = direction * amplitude * (0.7 + Math.random() * 0.3);
  const secondBend = -direction * amplitude * (0.5 + Math.random() * 0.35);

  const controlOne = {
    x: deltaX * 0.28 + normalX * firstBend,
    y: deltaY * 0.28 + normalY * firstBend,
  };
  const controlTwo = {
    x: deltaX * 0.72 + normalX * secondBend,
    y: deltaY * 0.72 + normalY * secondBend,
  };

  const xOffsets: number[] = [];
  const yOffsets: number[] = [];
  const steps = 40;

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const inverseT = 1 - t;
    const tCubed = t * t * t;
    xOffsets.push(
      3 * inverseT * inverseT * t * controlOne.x +
        3 * inverseT * t * t * controlTwo.x +
        tCubed * deltaX,
    );
    yOffsets.push(
      3 * inverseT * inverseT * t * controlOne.y +
        3 * inverseT * t * t * controlTwo.y +
        tCubed * deltaY,
    );

    if (step === 0) {
      xOffsets[0] = 0;
      yOffsets[0] = 0;
    } else if (step === steps) {
      xOffsets[step] = deltaX;
      yOffsets[step] = deltaY;
    }
  }

  return { xOffsets, yOffsets };
}
