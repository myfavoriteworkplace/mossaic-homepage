import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Globe2,
  House,
  Info,
  Layers3,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Printer,
  Share2,
  ShieldCheck,
} from "lucide-react";
import BookMySlotText from "../../components/ui/BookMySlotText";
import Wordmark from "../../components/ui/Wordmark";
import {
  LABS_FEATURES,
  PRODUCTS,
  ROADMAP,
  SITE_CONFIG,
  STUDIO_PROJECTS,
} from "../../data/content";
import type { Product } from "../../data/schemas";
import type { DeckContent, DeckSlide } from "./types";
import DeckContactModal from "./DeckContactModal";
import { LocalQr } from "./qr";
import "./deck.css";

type DeckAppProps = { config: DeckContent };
type PatientStatus = "pending" | "confirmed";
const AUTO_ADVANCE_DELAY_MS = 8_000;

const siteUrl = `https://${SITE_CONFIG.site.domains.split("·")[0].trim()}`;
const contactHref = `${siteUrl}/#contact`;
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

function isContactLink(href: string) {
  return href === "#contact" || href.endsWith("/#contact");
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
  onContact,
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
  onContact: () => void;
}) {
  const external = href ? isExternalLink(href) : false;
  const contactAction = href ? isContactLink(href) : false;
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
        contactAction ? (
          <button
            type="button"
            className={`deck-live-link deck-live-link-button ${slide.kind === "bookmyslot" ? "is-green" : ""}`}
            onClick={onContact}
            aria-haspopup="dialog"
          >
            {slide.kind === "bookmyslot" ? <span className="deck-live-dot" aria-hidden="true" /> : null}
            {linkLabel}
            <ArrowUpRight className="deck-icon" aria-hidden="true" />
          </button>
        ) : (
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
        )
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
  onContact,
}: {
  slide: DeckSlide;
  content: DeckContent;
  onContact: () => void;
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
        onContact={onContact}
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

function BrandServiceShowcase({ slide, product, content, onContact }: {
  slide: DeckSlide;
  product: Product;
  content: DeckContent;
  onContact: () => void;
}) {
  const contactLink = resolveLink(product.cta.href);
  const isStudio = product.id === "mossaic-studio";
  const availableCount = isStudio
    ? STUDIO_PROJECTS.filter((project) => project.status === "live").length
    : LABS_FEATURES.filter((feature) => feature.status === "available").length;
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
        onContact={onContact}
      />
      <section className="deck-brand-service">
        <div className="deck-brand-service-copy">
          <span className="deck-brand-service-label">{product.category}</span>
          {isStudio ? (
            <>
              <p className="deck-studio-lead">{slide.description}</p>
              <ul className="deck-studio-points">
                <li><strong>Industry experience:</strong> logistics, healthcare, retail, oil and gas, and other industries.</li>
                <li><strong>Technical SEO:</strong> help customers find you on Google and AI search tools like ChatGPT and Gemini.</li>
              </ul>
            </>
          ) : <p>{product.description}</p>}
        </div>
        <div className="deck-brand-service-capabilities">
          <div className="deck-brand-service-heading">
            <span className="deck-brand-service-label">{content.ui.featureDevelopmentLabel}</span>
            <span className="deck-brand-service-count">
              <span className="deck-live-dot" aria-hidden="true" />
              {availableCount} {isStudio ? "Live" : "Available"}
            </span>
          </div>
          <div className="deck-brand-capability-list">
            {product.tags.map((tag) => (
              <span className="deck-brand-capability" key={tag}>{tag}</span>
            ))}
          </div>
          <div className="deck-brand-feature-list">
            {isStudio
              ? STUDIO_PROJECTS.map((project) => (
                  <a
                    className="deck-brand-feature-row"
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={project.id}
                  >
                    <span className="deck-brand-feature-copy">
                      <strong>{project.name}</strong>
                      <span>{project.category}</span>
                    </span>
                    <span className="deck-brand-feature-status" data-status={project.status}>
                      {project.status === "live" ? "Live" : "In progress"}
                    </span>
                  </a>
                ))
              : LABS_FEATURES.map((feature) => {
                  const href = resolveLink(feature.href);
                  const rowContent = (
                    <>
                      <span className="deck-brand-feature-copy">
                        <strong>
                          {feature.id === "bookmyslot" ? <BookMySlotText /> : feature.name}
                        </strong>
                        <span>{feature.category}</span>
                      </span>
                      <span className="deck-brand-feature-status" data-status={feature.status}>
                        {feature.statusLabel}
                      </span>
                    </>
                  );
                  return isContactLink(href) ? (
                    <button
                      type="button"
                      className="deck-brand-feature-row"
                      key={feature.id}
                      onClick={onContact}
                      aria-haspopup="dialog"
                    >
                      {rowContent}
                    </button>
                  ) : (
                    <a
                      className="deck-brand-feature-row"
                      href={href}
                      target={isExternalLink(href) ? "_blank" : undefined}
                      rel={isExternalLink(href) ? "noopener noreferrer" : undefined}
                      key={feature.id}
                    >
                      {rowContent}
                    </a>
                  );
                })}
          </div>
        </div>
      </section>
    </article>
  );
}

