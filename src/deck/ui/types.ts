export type DeckLink = {
  label: string;
  href: string;
};

export type DeckMetric = {
  value: string;
  label: string;
};

export type DeckSlide = {
  id: string;
  kind?: "cover" | "product" | "principles" | "closing" | "standard";
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  status?: string;
  metrics?: DeckMetric[];
  points?: string[];
  tags?: string[];
  cta?: DeckLink;
  sideLabel?: string;
  footer?: string;
};

export type DeckTheme = {
  background: string;
  surface: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  accentBlue: string;
};

export type DeckContent = {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  theme: DeckTheme;
  ui: {
    documentLabel: string;
    carouselLabel: string;
    shareLabel: string;
    printLabel: string;
    chooseSectionLabel: string;
    goToSectionLabel: string;
    previousLabel: string;
    nextLabel: string;
    previousSectionLabel: string;
    nextSectionLabel: string;
    capabilitiesLabel: string;
    keyFiguresLabel: string;
    documentAriaLabel: string;
    carouselAriaLabel: string;
    sectionCountLabel: string;
    emptyMessage: string;
    linkCopiedNotice: string;
    copyFallbackNotice: string;
    shareErrorNotice: string;
  };
  brand: {
    name: string;
    tagline: string;
    descriptor: string;
    website: DeckLink;
    email: DeckLink;
    location: string;
  };
  intro: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
  };
  slides: DeckSlide[];
};
