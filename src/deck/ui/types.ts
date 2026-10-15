export type DeckLink = {
  label: string;
  href: string;
};

export type DeckSlideKind = "bookmyslot" | "aeropulse" | "systems";

export type DeckSlide = {
  id: string;
  kind: DeckSlideKind;
  navigationLabel?: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
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
  scheduled: string;
  reason: string;
  status: "pending" | "confirmed";
};

export type RouteSnapshot = {
  eta: string;
  cargo: string;
  state: string;
  progress: number;
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
    documentAriaLabel: string;
    carouselAriaLabel: string;
    sectionCountLabel: string;
    linkCopiedNotice: string;
    copyFallbackNotice: string;
    shareErrorNotice: string;
    demoUpdateNotice: string;
    liveLabel: string;
    tabTitle: string;
    tabBadge: string;
    tabHint: string;
    emptyMessage: string;
  };
  slides: DeckSlide[];
  narrative: {
    dashboardTitle: string;
    dashboardHint: string;
    demoDisclaimer: string;
    demoMetricTitle: string;
    demoMetrics: { value: string; label: string }[];
    routeLabel: string;
    routeCities: string;
    origin: string;
    destination: string;
    routeSnapshots: RouteSnapshot[];
    routeDisclaimer: string;
    routeFeatures: { title: string; description: string }[];
    systems: { title: string; description: string }[];
    pipelineTitle: string;
    closingTitle: string;
    closingDescription: string;
  };
  demoPatients: DemoPatient[];
};
