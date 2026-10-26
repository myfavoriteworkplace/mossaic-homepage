import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Globe2,
  Info,
  Layers3,
  Mail,
  MapPin,
  MessageCircle,
  Printer,
  Share2,
  ShieldCheck,
} from "lucide-react";
import BookMySlotText from "../../components/ui/BookMySlotText";
import Wordmark from "../../components/ui/Wordmark";
import { PRODUCTS, ROADMAP, SITE_CONFIG } from "../../data/content";
import type { Product } from "../../data/schemas";
import type { DeckContent, DeckSlide } from "./types";
import { LocalQr } from "./qr";
import "./deck.css";

type DeckAppProps = { config: DeckContent };
type PatientStatus = "pending" | "confirmed";
const AUTO_ADVANCE_DELAY_MS = 3_000;

const siteUrl = `https://${SITE_CONFIG.site.domains.split("·")[0].trim()}`;
const contactHref = `${siteUrl}/#contact`;
const emailHref = `mailto:${SITE_CONFIG.site.email}`;
const whatsappHref = "https://wa.me/919746767146";
const deckWhatsappHref = `${whatsappHref}?text=${encodeURIComponent("Hi mossAIc Team, I saw your interactive deck and would like to discuss a project.")}`;
const bookingProduct = PRODUCTS.find((product) => product.id === "bookmyslot");
const labsProduct = PRODUCTS.find((product) => product.id === "mossaic-labs");
const studioProduct = PRODUCTS.find((product) => product.id === "mossaic-studio");

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

function resolveLink(href: string) {
  return href.startsWith("#") ? `${siteUrl}/${href}` : href;
}

function MetricCard({
  value,
  label,
  demo = false,
  demoLabel,
}: {
  value: string;
  label: string;
  demo?: boolean;
  demoLabel?: string;
}) {
  return (
    <div className={`deck-metric-card ${demo ? "deck-demo-metric" : ""}`}>
      <strong className="deck-metric-value">{value}</strong>
      <span className="deck-metric-label">{label}</span>
      {demo && demoLabel ? <span className="deck-demo-label">{demoLabel}</span> : null}
    </div>
  );
}

function ShareAction({ label, onShare }: { label: string; onShare: () => void | Promise<void> }) {
  return (
    <button
      type="button"
      className="deck-button deck-share-action"
      onClick={() => void onShare()}
      aria-label={label}
      title={label}
      data-testid="deck-share"
    >
      <Share2 className="deck-icon" aria-hidden="true" />
    </button>
  );
}

