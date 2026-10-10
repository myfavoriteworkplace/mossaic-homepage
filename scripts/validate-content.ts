import siteJson from "../src/data/site.json";
import productsJson from "../src/data/products.json";
import studioProjectsJson from "../src/data/studio-projects.json";
import testimonialsJson from "../src/data/testimonials.json";
import roadmapJson from "../src/data/roadmap.json";
import {
  ProductsSchema,
  RoadmapSchema,
  SiteConfigSchema,
  StudioProjectsSchema,
  TestimonialsSchema,
} from "../src/data/schemas";

const site = SiteConfigSchema.parse(siteJson);
const products = ProductsSchema.parse(productsJson);
const studioProjects = StudioProjectsSchema.parse(studioProjectsJson);
const testimonials = TestimonialsSchema.parse(testimonialsJson);
const roadmap = RoadmapSchema.parse(roadmapJson);

console.log(
  `Validated homepage content: ${products.length} products, ${studioProjects.length} Studio projects, ${testimonials.length} testimonials, ${roadmap.length} roadmap items.`,
);
console.log(`Validated ${Object.keys(site).length} site-content groups.`);
