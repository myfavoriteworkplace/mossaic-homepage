export type DeckLink = {
  label: string;
  href: string;
};

export type DeckSlideKind = "bookmyslot" | "mossaic-labs" | "mossaic-studio";

export type DeckSlide = {
  id: string;
  kind: DeckSlideKind;
  navigationLabel?: string;
  eyebrow: string;
  title: string;
  brandSubtitle?: string;
  highlight?: string;
  description: string;
  serviceLabel?: string;
  serviceDescription?: string;
  services?: string[];
  capabilities?: string[];
  linkLabel?: string;
  footer: string;
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
  accentGreen: string;
};

export type DemoPatient = {
  initials: string;
  name: string;
  id: string;
  age: string;
  gender: string;
  scheduled: string;
  reason: string;
  status: "pending" | "confirmed";
};

export type DeckContent = {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  intro: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
  };
  theme: DeckTheme;
  ui: {
    documentLabel: string;
    carouselLabel: string;
    shareLabel: string;
    printLabel: string;
    chooseSectionLabel: string;
    goToSectionLabel: string;
    previousSectionLabel: string;
    nextSectionLabel: string;
    documentAriaLabel: string;
    carouselAriaLabel: string;
    sectionCountLabel: string;
    linkCopiedNotice: string;
    copyFallbackNotice: string;
    shareErrorNotice: string;
    portfolioLabel: string;
    liveProductLabel: string;
    availableServicesLabel: string;
    illustrativeLabel: string;
    brandTagline: string;
    brandDescription: string;
    whatsappLabel: string;
    tabTitle: string;
    tabBadge: string;
    tabHint: string;
    tabHintTouch: string;
    tabPausedHint: string;
    featureDevelopmentLabel: string;
    serviceListHeading: string;
    emptyMessage: string;
  };
  slides: DeckSlide[];
  narrative: {
    dashboardTitle: string;
    dashboardHint: string;
    demoDisclaimer: string;
    demoMetrics: { value: string; label: string }[];
    pipelineTitle: string;
    pipelineProducts: { productId: string; title: string; description: string }[];
    customServiceTitle: string;
    customServiceDescription: string;
    customServiceActionLabel: string;
    closingTitle: string;
    closingDescription: string;
  };
  demoPatients: DemoPatient[];
};
