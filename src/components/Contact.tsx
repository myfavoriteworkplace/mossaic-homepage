import { useState, type FormEvent } from "react";
import { Mail, MapPin, Globe, Send } from "lucide-react";
import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { SITE, CONTACT_INTERESTS } from "../data/site";

type Props = { onSubmitted: (msg: string) => void };

export default function Contact({ onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      const form = e.currentTarget;
      form.reset();
      setSubmitting(false);
      onSubmitted("Thanks — your message has been queued. We'll get back within 24 hours.");
    }, 600);
  };

  return (
    <section
      id="contact"
      className="bg-page"
      style={{ padding: "100px var(--pad)" }}
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
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="form-input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </Field>
            </div>
            <Field label="I'm interested in">
              <select name="interest" className="form-input cursor-pointer">
                {CONTACT_INTERESTS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </Field>
            <Field label="Message">
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us what you're working on or what you need..."
                className="form-input resize-none leading-relaxed"
              />
            </Field>
            <MagneticButton
              type="submit"
              disabled={submitting}
              className="self-start inline-flex items-center gap-2 bg-moss hover:bg-moss-dark disabled:opacity-70 text-white rounded-[10px] px-6 py-3.5 text-sm font-semibold transition-colors"
            >
              {submitting ? "Sending…" : "Send message"}
              <Send size={13} />
            </MagneticButton>
          </form>

          <style>{`
            .form-input {
              width: 100%;
              border: 1.5px solid var(--border);
              border-radius: 9px;
              padding: 11px 14px;
              font-size: 14px;
              font-family: var(--sans);
              color: var(--text);
              background: var(--bg);
              outline: none;
              transition: border-color .2s, box-shadow .2s;
              appearance: none;
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
