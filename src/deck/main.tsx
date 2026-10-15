import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles/globals.css";
import DeckApp from "./ui/DeckApp";
import type { DeckContent, DeckLink, DeckMetric, DeckSlide, DeckTheme } from "./ui/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isSafeLink(value: unknown): value is DeckLink {
  return (
    isObject(value) &&
    isString(value.label) &&
    isString(value.href) &&
    /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value.href)
  );
}

function isDeckMetric(value: unknown): value is DeckMetric {
  return isObject(value) && isString(value.value) && isString(value.label);
}

function isDeckSlide(value: unknown): value is DeckSlide {
  if (
    !isObject(value) ||
    !isString(value.id) ||
    !isString(value.eyebrow) ||
    !isString(value.title) ||
    !isString(value.description)
  ) {
    return false;
  }

  const kinds = ["cover", "product", "principles", "closing", "standard"];
  if (value.kind !== undefined && !kinds.includes(String(value.kind))) return false;
  if (value.highlight !== undefined && !isString(value.highlight)) return false;
  if (value.status !== undefined && !isString(value.status)) return false;
  if (value.sideLabel !== undefined && !isString(value.sideLabel)) return false;
  if (value.footer !== undefined && !isString(value.footer)) return false;
  if (value.points !== undefined && !isStringArray(value.points)) return false;
  if (value.tags !== undefined && !isStringArray(value.tags)) return false;
  if (
    value.metrics !== undefined &&
    (!Array.isArray(value.metrics) || !value.metrics.every(isDeckMetric))
  ) {
    return false;
  }
  if (value.cta !== undefined && !isSafeLink(value.cta)) return false;
  return true;
}

function isDeckContent(value: unknown): value is DeckContent {
  if (!isObject(value)) return false;

  const meta = value.meta;
  const theme = value.theme;
  const ui = value.ui;
  const brand = value.brand;
  const intro = value.intro;

  if (!isObject(meta) || !isObject(theme) || !isObject(ui) || !isObject(brand) || !isObject(intro)) {
    return false;
  }

  const metaKeys = ["title", "description", "ogTitle", "ogDescription"];
  const uiKeys = [
    "documentLabel",
    "carouselLabel",
    "shareLabel",
    "printLabel",
    "chooseSectionLabel",
    "goToSectionLabel",
    "previousLabel",
    "nextLabel",
    "previousSectionLabel",
    "nextSectionLabel",
    "capabilitiesLabel",
    "keyFiguresLabel",
    "documentAriaLabel",
    "carouselAriaLabel",
    "sectionCountLabel",
    "emptyMessage",
    "linkCopiedNotice",
    "copyFallbackNotice",
    "shareErrorNotice",
  ];
  const themeKeys: Array<keyof DeckTheme> = [
    "background",
    "surface",
    "panel",
    "border",
    "text",
    "muted",
    "dim",
    "accent",
    "accentBlue",
  ];

  if (!metaKeys.every((key) => isString(meta[key]))) return false;
  if (!uiKeys.every((key) => isString(ui[key]))) return false;
  if (!themeKeys.every((key) => isString(theme[key]) && /^(#[\da-f]{3,8}|rgba?\([\d\s.,%/]+\))$/i.test(theme[key] as string))) {
    return false;
  }

  if (
    !isString(brand.name) ||
    !isString(brand.tagline) ||
    !isString(brand.descriptor) ||
    !isSafeLink(brand.website) ||
    !isSafeLink(brand.email) ||
    !isString(brand.location)
  ) {
    return false;
  }
  if (!isString(intro.eyebrow) || !isString(intro.title) || !isString(intro.highlight) || !isString(intro.description)) {
    return false;
  }

  if (!Array.isArray(value.slides) || value.slides.length === 0 || !value.slides.every(isDeckSlide)) {
    return false;
  }
  const slideIds = value.slides.map((slide) => slide.id);
  return new Set(slideIds).size === slideIds.length;
}

function updateMeta(selector: string, content: string) {
  const tag = document.querySelector<HTMLMetaElement>(selector);
  if (tag) tag.content = content;
}

function LoadMessage({ error }: { error?: string }) {
  return (
    <main className="mossaic-deck">
      <div className="deck-shell">
        <section className="deck-stage" aria-labelledby="deck-load-title">
          <div className="deck-slide-main" role={error ? "alert" : "status"}>
            <div className="deck-overline">Mossaic · Executive deck</div>
            <h1 className="deck-slide-title" id="deck-load-title">
              {error ? "The brochure could not be loaded." : "Opening the brochure…"}
            </h1>
            <p className="deck-slide-description">
              {error || "Loading the latest deck content."}
            </p>
            {error ? (
              <a className="deck-slide-link" href="../">
                Return to Mossaic
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function DeckPage() {
  const [config, setConfig] = useState<DeckContent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const configUrl = document.querySelector<HTMLMetaElement>('meta[name="deck-config-url"]')?.content;

    if (!configUrl) {
      setError("The deck configuration address is missing.");
      return () => controller.abort();
    }

    fetch(configUrl, {
      headers: { Accept: "application/json" },
      cache: "no-cache",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Deck configuration returned HTTP ${response.status}.`);
        const data: unknown = await response.json();
        if (!isDeckContent(data)) throw new Error("Deck configuration is invalid.");
        return data;
      })
      .then((data) => {
        document.title = data.meta.title;
        updateMeta('meta[name="description"]', data.meta.description);
        updateMeta('meta[property="og:title"]', data.meta.ogTitle);
        updateMeta('meta[property="og:description"]', data.meta.ogDescription);
        updateMeta('meta[name="twitter:title"]', data.meta.title);
        updateMeta('meta[name="twitter:description"]', data.meta.description);
        setConfig(data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        console.error("Unable to load public/deck.json:", cause);
        setError("Please refresh the page. If the problem continues, contact Mossaic.");
      });

    return () => controller.abort();
  }, []);

  if (error) return <LoadMessage error={error} />;
  if (!config) return <LoadMessage />;
  return <DeckApp config={config} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeckPage />
  </StrictMode>,
);
