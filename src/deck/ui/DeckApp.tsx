import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
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
  Info,
  Layers3,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Printer,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  Wifi,
} from "lucide-react";
import Logo from "../../components/Logo";
import Wordmark from "../../components/ui/Wordmark";
import { HERO_STATS, PRODUCTS, SITE_CONFIG, STUDIO_PROJECTS } from "../../data/content";
import type { Product } from "../../data/schemas";
import type { DeckContent, DeckSlide } from "./types";
import { LocalQr } from "./qr";
import "./deck.css";

type DeckAppProps = { config: DeckContent };
type PatientStatus = "pending" | "confirmed";

const siteUrl = `https://${SITE_CONFIG.site.domains.split("·")[0].trim()}`;
const contactHref = `${siteUrl}/#contact`;
const emailHref = `mailto:${SITE_CONFIG.site.email}`;
const whatsappHref = "https://wa.me/919746767146";
const bookingProduct = PRODUCTS.find((product) => product.id === "bookmyslot");
const studioService = PRODUCTS.find((product) => product.id === "mossaic-studio");
const aeroPulse = STUDIO_PROJECTS.find((project) => project.id === "aeropulse-logistics");

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

function resolveLink(href: string) {
  return href.startsWith("#") ? `${siteUrl}/${href}` : href;
}

function MetricCard({ value, label, demo = false }: { value: string; label: string; demo?: boolean }) {
  return (
    <div className={`deck-metric-card ${demo ? "deck-demo-metric" : ""}`}>
      <strong className="deck-metric-value">{value}</strong>
      <span className="deck-metric-label">{label}</span>
      {demo ? <span className="deck-demo-label">Illustrative demo</span> : null}
    </div>
  );
}

