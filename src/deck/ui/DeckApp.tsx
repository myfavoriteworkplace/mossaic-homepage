import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Layers3,
  Printer,
  Share2,
} from "lucide-react";
import Logo from "../../components/Logo";
import Wordmark from "../../components/ui/Wordmark";
import type { DeckContent, DeckSlide } from "./types";
import "./deck.css";

type DeckAppProps = {
  config: DeckContent;
};

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

function SlideMetrics({ metrics, slideId }: { metrics: NonNullable<DeckSlide["metrics"]>; slideId: string }) {
  if (!metrics.length) return null;
  return (
    <div className="deck-stat-stack" data-testid="deck-metrics">
      {metrics.map((metric, index) => (
        <div className="deck-stat" key={`${metric.label}-${index}`} data-testid={`deck-metric-${slideId}-${index}`}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  );
}

function SlideSide({
  slide,
  keyFiguresLabel,
}: {
  slide: DeckSlide;
  keyFiguresLabel: string;
}) {
  if (slide.kind === "cover" || slide.kind === "closing") {
    return (
      <div className="deck-orbit" aria-hidden="true">
        <div className="deck-orbit-core">
          <Logo size={126} variant="mark" compact={false} idSuffix={`deck-${slide.id}`} />
        </div>
        <span className="deck-orbit-caption">{slide.sideLabel}</span>
      </div>
    );
  }

  if (slide.metrics?.length) {
    return (
      <aside className="deck-highlight-panel" aria-label={slide.sideLabel || keyFiguresLabel}>
        <div className="deck-panel-label">{slide.sideLabel || keyFiguresLabel}</div>
          <SlideMetrics metrics={slide.metrics} slideId={slide.id} />
      </aside>
    );
  }

  return (
    <aside className="deck-highlight-panel deck-highlight-panel-empty">
      <div className="deck-panel-label">{slide.sideLabel || keyFiguresLabel}</div>
      <div className="deck-mini-core" aria-hidden="true">
        <Logo size={102} variant="mark" idSuffix={`deck-side-${slide.id}`} />
      </div>
    </aside>
  );
}

function DeckSlideView({
  slide,
  index,
  total,
  capabilitiesLabel,
  keyFiguresLabel,
}: {
  slide: DeckSlide;
  index: number;
  total: number;
  capabilitiesLabel: string;
  keyFiguresLabel: string;
}) {
  return (
    <article
      className="deck-slide"
      data-kind={slide.kind || "standard"}
      data-testid={`deck-slide-${slide.id}`}
      aria-label={`${slide.eyebrow}: ${slide.title}`}
    >
      <div className="deck-slide-main">
        <div className="deck-slide-kicker">{slide.eyebrow}</div>
        <h2 className="deck-slide-title">
          {slide.title}
          {slide.highlight ? <> <em>{slide.highlight}</em></> : null}
        </h2>
        <p className="deck-slide-description">{slide.description}</p>
        {slide.status ? (
          <div className="deck-slide-status">
            <span className="deck-status-dot" aria-hidden="true" />
            {slide.status}
          </div>
        ) : null}
        {slide.points?.length ? (
          <ul className="deck-facts">
            {slide.points.map((point, pointIndex) => (
              <li className="deck-fact" key={`${slide.id}-fact-${pointIndex}`}>{point}</li>
            ))}
          </ul>
        ) : null}
        {slide.tags?.length ? (
          <div className="deck-tags" aria-label={capabilitiesLabel}>
            {slide.tags.map((tag) => <span className="deck-tag" key={tag}>{tag}</span>)}
          </div>
        ) : null}
        {slide.cta ? (
          <a
            className="deck-slide-link"
            href={slide.cta.href}
            target={isExternalLink(slide.cta.href) ? "_blank" : undefined}
            rel={isExternalLink(slide.cta.href) ? "noopener noreferrer" : undefined}
            data-testid={`deck-slide-link-${slide.id}`}
          >
            {slide.cta.label}
            <ArrowUpRight className="deck-icon" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <div className="deck-slide-side">
        <SlideSide slide={slide} keyFiguresLabel={keyFiguresLabel} />
      </div>
      <div className="deck-slide-foot" aria-hidden="true">
        <span>{slide.footer}</span>
        <span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
    </article>
  );
}

export function DeckApp({ config }: DeckAppProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [documentMode, setDocumentMode] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);
  const pointerStart = useRef<number | null>(null);
  const slides = config.slides;
  const total = slides.length;
  const activeSlide = slides[activeIndex];
  const themeStyle = {
    "--deck-bg": config.theme.background,
    "--deck-surface": config.theme.surface,
    "--deck-panel": config.theme.panel,
    "--deck-line": config.theme.border,
    "--deck-text": config.theme.text,
    "--deck-muted": config.theme.muted,
    "--deck-dim": config.theme.dim,
    "--deck-cyan": config.theme.accent,
    "--deck-blue": config.theme.accentBlue,
  } as CSSProperties;

  const announce = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2400);
  }, []);

  const goTo = useCallback((index: number) => {
    if (!total) return;
    setActiveIndex((index + total) % total);
  }, [total]);

  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    if (documentMode || total < 2) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(total - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [documentMode, goTo, next, previous, total]);

  const shareDeck = async () => {
    const shareData = { title: config.brand.name, text: config.brand.tagline, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        announce(config.ui.linkCopiedNotice);
      } else {
        announce(config.ui.copyFallbackNotice);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") announce(config.ui.shareErrorNotice);
    }
  };

  const printDeck = () => {
    if (!documentMode) {
      setDocumentMode(true);
      window.setTimeout(() => window.print(), 80);
      return;
    }
    window.print();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;
    pointerStart.current = event.clientX;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > 48) (delta > 0 ? previous : next)();
  };

  const slideNav = (className = "") => (
    <nav className={`deck-tab-list ${className}`} aria-label={config.ui.chooseSectionLabel} data-testid="deck-slide-tabs">
      {slides.map((slide, index) => (
        <button
          type="button"
          className="deck-tab"
          key={slide.id}
          aria-current={activeIndex === index ? "step" : undefined}
          aria-label={`${config.ui.goToSectionLabel} ${index + 1}: ${slide.title}`}
          onClick={() => goTo(index)}
          data-testid={`deck-tab-${slide.id}`}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          {" · "}
          {slide.title}
        </button>
      ))}
    </nav>
  );

  return (
    <main
      className={`mossaic-deck ${documentMode ? "deck-mode-document" : "deck-mode-carousel"}`}
      style={themeStyle}
      data-testid="mossaic-deck"
    >
      <div className="deck-shell">
        <header className="deck-topbar">
          <a
            className="deck-brand"
            href={config.brand.website.href}
            target={isExternalLink(config.brand.website.href) ? "_blank" : undefined}
            rel={isExternalLink(config.brand.website.href) ? "noopener noreferrer" : undefined}
            data-testid="deck-brand-link"
          >
            <Logo size={37} variant="mark" compact />
            <span className="deck-brand-copy">
              <Wordmark variant="nav" textColor="#edf5ff" />
              <span>{config.brand.descriptor}</span>
            </span>
          </a>
          <div className="deck-header-actions">
            <button
              type="button"
              className="deck-button"
              onClick={() => setDocumentMode((current) => !current)}
              aria-pressed={documentMode}
              data-testid="deck-toggle-view"
            >
              {documentMode ? <Layers3 className="deck-icon" /> : <FileText className="deck-icon" />}
               <span>{documentMode ? config.ui.carouselLabel : config.ui.documentLabel}</span>
            </button>
            <button type="button" className="deck-button" onClick={shareDeck} data-testid="deck-share" aria-label={config.ui.shareLabel}>
              <Share2 className="deck-icon" />
              <span>{config.ui.shareLabel}</span>
            </button>
            <button
              type="button"
              className="deck-button deck-button-primary"
              onClick={printDeck}
              data-testid="deck-print"
            >
              <Printer className="deck-icon" />
              <span>{config.ui.printLabel}</span>
            </button>
          </div>
        </header>

        <section className="deck-intro" aria-labelledby="deck-title">
          <div className="deck-intro-copy">
            <div className="deck-overline">{config.intro.eyebrow}</div>
            <h1 id="deck-title">{config.intro.title} <span>{config.intro.highlight}</span></h1>
            <p>{config.intro.description}</p>
          </div>
          <div className="deck-intro-index" aria-hidden="true">
            <span>{config.brand.location}</span>
          </div>
        </section>

        {documentMode ? (
          <section className="deck-document" aria-label={config.ui.documentAriaLabel} data-testid="deck-document">
            <div className="deck-document-heading">
              <span>{config.brand.tagline}</span>
              <span>{total} {config.ui.sectionCountLabel}</span>
            </div>
            {slides.map((slide, index) => (
              <div className="deck-stage" key={slide.id}>
              <DeckSlideView
                slide={slide}
                index={index}
                total={total}
                capabilitiesLabel={config.ui.capabilitiesLabel}
                keyFiguresLabel={config.ui.keyFiguresLabel}
              />
              </div>
            ))}
          </section>
        ) : activeSlide ? (
          <>
            {slideNav("deck-controls")}
            <section
              className="deck-stage"
              aria-roledescription="carousel"
              aria-label={config.ui.carouselAriaLabel}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              data-testid="deck-carousel"
            >
              <DeckSlideView
                slide={activeSlide}
                index={activeIndex}
                total={total}
                capabilitiesLabel={config.ui.capabilitiesLabel}
                keyFiguresLabel={config.ui.keyFiguresLabel}
              />
            </section>
            <div className="deck-controlbar deck-controls">
              <button type="button" className="deck-button deck-nav-arrow" onClick={previous} aria-label={config.ui.previousSectionLabel} data-testid="deck-previous">
                <ArrowLeft className="deck-icon" />
                <span className="deck-nav-word">{config.ui.previousLabel}</span>
              </button>
              <div className="deck-progress" aria-live="polite" data-testid="deck-progress">
                <span><strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(total).padStart(2, "0")}</span>
                <span className="deck-progress-track" aria-hidden="true">
                  <span style={{ transform: `scaleX(${total ? (activeIndex + 1) / total : 0})` }} />
                </span>
              </div>
              <button type="button" className="deck-button deck-nav-arrow" onClick={next} aria-label={config.ui.nextSectionLabel} data-testid="deck-next">
                <span className="deck-nav-word">{config.ui.nextLabel}</span>
                <ArrowRight className="deck-icon" />
              </button>
            </div>
          </>
        ) : (
          <section className="deck-stage" role="status" data-testid="deck-empty">
            <div className="deck-slide-main">{config.ui.emptyMessage}</div>
          </section>
        )}

        <footer className="deck-bottom-meta">
          <span>{config.brand.tagline}</span>
          <a className="deck-email-link" href={config.brand.email.href} data-testid="deck-contact">
            {config.brand.email.label}
          </a>
        </footer>
      </div>
      {notice ? (
        <div className="deck-toast" role="status" data-testid="deck-notice">
          {notice === config.ui.linkCopiedNotice ? <Check className="deck-icon" aria-hidden="true" /> : <Copy className="deck-icon" aria-hidden="true" />}
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default DeckApp;
