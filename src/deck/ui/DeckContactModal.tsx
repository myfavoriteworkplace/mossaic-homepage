import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Mail, Send, X } from "lucide-react";
import { CONTACT_INTERESTS, SITE } from "../../data/site";
import {
  sendContactMessage,
  type ContactPayload,
} from "../../contactSubmission";

type DeckContactModalProps = { onClose: () => void };

export default function DeckContactModal({ onClose }: DeckContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const isClosingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLInputElement>('[name="name"]')?.focus();

    return () => {
      isClosingRef.current = true;
      requestRef.current?.abort();
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (!isSuccessful) return;
    const timeoutId = window.setTimeout(onClose, 4_000);
    return () => window.clearTimeout(timeoutId);
  }, [isSuccessful, onClose]);

  const closeModal = () => {
    isClosingRef.current = true;
    requestRef.current?.abort();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: ContactPayload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      interest: String(formData.get("interest") ?? ""),
      message: String(formData.get("message") ?? ""),
      gotcha: String(formData.get("gotcha") ?? ""),
    };

    setErrorMessage(null);
    setIsSubmitting(true);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    try {
      await sendContactMessage(payload, controller.signal);
      form.reset();
      setIsSuccessful(true);
    } catch {
      if (!isClosingRef.current) {
        setErrorMessage(
          controller.signal.aborted
            ? `The request timed out. Please try again or email ${SITE.email}.`
            : `We couldn't send your message. Please try again or email ${SITE.email}.`,
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (requestRef.current === controller) requestRef.current = null;
      if (!isClosingRef.current) setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="deck-contact-dialog"
      aria-labelledby="deck-contact-title"
      data-testid="deck-contact-dialog"
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section className="deck-contact-panel">
        <button
          type="button"
          className="deck-contact-close"
          onClick={closeModal}
          aria-label="Close email form"
          title="Close"
          data-testid="deck-contact-close"
        >
          <X aria-hidden="true" size={18} />
        </button>

        {isSuccessful ? (
          <div
            className="deck-contact-success"
            role="status"
            aria-live="polite"
            data-testid="deck-contact-success"
          >
            <span className="deck-contact-success-icon" aria-hidden="true">
              <CheckCircle2 size={30} />
            </span>
            <h2 id="deck-contact-title">Message Received!</h2>
            <p>Thanks — your message was submitted. We&apos;ll get back to you soon.</p>
            <small>This window will close in a few seconds.</small>
          </div>
        ) : (
          <>
            <div className="deck-contact-heading">
              <span className="deck-contact-heading-icon" aria-hidden="true">
                <Mail size={18} />
              </span>
              <div>
                <p className="deck-contact-eyebrow">LET&apos;S TALK</p>
                <h2 id="deck-contact-title">Send us a message</h2>
                <p className="deck-contact-intro">
                  Tell us a little about your project and we&apos;ll get back to you.
                </p>
              </div>
            </div>

            <form
              className="deck-contact-form"
              onSubmit={handleSubmit}
              data-testid="deck-contact-form"
            >
              <div className="deck-contact-honeypot" aria-hidden="true">
                <label htmlFor="deck-contact-gotcha">Leave this field empty</label>
                <input
                  id="deck-contact-gotcha"
                  type="text"
                  name="gotcha"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <fieldset disabled={isSubmitting} className="deck-contact-fields">
                <div className="deck-contact-field-row">
                  <label className="deck-contact-field">
                    <span>Name</span>
                    <input
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      data-testid="deck-contact-name"
                    />
                  </label>
                  <label className="deck-contact-field">
                    <span>Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      data-testid="deck-contact-email"
                    />
                  </label>
                </div>

                <label className="deck-contact-field">
                  <span>I&apos;m interested in</span>
                  <select name="interest" data-testid="deck-contact-interest">
                    {CONTACT_INTERESTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="deck-contact-field">
                  <span>Message</span>
                  <textarea
                    name="message"
                    rows={4}
                    required
                    placeholder="Tell us what you're working on or what you need..."
                    data-testid="deck-contact-message"
                  />
                </label>

                {errorMessage ? (
                  <p
                    className="deck-contact-error"
                    role="alert"
                    aria-live="assertive"
                    data-testid="deck-contact-error"
                  >
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="deck-contact-submit"
                  disabled={isSubmitting}
                  data-testid="deck-contact-submit"
                >
                  {isSubmitting ? "Sending…" : "Send message"}
                  <Send size={15} aria-hidden="true" />
                </button>
              </fieldset>
            </form>
          </>
        )}
      </section>
    </dialog>
  );
}