function SlideHeader({
  slide,
  href,
  linkLabel,
  titleOverride,
  descriptionOverride,
  eyebrowOverride,
  statusLabel,
}: {
  slide: DeckSlide;
  href?: string;
  linkLabel?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  eyebrowOverride?: string;
  statusLabel?: string;
}) {
  const external = href ? isExternalLink(href) : false;
  return (
    <div className="deck-slide-head">
      <div className="deck-slide-head-main">
        <div className="deck-slide-labels">
          <span className="deck-slide-kicker">{eyebrowOverride ?? slide.eyebrow}</span>
          {statusLabel ? <span className="deck-status-canonical">{statusLabel}</span> : null}
        </div>
        <h2 className="deck-slide-title">
          {titleOverride ?? slide.title}
          {slide.highlight ? <> <em>{slide.highlight}</em></> : null}
        </h2>
        <p className="deck-slide-subtitle">{descriptionOverride ?? slide.description}</p>
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
    <article className="deck-patient">
      <div className="deck-patient-header">
        <div className="deck-patient-identity">
          <div className="deck-avatar" aria-hidden="true">{patient.initials}</div>
          <div>
            <div className="deck-patient-name">{patient.name}</div>
            <div className="deck-patient-id">{patient.id} · {patient.age}y</div>
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
          {status === "confirmed" ? "Confirmed" : "Pending"}
        </button>
      </div>
      <div className="deck-patient-details">
        <div className="deck-patient-detail"><CalendarDays aria-hidden="true" /> <span>{patient.scheduled}</span></div>
        <div className="deck-patient-detail"><Stethoscope aria-hidden="true" /> <span>{patient.reason}</span></div>
        <div className="deck-patient-detail"><Mail aria-hidden="true" /> <span>Reminder · enabled</span></div>
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

  const togglePatient = (index: number) => {
    setPatientStatuses((current) => current.map((status, statusIndex) =>
      statusIndex === index ? (status === "pending" ? "confirmed" : "pending") : status,
    ));
  };

  return (
    <article className="deck-slide" data-slide="bookmyslot" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader
        slide={slide}
        titleOverride={bookingProduct?.name}
        descriptionOverride={bookingProduct?.description}
        statusLabel={bookingProduct?.statusLabel}
        href={productHref}
        linkLabel="Open product"
      />
      <div className="deck-metrics-grid deck-product-metrics" aria-label="Official bookMySlot product metrics">
        {officialMetrics.map((metric) => (
          <MetricCard key={`${metric.value}-${metric.label}`} value={metric.value} label={metric.label} />
        ))}
        <a
          className="deck-metric-card deck-qr-card"
          href={productHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open bookMySlot website"
        >
          <LocalQr value={productHref} label="bookMySlot" />
          <span className="deck-qr-link">Scan to visit</span>
        </a>
      </div>
      <div className="deck-product-tags" aria-label="Product capabilities">
        {bookingProduct?.tags.map((tag) => <span className="deck-tag" key={tag}>{tag}</span>)}
      </div>
      <div>
        <div className="deck-dashboard-title">
          <span>{content.narrative.dashboardTitle}</span>
          <small>{content.narrative.dashboardHint}</small>
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
        <p className="deck-demo-note"><Info aria-hidden="true" />{content.narrative.demoDisclaimer}</p>
      </div>
      <div className="deck-demo-snapshot">
        <div className="deck-section-eyebrow">{content.narrative.demoMetricTitle}</div>
        <div className="deck-metrics-grid deck-demo-metrics">
          {content.narrative.demoMetrics.map((metric) => (
            <MetricCard key={metric.label} value={metric.value} label={metric.label} demo />
          ))}
        </div>
      </div>
      <SlideFoot slide={slide} />
    </article>
  );
}

function RouteGraphic({ progress, origin, destination }: { progress: number; origin: string; destination: string }) {
  const markerX = 30 + ((570 - 30) * progress) / 100;
  const markerY = 40 + Math.sin((progress / 100) * Math.PI) * -14;
  return (
    <svg className="deck-route-visual" viewBox="0 0 600 80" role="img" aria-label={`Illustrative route progress ${progress}%`}>
      <path d="M30 40 Q180 10 300 40 T570 40" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
      <path className="deck-route-dash" d="M30 40 Q180 10 300 40 T570 40" fill="none" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="30" cy="40" r="7" fill="#030712" stroke="#38bdf8" strokeWidth="3" />
      <circle cx="570" cy="40" r="7" fill="#030712" stroke="#10b981" strokeWidth="3" />
      <g className="deck-route-marker">
        <circle cx={markerX} cy={markerY} r="11" fill="#38bdf8" fillOpacity=".2" />
        <circle cx={markerX} cy={markerY} r="5" fill="#38bdf8" />
      </g>
      <text x="30" y="71" textAnchor="middle">{origin}</text>
      <text x="570" y="71" textAnchor="middle">{destination}</text>
    </svg>
  );
}

function AeroPulseShowcase({ slide, content, onDemoUpdate }: {
  slide: DeckSlide;
  content: DeckContent;
  onDemoUpdate: () => void;
}) {
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const snapshot = content.narrative.routeSnapshots[snapshotIndex];
  const projectHref = aeroPulse?.href ?? siteUrl;
  const nextSnapshot = () => {
    setSnapshotIndex((index) => (index + 1) % content.narrative.routeSnapshots.length);
    onDemoUpdate();
  };

  return (
    <article className="deck-slide" data-slide="aeropulse" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader
        slide={slide}
        titleOverride={aeroPulse?.name}
        eyebrowOverride={aeroPulse ? `Studio project · ${aeroPulse.category}` : "Studio project"}
        href={projectHref}
        linkLabel="View Studio project"
      />
      <section className="deck-route-card" aria-label="AeroPulse illustrative route simulator">
        <div className="deck-route-head">
          <div className="deck-route-title"><Truck aria-hidden="true" />{content.narrative.routeLabel}</div>
          <span className="deck-route-name">{content.narrative.routeCities}</span>
        </div>
        <RouteGraphic progress={snapshot.progress} origin={content.narrative.origin} destination={content.narrative.destination} />
        <div className="deck-route-stats">
          <div className="deck-route-stat">
            <div className="deck-route-stat-label">Estimated delivery window</div>
            <div className="deck-route-stat-value">{snapshot.eta}</div>
          </div>
          <div className="deck-route-stat">
            <div className="deck-route-stat-label">Cargo payload</div>
            <div className="deck-route-stat-value">{snapshot.cargo}</div>
          </div>
          <div className="deck-route-stat">
            <div className="deck-route-stat-label">Telematics state</div>
            <div className="deck-route-stat-value">{snapshot.state}</div>
          </div>
        </div>
        <p className="deck-demo-note"><Info aria-hidden="true" />{content.narrative.routeDisclaimer}</p>
        <div className="deck-sim-controls">
          <p>Snapshot {snapshotIndex + 1} of {content.narrative.routeSnapshots.length} · simulated locally</p>
          <button type="button" className="deck-button" onClick={nextSnapshot}>
            <RefreshCw className="deck-icon" aria-hidden="true" /> Refresh route demo
          </button>
        </div>
      </section>
      <div className="deck-route-feature-grid">
        {content.narrative.routeFeatures.map((feature, index) => (
          <article className="deck-feature-card" key={feature.title}>
            <span className="deck-feature-icon" aria-hidden="true">
              {index === 0 ? <PackageCheck /> : null}
              {index === 1 ? <Wifi /> : null}
              {index === 2 ? <RefreshCw /> : null}
            </span>
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
      <SlideFoot slide={slide} />
    </article>
  );
}

function SystemsShowcase({ slide, content }: { slide: DeckSlide; content: DeckContent }) {
  const projectHref = aeroPulse?.href ?? siteUrl;
  const contactLink = studioService?.cta.href ? resolveLink(studioService.cta.href) : contactHref;
  return (
    <article className="deck-slide" data-slide="systems" aria-label={`${slide.eyebrow}: ${slide.title}`}>
      <SlideHeader
        slide={slide}
        titleOverride={studioService?.name}
        descriptionOverride={studioService?.description}
        statusLabel={studioService?.statusLabel}
        href={contactLink}
        linkLabel="Discuss a system"
      />
      <div className="deck-systems-grid">
        {content.narrative.systems.map((system, index) => (
          <article className="deck-system-card" key={system.title}>
            <div className="deck-system-index">{String(index + 1).padStart(2, "0")}</div>
            <h3>{system.title}</h3>
            <p>{system.description}</p>
          </article>
        ))}
      </div>
      {aeroPulse ? (
        <div className="deck-project-strip">
          <div className="deck-project-copy">
            <div className="deck-project-label"><Sparkles aria-hidden="true" /> Featured custom system deployment</div>
            <h3 className="deck-project-title">{aeroPulse.name}</h3>
            <p className="deck-project-category">{aeroPulse.category} · Studio project</p>
          </div>
          <a className="deck-button" href={projectHref} target="_blank" rel="noopener noreferrer">
            View project <ArrowUpRight className="deck-icon" aria-hidden="true" />
          </a>
        </div>
      ) : null}
      <ul className="deck-principles-list" aria-label="How Mossaic works">
        {SITE_CONFIG.principles.slice(0, 4).map((principle) => (
          <li className="deck-principle" key={principle.num}>
            <span className="deck-principle-index">{principle.num}</span>
            <div><strong>{principle.title}</strong><span>{principle.desc}</span></div>
          </li>
        ))}
      </ul>
      <SlideFoot slide={slide} />
    </article>
  );
}

function ProductPipeline({ content }: { content: DeckContent }) {
  const pipeline = PRODUCTS.filter((product) => product.id !== "bookmyslot" && product.status !== "live");
  return (
    <section className="deck-pipeline-contact" id="deck-contact-panel" aria-labelledby="deck-pipeline-title">
      <h2 className="deck-pipeline-title" id="deck-pipeline-title">{content.narrative.pipelineTitle}</h2>
      <div className="deck-pipeline-grid">
        {pipeline.map((product) => (
          <PipelineProduct key={product.id} product={product} />
        ))}
      </div>
      <div className="deck-contact-row">
        <div className="deck-contact-copy">
          <h2>{content.narrative.closingTitle}</h2>
          <p>{content.narrative.closingDescription}</p>
          <div className="deck-contact-details">
            <a href={emailHref} data-testid="deck-contact-email"><Mail aria-hidden="true" />{SITE_CONFIG.site.email}</a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-whatsapp"><MessageCircle aria-hidden="true" />WhatsApp · +91 97467 67146</a>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-site"><Globe2 aria-hidden="true" />{siteUrl.replace(/^https?:\/\//, "")}</a>
            <span className="deck-contact-location"><MapPin aria-hidden="true" />{SITE_CONFIG.site.location}</span>
          </div>
        </div>
        <div className="deck-contact-qrs" aria-label="Scan for Mossaic destinations">
          <a className="deck-contact-qr" href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-qr-site">
            <LocalQr value={siteUrl} label="Mossaic website" />Company site
          </a>
          <a className="deck-contact-qr" href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="deck-contact-qr-whatsapp">
            <LocalQr value={whatsappHref} label="Mossaic WhatsApp chat" />WhatsApp chat
          </a>
        </div>
      </div>
      <div className="deck-copyright">
        {SITE_CONFIG.site.name} · {SITE_CONFIG.company.hq} · {SITE_CONFIG.company.team}
      </div>
    </section>
  );
}

function PipelineProduct({ product }: { product: Product }) {
  const href = resolveLink(product.cta.href);
  return (
    <a
      className="deck-pipeline-item"
      href={href}
      target={isExternalLink(href) ? "_blank" : undefined}
      rel={isExternalLink(href) ? "noopener noreferrer" : undefined}
      data-testid={`deck-pipeline-${product.id}`}
    >
      <div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <span className={`deck-pipeline-status deck-status-${product.status}`}>{product.statusLabel}</span>
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

function SlideContent({ slide, content, onDemoUpdate }: {
  slide: DeckSlide;
  content: DeckContent;
  onDemoUpdate: () => void;
}) {
  if (slide.kind === "bookmyslot") return <BookingShowcase slide={slide} content={content} />;
  if (slide.kind === "aeropulse") return <AeroPulseShowcase slide={slide} content={content} onDemoUpdate={onDemoUpdate} />;
  if (slide.kind === "systems") return <SystemsShowcase slide={slide} content={content} />;
  return <ClosingShowcase slide={slide} />;
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
    "--deck-green": config.theme.accentGreen,
  } as CSSProperties;
  const introStats = useMemo(() => HERO_STATS.map((stat) => ({
    ...stat,
    value: `${stat.value}${stat.suffix}`,
  })), []);

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
          aria-label={`${config.ui.goToSectionLabel} ${index + 1}: ${slide.title}`}
          onClick={() => goTo(index)}
          data-testid={`deck-tab-${slide.id}`}
        >
          <span>{String(index + 1).padStart(2, "0")}.</span>{slide.title}
        </button>
      ))}
    </nav>
  );
  const onDemoUpdate = () => announce(config.ui.demoUpdateNotice);

  return (
    <main
      className={`mossaic-deck ${documentMode ? "deck-mode-document" : "deck-mode-carousel"}`}
      style={themeStyle}
      data-testid="mossaic-deck"
    >
      <div className="deck-shell">
        <header className="deck-topbar">
          <a className="deck-brand" href={siteUrl} target="_blank" rel="noopener noreferrer" data-testid="deck-brand-link">
            <Logo size={36} variant="mark" compact />
            <span className="deck-brand-copy">
              <Wordmark variant="nav" textColor="#f1f5f9" />
              <span>EXECUTIVE PORTFOLIO · SOFTWARE &amp; SYSTEMS</span>
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
          </div>
        </header>

        <section className="deck-intro" aria-labelledby="deck-title">
          <div className="deck-intro-copy">
            <div className="deck-overline">{config.intro.eyebrow}</div>
            <h1 id="deck-title">{config.intro.title} <span>{config.intro.highlight}</span></h1>
            <p>{config.intro.description}</p>
          </div>
          <div className="deck-intro-index">
            {SITE_CONFIG.company.hq}
          </div>
        </section>
        <div className="deck-intro-stats" aria-label="Company facts">
          {introStats.map((stat) => (
            <span key={stat.label}><strong>{stat.value}</strong>{stat.label}</span>
          ))}
        </div>

        {documentMode ? (
          <section className="deck-document" aria-label={config.ui.documentAriaLabel} data-testid="deck-document">
            <div className="deck-document-heading">
              <span>{SITE_CONFIG.site.tagline}</span><span>{total} {config.ui.sectionCountLabel}</span>
            </div>
            {slides.map((slide) => (
              <div className="deck-showcase" key={slide.id}>
                <SlideContent slide={slide} content={config} onDemoUpdate={onDemoUpdate} />
              </div>
            ))}
          </section>
        ) : activeSlide ? (
          <>
            <div className="deck-tabs-wrap">
              <div className="deck-tabs-copy">
                <h2 className="deck-tabs-title">Interactive portfolio</h2>
                <p className="deck-tabs-hint">Choose a system or use the arrow keys to move through the work.</p>
              </div>
              {slideNav()}
            </div>
            <section
              className="deck-showcase"
              aria-roledescription="carousel"
              aria-label={config.ui.carouselAriaLabel}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              data-testid="deck-carousel"
            >
              <SlideContent slide={activeSlide} content={config} onDemoUpdate={onDemoUpdate} />
            </section>
            <div className="deck-controlbar">
              <button type="button" className="deck-button deck-nav-arrow" onClick={previous} aria-label={config.ui.previousSectionLabel} data-testid="deck-previous">
                <ArrowLeft className="deck-icon" aria-hidden="true" /><span>{config.ui.previousLabel}</span>
              </button>
              <div className="deck-progress" aria-live="polite" data-testid="deck-progress">
                <span><strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(total).padStart(2, "0")}</span>
                <span className="deck-progress-track" aria-hidden="true"><span style={{ transform: `scaleX(${total ? (activeIndex + 1) / total : 0})` }} /></span>
              </div>
              <button type="button" className="deck-button deck-nav-arrow" onClick={next} aria-label={config.ui.nextSectionLabel} data-testid="deck-next">
                <span>{config.ui.nextLabel}</span><ArrowRight className="deck-icon" aria-hidden="true" />
              </button>
            </div>
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