function SlideHeader({
  slide,
  href,
  linkLabel,
  statusLabel,
  titleOverride,
  highlightOverride,
  descriptionOverride,
  eyebrowOverride,
  titleHref,
  brandLockup,
}: {
  slide: DeckSlide;
  href?: string;
  linkLabel?: string;
  statusLabel?: string;
  titleOverride?: ReactNode;
  highlightOverride?: string;
  descriptionOverride?: string;
  eyebrowOverride?: string;
  titleHref?: string;
  brandLockup?: ReactNode;
}) {
  const external = href ? isExternalLink(href) : false;
  const externalTitle = titleHref ? isExternalLink(titleHref) : false;
  const subtitle = descriptionOverride ?? slide.description;
  const highlight = highlightOverride ?? slide.highlight;
  const heading = (
    <>
      {brandLockup ?? titleOverride ?? slide.title}
      {highlight ? <> <em>{highlight}</em></> : null}
    </>
  );
  return (
    <div className="deck-slide-head">
      <div className="deck-slide-head-main">
        <div className="deck-slide-labels">
          <span className="deck-slide-kicker">{eyebrowOverride ?? slide.eyebrow}</span>
          {statusLabel ? <span className="deck-slide-status">{statusLabel}</span> : null}
        </div>
        <h2 className="deck-slide-title">
          {titleHref ? (
            <a
              className={`deck-slide-title-link ${brandLockup ? "deck-brand-title-link" : ""}`}
              href={titleHref}
              target={externalTitle ? "_blank" : undefined}
              rel={externalTitle ? "noopener noreferrer" : undefined}
            >
              {heading}<ArrowUpRight aria-hidden="true" />
            </a>
          ) : heading}
        </h2>
        {subtitle ? <p className="deck-slide-subtitle">{subtitle}</p> : null}
      </div>
      {href && linkLabel ? (
        <a
          className={`deck-live-link ${slide.kind === "bookmyslot" ? "is-green" : ""}`}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {slide.kind === "bookmyslot" ? <span className="deck-live-dot" aria-hidden="true" /> : null}
          {linkLabel}
          <ArrowUpRight className="deck-icon" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

function ProductBrandLockup({ product }: { product: Product }) {
  const isBookMySlot = product.id === "bookmyslot";
  const brandSubtitle = product.id === "mossaic-studio" ? product.category : product.subLabel;
  const productSuffix = product.id === "mossaic-labs" ? "Labs" : "Studio";
  const markSrc = isBookMySlot
    ? `${import.meta.env.BASE_URL}icons/products/bookmyslot-icon.svg`
    : `${import.meta.env.BASE_URL}icons/brand/mossaic-faithful.svg`;

  return (
    <span className={`deck-brand-lockup ${isBookMySlot ? "is-bookmyslot" : "is-mossaic"}`}>
      <img className="deck-brand-lockup-mark" src={markSrc} alt="" aria-hidden="true" />
      <span className="deck-brand-lockup-copy">
        <span className="deck-brand-lockup-name">
          {isBookMySlot ? (
            <BookMySlotText className="deck-bookmyslot-wordmark" />
          ) : (
            <span className="deck-mossaic-wordmark">
              <Wordmark variant="nav" textColor="var(--deck-text)" />
              <span className="deck-brand-lockup-suffix">{productSuffix}</span>
            </span>
          )}
        </span>
        <span className="deck-brand-lockup-subtitle">{brandSubtitle}</span>
      </span>
    </span>
  );
}

function PatientCard({
  patient,
  status,
  onToggle,
}: {
  patient: DeckContent["demoPatients"][number];
  status: PatientStatus;
  onToggle: () => void;
}) {
  return (
    <article className="deck-patient" data-status={status}>
      <div className="deck-patient-header">
        <div className="deck-patient-identity">
          <div className="deck-avatar" aria-hidden="true">{patient.initials}</div>
          <div>
            <div className="deck-patient-name">{patient.name}</div>
            <div className="deck-patient-id">{patient.id} • {patient.age}y {patient.gender}</div>
          </div>
        </div>
        <button
          type="button"
          className="deck-status-button"
          data-status={status}
          onClick={onToggle}
          aria-label={`Demo appointment status for ${patient.name}: ${status}. Toggle status`}
          aria-pressed={status === "confirmed"}
        >
          {status === "confirmed" ? "Confirmed ✓" : "Pending ⚡"}
        </button>
      </div>
      <div className="deck-patient-details">
        <div className="deck-patient-detail"><CalendarDays aria-hidden="true" /> <span>Scheduled: {patient.scheduled}</span></div>
        <div className="deck-patient-detail"><MessageCircle aria-hidden="true" /> <span>Reason: {patient.reason}</span></div>
        <div className="deck-patient-detail"><Mail aria-hidden="true" /> <span>Reminders: Email Active</span></div>
      </div>
    </article>
  );
}

function BookingShowcase({
  slide,
  content,
}: {
  slide: DeckSlide;
  content: DeckContent;
}) {
  const [patientStatuses, setPatientStatuses] = useState<PatientStatus[]>(
    content.demoPatients.map((patient) => patient.status),
  );
  const officialMetrics = bookingProduct?.metrics ?? [];
  const productHref = bookingProduct?.cta.href ?? `${siteUrl}/#products`;
  const productStatusLabel = bookingProduct?.status === "live"
    ? content.ui.liveProductLabel
    : bookingProduct?.statusLabel;

  const togglePatient = (index: number) => {
    setPatientStatuses((current) => current.map((status, statusIndex) =>
      statusIndex === index ? (status === "pending" ? "confirmed" : "pending") : status,
    ));
  };

  return (
    <article className="deck-slide" data-slide="bookmyslot" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader
        slide={slide}
        brandLockup={bookingProduct ? <ProductBrandLockup product={bookingProduct} /> : undefined}
        highlightOverride=""
        statusLabel={productStatusLabel}
        titleHref={productHref}
        href={productHref}
        linkLabel={bookingProduct?.proofLabel}
      />
      <div
        className="deck-metrics-grid deck-product-metrics"
        aria-label={`${bookingProduct?.name ?? "Product"} metrics and illustrative examples`}
      >
        {officialMetrics.slice(0, 2).map((metric) => (
          <MetricCard
            key={`${metric.value}-${metric.label}`}
            value={metric.value}
            label={metric.label}
          />
        ))}
        {content.narrative.demoMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            value={metric.value}
            label={metric.label}
            demo
            demoLabel={content.ui.illustrativeLabel}
          />
        ))}
        <a
          className="deck-metric-card deck-qr-card"
          href={productHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open bookMySlot website"
        >
          <LocalQr
            value={productHref}
            label={bookingProduct?.name ?? "BookMySlot"}
            size={96}
          />
          <span className="deck-qr-link">Scan to visit</span>
        </a>
      </div>
      <p className="deck-demo-note"><Info aria-hidden="true" />{content.narrative.demoDisclaimer}</p>
      <div>
        <div className="deck-dashboard-title">
          <span>{content.narrative.dashboardTitle} <small>{content.narrative.dashboardHint}</small></span>
          <a href={productHref} target="_blank" rel="noopener noreferrer">bookmyslot.dental.mossaic.in <ArrowUpRight aria-hidden="true" /></a>
        </div>
        <div className="deck-patient-grid">
          {content.demoPatients.map((patient, index) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              status={patientStatuses[index] ?? patient.status}
              onToggle={() => togglePatient(index)}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function BrandServiceShowcase({ slide, product, content }: {
  slide: DeckSlide;
  product: Product;
  content: DeckContent;
}) {
  const contactLink = resolveLink(product.cta.href);
  const serviceStatusLabel = product.status === "live"
    ? content.ui.availableServicesLabel
    : product.statusLabel;

  return (
    <article className="deck-slide" data-slide={product.id} aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader
        slide={slide}
        brandLockup={<ProductBrandLockup product={product} />}
        statusLabel={serviceStatusLabel}
        href={contactLink}
        linkLabel={slide.linkLabel ?? product.cta.label}
      />
      <section className="deck-brand-service">
        <div className="deck-brand-service-copy">
          <span className="deck-brand-service-label">{product.category}</span>
          <p>{product.description}</p>
        </div>
        <div className="deck-brand-service-capabilities">
          <span className="deck-brand-service-label">{content.ui.featureDevelopmentLabel}</span>
          <div className="deck-brand-capability-list">
            {product.tags.map((tag) => (
              <span className="deck-brand-capability" key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

function ProductPipeline({ content }: { content: DeckContent }) {
  return (
    <section className="deck-pipeline-contact" id="deck-contact-panel" aria-labelledby="deck-pipeline-title">
      <h2 className="deck-pipeline-title" id="deck-pipeline-title">{content.narrative.pipelineTitle}</h2>
      <div className="deck-pipeline-grid">
        {content.narrative.pipelineProducts.map((pipelineCopy) => {
          const product = PRODUCTS.find((item) => item.id === pipelineCopy.productId);
          if (!product) return null;
          const year = ROADMAP.find((item) => item.name === product.name)?.year ?? product.statusLabel;
          return (
            <PipelineProduct
              key={product.id}
              product={product}
              title={pipelineCopy.title}
              description={pipelineCopy.description}
              year={year}
            />
          );
        })}
      </div>
      <div className="deck-contact-row">
        <div className="deck-contact-copy">
          <h2>{content.narrative.closingTitle}</h2>
          <p>{content.narrative.closingDescription}</p>
          <div className="deck-contact-details">
            <a href={emailHref} data-testid="deck-contact-email"><Mail aria-hidden="true" />{SITE_CONFIG.site.email}</a>
            {SITE_CONFIG.site.alternateEmail && (
              <a
                href={`mailto:${SITE_CONFIG.site.alternateEmail}`}
                data-testid="deck-contact-alternate-email"
              >
                <Mail aria-hidden="true" />Alternative · {SITE_CONFIG.site.alternateEmail}
              </a>
            )}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-whatsapp"><MessageCircle aria-hidden="true" />Phone / WhatsApp · +91 97467 67146</a>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-site"><Globe2 aria-hidden="true" />{siteUrl.replace(/^https?:\/\//, "")}</a>
            <span className="deck-contact-location"><MapPin aria-hidden="true" />{SITE_CONFIG.site.location}</span>
          </div>
        </div>
        <div className="deck-contact-qrs" aria-label="Scan for Mossaic destinations">
          <a className="deck-contact-qr" href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-qr-site">
            <LocalQr value={siteUrl} label="Mossaic website" size={128} />mossaic.in
          </a>
          <a className="deck-contact-qr" href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-qr-whatsapp">
            <LocalQr value={whatsappHref} label="Mossaic WhatsApp chat" size={128} />WhatsApp Chat
          </a>
        </div>
      </div>
      <div className="deck-copyright">
        © {new Date().getFullYear()} mossAIc Technologies · All rights reserved.
      </div>
    </section>
  );
}

function PipelineProduct({ product, title, description, year }: {
  product: Product;
  title: string;
  description: string;
  year: string;
}) {
  const href = resolveLink(product.cta.href);
  const yearTone = product.status === "soon" ? "amber" : "purple";
  return (
    <a
      className="deck-pipeline-item"
      href={href}
      target={isExternalLink(href) ? "_blank" : undefined}
      rel={isExternalLink(href) ? "noopener noreferrer" : undefined}
      data-testid={`deck-pipeline-${product.id}`}
    >
      <div>
          <h3>{title}</h3>
          <p>{description}</p>
      </div>
      <span className={`deck-pipeline-status deck-pipeline-status-${yearTone}`}>{year}</span>
    </a>
  );
}

function ClosingShowcase({ slide }: { slide: DeckSlide }) {
  return (
    <article className="deck-slide deck-closing" data-slide="closing" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader slide={slide} href={contactHref} linkLabel="Start a conversation" />
      <div className="deck-closing-facts">
        {SITE_CONFIG.complianceBadges.map((badge) => <span className="deck-tag" key={badge}><ShieldCheck aria-hidden="true" />{badge}</span>)}
        <p className="deck-fact-note"><ClipboardList aria-hidden="true" />{SITE_CONFIG.company.focus}</p>
      </div>
      <SlideFoot slide={slide} />
    </article>
  );
}

function SlideFoot({ slide }: { slide: DeckSlide }) {
  return (
    <div className="deck-slide-foot">
      <span>{slide.footer}</span>
      <span>{SITE_CONFIG.site.location}</span>
    </div>
  );
}

function SlideContent({ slide, content }: {
  slide: DeckSlide;
  content: DeckContent;
}) {
  if (slide.kind === "bookmyslot") return <BookingShowcase slide={slide} content={content} />;
  if (slide.kind === "mossaic-labs" && labsProduct) {
    return <BrandServiceShowcase slide={slide} product={labsProduct} content={content} />;
  }
  if (slide.kind === "mossaic-studio" && studioProduct) {
    return <BrandServiceShowcase slide={slide} product={studioProduct} content={content} />;
  }
  return <ClosingShowcase slide={slide} />;
}

export function DeckApp({ config }: DeckAppProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [documentMode, setDocumentMode] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);
  const pointerStart = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const slides = config.slides;
  const total = slides.length;
  const activeSlide = slides[activeIndex];
  const autoAdvanceActive = (
    !documentMode
    && isDocumentVisible
    && prefersReducedMotion !== true
    && total > 1
  );
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
    "--deck-green": config.theme.accentGreen,
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
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!autoAdvanceActive) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % total);
    }, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, autoAdvanceActive, total]);

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
    const shareData = { title: config.meta.title, text: SITE_CONFIG.site.tagline, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        announce(config.ui.linkCopiedNotice);
      } else announce(config.ui.copyFallbackNotice);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") announce(config.ui.shareErrorNotice);
    }
  };

  const printDeck = () => {
    if (!documentMode) {
      setDocumentMode(true);
      window.setTimeout(() => window.print(), 80);
    } else window.print();
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button, a")) return;
    pointerStart.current = event.clientX;
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = event.currentTarget.querySelector<HTMLElement>(".deck-slide");
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--tilt-x", `${-y * 8}deg`);
    card.style.setProperty("--tilt-y", `${x * 8}deg`);
  };
  const resetCardTilt = () => {
    const card = document.querySelector<HTMLElement>(".deck-mode-carousel .deck-slide");
    card?.style.setProperty("--tilt-x", "0deg");
    card?.style.setProperty("--tilt-y", "0deg");
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > 48) (delta > 0 ? previous : next)();
  };
  const slideNav = () => (
    <nav className="deck-tab-list" aria-label={config.ui.chooseSectionLabel} data-testid="deck-slide-tabs">
      {slides.map((slide, index) => (
        <button
          type="button"
          className="deck-tab"
          key={slide.id}
          aria-current={activeIndex === index ? "step" : undefined}
          aria-label={`${config.ui.goToSectionLabel} ${index + 1}: ${slide.navigationLabel ?? slide.title}`}
          onClick={() => goTo(index)}
          data-testid={`deck-tab-${slide.id}`}
        >
          <span>{String(index + 1).padStart(2, "0")}.</span>{slide.navigationLabel ?? slide.title}
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
          <a className="deck-brand" href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-brand-link">
            <img
              className="deck-brand-mark"
              src={`${import.meta.env.BASE_URL}icons/brand/mossaic-faithful.svg`}
              alt=""
              aria-hidden="true"
              width="36"
              height="32"
            />
            <span className="deck-brand-copy">
              <span className="deck-brand-title-row">
                <Wordmark variant="nav" textColor="#f1f5f9" />
                <span className="deck-live-badge">{config.ui.portfolioLabel}</span>
              </span>
              <span className="deck-brand-tagline">{config.ui.brandTagline}</span>
              <span className="deck-brand-acronym">{config.ui.brandAcronym}</span>
            </span>
          </a>
          <div className="deck-header-actions">
            <button type="button" className="deck-button" onClick={() => setDocumentMode((current) => !current)} aria-pressed={documentMode} data-testid="deck-toggle-view">
              {documentMode ? <Layers3 className="deck-icon" aria-hidden="true" /> : <FileText className="deck-icon" aria-hidden="true" />}
              <span>{documentMode ? config.ui.carouselLabel : config.ui.documentLabel}</span>
            </button>
            <button type="button" className="deck-button" onClick={shareDeck} data-testid="deck-share" aria-label={config.ui.shareLabel}>
              <Share2 className="deck-icon" aria-hidden="true" /><span>{config.ui.shareLabel}</span>
            </button>
            <button type="button" className="deck-button deck-button-primary" onClick={printDeck} data-testid="deck-print">
              <Printer className="deck-icon" aria-hidden="true" /><span>{config.ui.printLabel}</span>
            </button>
            <a className="deck-button deck-button-whatsapp" href={deckWhatsappHref} target="_blank" rel="noopener noreferrer" data-testid="deck-whatsapp">
              <MessageCircle className="deck-icon" aria-hidden="true" /><span>{config.ui.whatsappLabel}</span>
            </a>
          </div>
        </header>

        {documentMode ? (
          <section className="deck-document" aria-label={config.ui.documentAriaLabel} data-testid="deck-document">
            <div className="deck-document-heading">
              <span>{SITE_CONFIG.site.tagline}</span>
              <span>{total} {config.ui.sectionCountLabel}</span>
              <ShareAction label={config.ui.shareLabel} onShare={shareDeck} />
            </div>
            {slides.map((slide) => (
              <div className="deck-showcase" key={slide.id}>
                <SlideContent slide={slide} content={config} />
              </div>
            ))}
          </section>
        ) : activeSlide ? (
          <>
            <div className="deck-tabs-wrap">
              <div className="deck-tabs-copy">
                <h2 className="deck-tabs-title">
                  <span>{config.ui.tabTitle}</span>
                  <span className="deck-tabs-badge">{config.ui.tabBadge}</span>
                </h2>
                <p className="deck-tabs-hint">{config.ui.tabHint}</p>
              </div>
              {slideNav()}
            </div>
            <section
              className="deck-showcase"
              aria-roledescription="carousel"
              aria-label={config.ui.carouselAriaLabel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                resetCardTilt();
              }}
              data-testid="deck-carousel"
            >
              <SlideContent key={activeSlide.id} slide={activeSlide} content={config} />
            </section>
          </>
        ) : (
          <section className="deck-empty" role="status" data-testid="deck-empty">{config.ui.emptyMessage}</section>
        )}

        <ProductPipeline content={config} />
      </div>
      {notice ? <div className="deck-toast" role="status" data-testid="deck-notice"><Check className="deck-icon" aria-hidden="true" />{notice}</div> : null}
    </main>
  );
}

export default DeckApp;
