import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import Reveal from "./ui/Reveal";
import BookMySlotText from "./ui/BookMySlotText";
import { TESTIMONIALS, TESTIMONIALS_COPY } from "../data/site";
import "./Testimonials.css";

const AUTOPLAY_DELAY = 4000;

export default function Testimonials() {
  const reducedMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; pointerType: string } | null>(null);

  const count = TESTIMONIALS.length;
  const activeTestimonial = TESTIMONIALS[activeIndex];

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      count < 2 ||
      reducedMotion ||
      hovered ||
      focused ||
      !documentVisible ||
      !isInView
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [activeIndex, count, documentVisible, focused, hovered, isInView, reducedMotion]);

  const goTo = (index: number) => {
    setActiveIndex((index + count) % count);
  };
  const goPrevious = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
    }
  };

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).matches(":focus-visible")) {
      setFocused(true);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === "mouse" ||
      (event.target as HTMLElement).closest("button")
    ) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = { x: event.clientX, pointerType: event.pointerType };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.pointerType === "mouse") return;
    const distance = event.clientX - start.x;
    if (Math.abs(distance) < 48) return;
    if (distance > 0) goPrevious();
    else goNext();
  };

  return (
    <section
      id="testimonials"
      className="bg-surface"
      style={{ padding: "var(--section-pad-y) var(--pad)" }}
    >
      <div className="container-x">
        <Reveal className="text-center mb-12">
          <div className="tag tag-green mb-4">{TESTIMONIALS_COPY.tag}</div>
          <h2 className="section-title" id="testimonials-heading">
            {TESTIMONIALS_COPY.titleLead}{" "}
            <em className="underline-mark">{TESTIMONIALS_COPY.titleAccent}</em>
          </h2>
          <p className="section-sub mt-3.5">{TESTIMONIALS_COPY.description}</p>
        </Reveal>

        {count > 0 && activeTestimonial && (
          <Reveal>
            <div
              ref={carouselRef}
              className="testimonial-carousel"
              role="region"
              aria-roledescription="carousel"
              aria-labelledby="testimonials-heading"
              data-testid="region-testimonial-carousel"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            >
              <div
                className="testimonial-stage"
                role="group"
                aria-label="Customer reviews"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                  pointerStart.current = null;
                }}
              >
                {TESTIMONIALS.map((testimonial, index) => {
                  const offset = (index - activeIndex + count) % count;
                  const position = offset > count / 2 ? offset - count : offset;
                  const isActive = position === 0;
                  const sideClass =
                    position === -1 ? " is-previous" : position === 1 ? " is-next" : "";

                  return (
                    <article
                      key={testimonial.id}
                      className={`testimonial-slide${isActive ? " is-active" : ""}${sideClass}`}
                      style={
                        {
                          "--slide-position": position,
                          "--slide-depth": isActive ? "0px" : "-110px",
                        } as CSSProperties
                      }
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${index + 1} of ${count}`}
                      data-testid={`slide-testimonial-${testimonial.id}`}
                      aria-hidden={!isActive}
                    >
                      <div className="testimonial-card">
                        <div className="testimonial-card-top">
                          <div
                            className="testimonial-stars"
                            role="img"
                            aria-label={`${testimonial.rating} out of 5 stars`}
                          >
                            {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                              <span key={starIndex} aria-hidden="true">★</span>
                            ))}
                          </div>
                          <span
                            className={`testimonial-product${
                              testimonial.product === "bookMySlot" ? "" : " is-uppercase"
                            }`}
                          >
                            {testimonial.product === "bookMySlot" ? (
                              <BookMySlotText className="text-[10px]" />
                            ) : (
                              testimonial.product
                            )}
                          </span>
                        </div>
                        <p className="testimonial-quote">"{testimonial.quote}"</p>
                        <div className="testimonial-author">
                          {testimonial.image ? (
                            <span
                              className="testimonial-initials testimonial-photo-frame"
                              aria-hidden="true"
                            >
                              <img
                                className="testimonial-photo"
                                src={`${import.meta.env.BASE_URL}${testimonial.image}`}
                                alt=""
                                width={256}
                                height={256}
                                loading="lazy"
                                decoding="async"
                              />
                            </span>
                          ) : (
                            <div className="testimonial-initials" aria-hidden="true">
                              {testimonial.initials}
                            </div>
                          )}
                          <div>
                            <div className="testimonial-name">{testimonial.name}</div>
                            <div className="testimonial-role">{testimonial.role}</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="testimonial-controls">
                <span className="testimonial-controls-spacer" aria-hidden="true" />
                <div className="testimonial-nav-group">
                  <button
                    type="button"
                    className="testimonial-control"
                    onClick={goPrevious}
                    aria-label="Previous review"
                    data-testid="button-previous-testimonial"
                  >
                    <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />
                  </button>
                  <div className="testimonial-pagination" aria-label="Choose a review">
                    {TESTIMONIALS.map((testimonial, index) => (
                      <button
                        type="button"
                        key={testimonial.id}
                        className={`testimonial-dot${index === activeIndex ? " is-current" : ""}`}
                        aria-label={`Show review ${index + 1}`}
                        aria-current={index === activeIndex ? "true" : undefined}
                        data-testid={`button-testimonial-${index + 1}`}
                        onClick={() => goTo(index)}
                      >
                        <span />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="testimonial-control"
                    onClick={goNext}
                    aria-label="Next review"
                    data-testid="button-next-testimonial"
                  >
                    <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
                  </button>
                </div>

                <span className="testimonial-counter" aria-hidden="true">
                  <span>{String(activeIndex + 1).padStart(2, "0")}</span>
                  <i />
                  {String(count).padStart(2, "0")}
                </span>
              </div>
              <p
                className="testimonial-sr-only"
                aria-live={reducedMotion ? "polite" : "off"}
                aria-atomic="true"
              >
                Showing review {activeIndex + 1} of {count} by {activeTestimonial.name}.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
