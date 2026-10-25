import siteJson from "../src/data/site.json";
import productsJson from "../src/data/products.json";
import studioProjectsJson from "../src/data/studio-projects.json";
import labsFeaturesJson from "../src/data/labs-features.json";
import testimonialsJson from "../src/data/testimonials.json";
import roadmapJson from "../src/data/roadmap.json";
import deckPresentationJson from "../src/data/deck-presentation.json";
import { DeckPresentationSchema } from "../src/deck/ui/schema";
import {
  ProductsSchema,
  LabsFeaturesSchema,
  RoadmapSchema,
  SiteConfigSchema,
  StudioProjectsSchema,
  TestimonialsSchema,
} from "../src/data/schemas";

const site = SiteConfigSchema.parse(siteJson);
const products = ProductsSchema.parse(productsJson);
const studioProjects = StudioProjectsSchema.parse(studioProjectsJson);
const labsFeatures = LabsFeaturesSchema.parse(labsFeaturesJson);
const testimonials = TestimonialsSchema.parse(testimonialsJson);
const roadmap = RoadmapSchema.parse(roadmapJson);
DeckPresentationSchema.parse(deckPresentationJson);

console.log(
  `Validated homepage content: ${products.length} products, ${studioProjects.length} Studio projects, ${labsFeatures.length} Labs features, ${testimonials.length} testimonials, ${roadmap.length} roadmap items.`,
);
console.log(`Validated ${Object.keys(site).length} site-content groups.`);
console.log("Validated deck presentation and demo content.");
