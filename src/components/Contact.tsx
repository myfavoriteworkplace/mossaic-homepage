import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { CheckCircle2, Globe, LoaderCircle, Mail, MapPin, Send } from "lucide-react";
import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { SITE, CONTACT_INTERESTS } from "../data/site";
import CONTACT_CONFIG from "../data/contact-config.json";

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
  travelX: number;
  travelY: number;
};

export default function Contact() {
  const [view, setView] = useState<ContactView>("form");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envelopeFlight, setEnvelopeFlight] = useState<EnvelopeFlight | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailRef = useRef<HTMLAnchorElement | null>(null);
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
      const emailLink = emailRef.current;

      if (submitButton && emailLink && !reduceMotion) {
        const buttonRect = submitButton.getBoundingClientRect();
        const emailRect = emailLink.getBoundingClientRect();
        const startX = buttonRect.left + buttonRect.width / 2;
        const startY = buttonRect.top + buttonRect.height / 2;
        const targetX = emailRect.left + emailRect.width / 2;
        const targetY = emailRect.top + emailRect.height / 2;

        setEnvelopeFlight({
          left: startX + window.scrollX - 14,
          top: startY + window.scrollY - 14,
          travelX: targetX - startX,
          travelY: targetY - startY,
        });
        setView("flight");
      } else {
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
              ref={emailRef}
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-moss transition-colors no-underline"
            >
              <Mail size={16} className="text-moss" strokeWidth={1.7} />
              {SITE.email}
            </a>
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
                  className="rounded-2xl border p-7 text-center sm:p-9"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "rgb(var(--accent-rgb) / 0.26)",
                    boxShadow: "0 18px 48px rgb(var(--accent-rgb) / 0.10)",
                  }}
                >
                  <div
                    className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      color: "var(--accent)",
                      background: "rgb(var(--accent-rgb) / 0.12)",
                      boxShadow: "0 0 28px rgb(var(--accent-rgb) / 0.22)",
                    }}
                    aria-hidden="true"
                  >
                    <CheckCircle2 size={29} strokeWidth={1.8} />
                  </div>
                  <h3
                    className="mb-2 text-2xl font-semibold tracking-tight"
                    style={{ color: "var(--text)" }}
                  >
                    Message Received!
                  </h3>
                  <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-ink-3">
                    Thanks — your message was submitted. We&apos;ll get back
                    within 24 hours.
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
                        {submitting ? (
                          <LoaderCircle
                            size={14}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Send size={13} aria-hidden="true" />
                        )}
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

          <style>{`
            .form-input {
              width: 100%;
              border: 1.5px solid var(--border);
              border-radius: 9px;
              padding: 10px 14px;
              /* 16px prevents iOS Safari from auto-zooming the page when an
                 input is focused. Padding tightened so the field doesn't
                 grow visually compared to the previous 14px design. */
              font-size: 16px;
              font-family: var(--sans);
              color: var(--text);
              background: var(--bg);
              outline: none;
              transition: border-color .2s, box-shadow .2s;
              appearance: none;
            }
            @media (min-width: 768px) {
              .form-input { font-size: 14px; padding: 11px 14px; }
            }
            .form-input:focus {
              border-color: var(--accent);
              box-shadow: 0 0 0 3px rgb(var(--accent-rgb) / 0.12);
            }
            .form-input::placeholder { color: rgb(var(--text-4-rgb)); }
          `}</style>
        </Reveal>
      </div>
      {envelopeFlight &&
        typeof document !== "undefined" &&
        createPortal(
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute z-[1200] flex h-7 w-7 items-center justify-center rounded-full"
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0.72,
              rotate: 0,
            }}
            animate={{
              x: [
                0,
                envelopeFlight.travelX * 0.32,
                envelopeFlight.travelX * 0.72,
                envelopeFlight.travelX,
              ],
              y: [
                0,
                envelopeFlight.travelY * 0.32 - 32,
                envelopeFlight.travelY * 0.72 - 18,
                envelopeFlight.travelY,
              ],
              opacity: [0, 1, 1, 0],
              scale: [0.72, 1.08, 0.92, 0.62],
              rotate: [0, -8, 4, 0],
            }}
            transition={{
              duration: 0.92,
              times: [0, 0.18, 0.78, 1],
              ease: "easeInOut",
            }}
            onAnimationComplete={() => {
              setEnvelopeFlight(null);
              setView("success");
            }}
            style={{
              position: "absolute",
              left: envelopeFlight.left,
              top: envelopeFlight.top,
              color: "var(--accent)",
              background: "var(--bg-elevated)",
              border: "1px solid rgb(var(--accent-rgb) / 0.45)",
              boxShadow: "0 4px 20px rgb(var(--accent-rgb) / 0.28)",
            }}
          >
            <Mail size={15} strokeWidth={1.9} />
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
