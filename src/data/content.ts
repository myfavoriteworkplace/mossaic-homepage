import siteJson from "./site.json";
import productsJson from "./products.json";
import studioProjectsJson from "./studio-projects.json";
import labsFeaturesJson from "./labs-features.json";
import testimonialsJson from "./testimonials.json";
import roadmapJson from "./roadmap.json";
import type {
  Product,
  ProductStatus,
  LabsFeature,
  RoadmapItem,
  SiteConfig,
  StudioProject,
  Testimonial,
} from "./schemas";

// These assertions are backed by the Zod checks in the pre-build content validator.
export const SITE_CONFIG = siteJson as unknown as SiteConfig;
export const PRODUCTS = productsJson as unknown as Product[];
export const STUDIO_PROJECTS = studioProjectsJson as unknown as StudioProject[];
export const LABS_FEATURES = labsFeaturesJson as unknown as LabsFeature[];
export const TESTIMONIALS = testimonialsJson as unknown as Testimonial[];
export const ROADMAP = roadmapJson as unknown as RoadmapItem[];

export const NAV_LINKS = SITE_CONFIG.navLinks;
export const HERO_STATS = SITE_CONFIG.heroStats;
export const HERO_COPY = SITE_CONFIG.heroCopy;
export const PRODUCTS_COPY = SITE_CONFIG.productsCopy;
export const TESTIMONIALS_COPY = SITE_CONFIG.testimonialsCopy;
export const MISSION = SITE_CONFIG.mission;
export const VISION = SITE_CONFIG.vision;
export const COMPANY = SITE_CONFIG.company;
export const PRINCIPLES = SITE_CONFIG.principles;
export const COMPLIANCE_BADGES = SITE_CONFIG.complianceBadges;
export const TECH_STACK = SITE_CONFIG.techStack;
export const CONTACT_INTERESTS = SITE_CONFIG.contactInterests;
export const SITE = SITE_CONFIG.site;
export const TAGLINE = SITE.tagline;

export type { Product, ProductStatus, LabsFeature, StudioProject, Testimonial };
