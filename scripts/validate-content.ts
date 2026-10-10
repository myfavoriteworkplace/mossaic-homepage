import siteJson from "../src/data/site.json";
import productsJson from "../src/data/products.json";
import testimonialsJson from "../src/data/testimonials.json";
import roadmapJson from "../src/data/roadmap.json";
import {
  ProductsSchema,
  RoadmapSchema,
  SiteConfigSchema,
  TestimonialsSchema,
} from "../src/data/schemas";

const site = SiteConfigSchema.parse(siteJson);
const products = ProductsSchema.parse(productsJson);
const testimonials = TestimonialsSchema.parse(testimonialsJson);
const roadmap = RoadmapSchema.parse(roadmapJson);

console.log(
  `Validated homepage content: ${products.length} products, ${testimonials.length} testimonials, ${roadmap.length} roadmap items.`,
);
console.log(`Validated ${Object.keys(site).length} site-content groups.`);