function ProductPipeline({ content, onContact }: { content: DeckContent; onContact: () => void }) {
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
              onContact={onContact}
            />
          );
        })}
      </div>
      <div className="deck-contact-row">
        <div className="deck-contact-copy">
          <h2>{content.narrative.closingTitle}</h2>
          <p>{content.narrative.closingDescription}</p>
          <div className="deck-contact-details">
            <button
              type="button"
              onClick={onContact}
              aria-haspopup="dialog"
              data-testid="deck-contact-email"
            >
              <Mail aria-hidden="true" />{SITE_CONFIG.site.email}
            </button>
            {SITE_CONFIG.site.alternateEmail && (
              <button
                type="button"
                onClick={onContact}
                aria-haspopup="dialog"
                data-testid="deck-contact-alternate-email"
              >
                <Mail aria-hidden="true" />Alternative · {SITE_CONFIG.site.alternateEmail}
              </button>
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

function PipelineProduct({ product, title, description, year, onContact }: {
  product: Product;
  title: string;
  description: string;
  year: string;
  onContact: () => void;
}) {
  const href = resolveLink(product.cta.href);
  const yearTone = product.status === "soon" ? "amber" : "purple";
  const cardContent = (
    <>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className={`deck-pipeline-status deck-pipeline-status-${yearTone}`}>{year}</span>
    </>
  );
  if (isContactLink(href)) {
    return (
      <button
        type="button"
        className="deck-pipeline-item"
        onClick={onContact}
        aria-haspopup="dialog"
        data-testid={`deck-pipeline-${product.id}`}
      >
        {cardContent}
      </button>
    );
  }
  return (
    <a
      className="deck-pipeline-item"
      href={href}
      target={isExternalLink(href) ? "_blank" : undefined}
      rel={isExternalLink(href) ? "noopener noreferrer" : undefined}
      data-testid={`deck-pipeline-${product.id}`}
    >
      {cardContent}
    </a>
  );
}

function ClosingShowcase({ slide, onContact }: { slide: DeckSlide; onContact: () => void }) {
  return (
    <article className="deck-slide deck-closing" data-slide="closing" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader slide={slide} href={contactHref} linkLabel="Start a conversation" onContact={onContact} />
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

function SlideContent({ slide, content, onContact }: {
  slide: DeckSlide;
  content: DeckContent;
  onContact: () => void;
}) {
  if (slide.kind === "bookmyslot") return <BookingShowcase slide={slide} content={content} onContact={onContact} />;
  if (slide.kind === "mossaic-labs" && labsProduct) {
    return <BrandServiceShowcase slide={slide} product={labsProduct} content={content} onContact={onContact} />;
  }
  if (slide.kind === "mossaic-studio" && studioProduct) {
    return <BrandServiceShowcase slide={slide} product={studioProduct} content={content} onContact={onContact} />;
  }
  return <ClosingShowcase slide={slide} onContact={onContact} />;
}

export function DeckApp({ config }: DeckAppProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  const [isTouchViewport, setIsTouchViewport] = useState(false);
  const [documentMode, setDocumentMode] = useState(false);
  // Keep the first render deterministic for static prerender + hydration.
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [notice, setNotice] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
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
    && !isCardHovered
    && !isRotationPaused
    && total > 1
  );
  const tabHint = isRotationPaused
    ? config.ui.tabPausedHint
    : isTouchViewport
      ? config.ui.tabHintTouch
      : config.ui.tabHint;
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
  const closeContactModal = useCallback(() => setIsContactOpen(false), []);
  const openContactModal = useCallback(() => setIsContactOpen(true), []);
  const goTo = useCallback((index: number) => {
    if (!total) return;
    setIsRotationPaused(true);
    setActiveIndex((index + total) % total);
  }, [total]);
  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const touchViewport = window.matchMedia("(max-width: 767px), (hover: none), (pointer: coarse)");
    const updateTouchViewport = () => setIsTouchViewport(touchViewport.matches);
    updateTouchViewport();
    touchViewport.addEventListener("change", updateTouchViewport);
    return () => touchViewport.removeEventListener("change", updateTouchViewport);
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
  const closeActionMenu = (target: HTMLElement) => {
    target.closest("details")?.removeAttribute("open");
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button, a")) return;
    pointerStart.current = event.clientX;
  };
  const handleCardPointerEnter = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") setIsCardHovered(true);
  };
  const handleCardPointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") setIsCardHovered(false);
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
      <nav className="deck-home-nav" aria-label="Deck navigation">
        <a
          className="deck-button deck-button-home deck-home-float"
          href={siteUrl}
          aria-label="Mossaic home"
          title="Mossaic home"
          data-testid="deck-home"
        >
          <House className="deck-icon" aria-hidden="true" />
        </a>
      </nav>
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
              <span className="deck-brand-description">{config.ui.brandDescription}</span>
            </span>
          </a>
          <div className="deck-header-actions">
            <button
              type="button"
              className="deck-button deck-button-primary deck-button-contact"
              onClick={openContactModal}
              aria-haspopup="dialog"
              aria-expanded={isContactOpen}
              data-testid="deck-email"
            >
              <Mail className="deck-icon" aria-hidden="true" />
              <span>Talk to our team</span>
            </button>
            <details className="deck-more-actions" aria-label="More portfolio actions" data-testid="deck-more-actions">
              <summary className="deck-more-trigger">
                <MoreHorizontal className="deck-icon" aria-hidden="true" />
                <span>More</span>
              </summary>
              <div className="deck-more-menu">
                <button
                  type="button"
                  className="deck-more-item"
                  onClick={(event) => {
                    closeActionMenu(event.currentTarget);
                    setDocumentMode((current) => !current);
                  }}
                  aria-pressed={documentMode}
                  data-testid="deck-toggle-view"
                >
                  {documentMode ? <Layers3 className="deck-icon" aria-hidden="true" /> : <FileText className="deck-icon" aria-hidden="true" />}
                  <span>{documentMode ? config.ui.carouselLabel : config.ui.documentLabel}</span>
                </button>
                <button
                  type="button"
                  className="deck-more-item"
                  onClick={(event) => {
                    closeActionMenu(event.currentTarget);
                    void shareDeck();
                  }}
                  data-testid="deck-share"
                >
                  <Share2 className="deck-icon" aria-hidden="true" />
                  <span>{config.ui.shareLabel}</span>
                </button>
                <button
                  type="button"
                  className="deck-more-item"
                  onClick={(event) => {
                    closeActionMenu(event.currentTarget);
                    printDeck();
                  }}
                  data-testid="deck-print"
                >
                  <Printer className="deck-icon" aria-hidden="true" />
                  <span>{config.ui.printLabel}</span>
                </button>
                <a
                  className="deck-more-item deck-more-whatsapp"
                  href={deckWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="deck-whatsapp"
                >
                  <MessageCircle className="deck-icon" aria-hidden="true" />
                  <span>{config.ui.whatsappLabel}</span>
                </a>
              </div>
            </details>
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
                <SlideContent slide={slide} content={config} onContact={openContactModal} />
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
                <p className="deck-tabs-hint">{tabHint}</p>
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
              onPointerEnter={handleCardPointerEnter}
              onPointerLeave={(event) => {
                handleCardPointerLeave(event);
                resetCardTilt();
              }}
              data-testid="deck-carousel"
            >
              <SlideContent key={activeSlide.id} slide={activeSlide} content={config} onContact={openContactModal} />
            </section>
            <nav
              className="deck-carousel-controls"
              aria-label={config.ui.chooseSectionLabel}
              data-testid="deck-carousel-controls"
            >
              <button
                type="button"
                className="deck-carousel-arrow"
                onClick={previous}
                aria-label={config.ui.previousSectionLabel}
                data-testid="deck-control-previous"
                disabled={total < 2}
              >
                <ArrowLeft aria-hidden="true" size={22} strokeWidth={1.8} />
              </button>
              <div className="deck-carousel-pagination" role="group" aria-label={config.ui.chooseSectionLabel}>
                {slides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={`deck-carousel-dot${activeIndex === index ? " is-current" : ""}`}
                    aria-label={`${config.ui.goToSectionLabel} ${index + 1}: ${slide.navigationLabel ?? slide.title}`}
                    aria-current={activeIndex === index ? "step" : undefined}
                    onClick={() => goTo(index)}
                    data-testid={`deck-control-slide-${slide.id}`}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="deck-rotation-toggle"
                onClick={() => setIsRotationPaused((current) => !current)}
                aria-label={isRotationPaused ? "Resume automatic rotation" : "Pause automatic rotation"}
                title={isRotationPaused ? "Resume automatic rotation" : "Pause automatic rotation"}
                data-testid="deck-rotation-toggle"
                disabled={total < 2 || prefersReducedMotion === true}
              >
                {isRotationPaused
                  ? <Play aria-hidden="true" size={16} />
                  : <Pause aria-hidden="true" size={16} />}
                <span>{isRotationPaused ? "Resume" : "Pause"}</span>
              </button>
              <button
                type="button"
                className="deck-carousel-arrow"
                onClick={next}
                aria-label={config.ui.nextSectionLabel}
                data-testid="deck-control-next"
                disabled={total < 2}
              >
                <ArrowRight aria-hidden="true" size={22} strokeWidth={1.8} />
              </button>
            </nav>
          </>
        ) : (
          <section className="deck-empty" role="status" data-testid="deck-empty">{config.ui.emptyMessage}</section>
        )}

        <ProductPipeline content={config} onContact={openContactModal} />
      </div>
      {notice ? <div className="deck-toast" role="status" data-testid="deck-notice"><Check className="deck-icon" aria-hidden="true" />{notice}</div> : null}
      {isContactOpen ? <DeckContactModal onClose={closeContactModal} /> : null}
    </main>
  );
}

export default DeckApp;
