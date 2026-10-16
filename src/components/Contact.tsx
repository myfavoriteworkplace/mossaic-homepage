import { useState, type FormEvent } from "react";
import { Mail, MapPin, Globe, Send } from "lucide-react";
import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { SITE, CONTACT_INTERESTS } from "../data/site";
import CONTACT_CONFIG from "../data/contact-config.json";

type Props = { onSubmitted: (msg: string) => void };

export default function Contact({ onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
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
      onSubmitted("Thanks — your message was submitted. We'll get back within 24 hours.");
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
          <form
            className="flex flex-col gap-3.5"
            onSubmit={handleSubmit}
            data-testid="form-contact"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>
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
            <MagneticButton
              type="submit"
              disabled={submitting}
              className="self-start inline-flex items-center gap-2 bg-moss hover:bg-moss-dark disabled:opacity-70 text-white rounded-[10px] px-6 py-3.5 text-sm font-semibold transition-colors"
              data-testid="button-submit-contact"
            >
              {submitting ? "Sending…" : "Send message"}
              <Send size={13} />
            </MagneticButton>
            {errorMessage && (
              <p
                className="text-sm text-ink-2"
                role="alert"
                aria-live="assertive"
                data-testid="status-contact-error"
              >
                {errorMessage}
              </p>
            )}
          </form>

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
