import { z } from "zod";

const NonEmptyText = z.string().refine((value) => value.trim().length > 0, "Required text.");
const SafeHref = NonEmptyText.refine(
  (href) => {
    if (/^#[\w-]+$/.test(href)) return true;
    try {
      return new URL(href).protocol === "https:";
    } catch {
      return false;
    }
  },
  "Use an internal anchor or an HTTPS URL.",
);

export const ProductSchema = z.object({
  id: z.enum(["bookmyslot", "ai-imaging", "mossaic-studio", "mossaic-labs"]),
  name: NonEmptyText,
  subLabel: NonEmptyText,
  category: NonEmptyText,
  description: NonEmptyText,
  status: z.enum(["live", "soon", "future"]),
  statusLabel: NonEmptyText,
  proofLabel: NonEmptyText.optional(),
  tags: z.array(NonEmptyText).min(1),
  metrics: z
    .array(
      z.object({
        value: NonEmptyText,
        label: NonEmptyText,
        green: z.boolean().optional(),
      }),
    )
    .optional(),
  cta: z.object({ label: NonEmptyText, href: SafeHref }),
  accent: z.enum(["moss", "amber", "blue", "purple"]),
});

export const ProductsSchema = z
  .array(ProductSchema)
  .min(1)
  .superRefine((products, ctx) => {
    const ids = new Set<string>();
    for (const [index, product] of products.entries()) {
      if (ids.has(product.id)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate product id: ${product.id}`,
        });
      }
      ids.add(product.id);
    }
  });

export const StudioProjectSchema = z.object({
  id: NonEmptyText,
  name: NonEmptyText,
  category: NonEmptyText,
  href: z
    .string()
    .url()
    .refine((href) => new URL(href).protocol === "https:", "Use an HTTPS URL."),
  status: z.enum(["live", "in-progress"]),
});

export const StudioProjectsSchema = z
  .array(StudioProjectSchema)
  .superRefine((projects, ctx) => {
    const ids = new Set<string>();
    for (const [index, project] of projects.entries()) {
      if (ids.has(project.id)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate Studio project id: ${project.id}`,
        });
      }
      ids.add(project.id);
    }
  });

export const LabsFeatureSchema = z.object({
  id: z.enum(["bookmyslot", "retail-crm"]),
  name: NonEmptyText,
  category: NonEmptyText,
  status: z.enum(["available", "soon"]),
  statusLabel: NonEmptyText,
  href: SafeHref,
});

export const LabsFeaturesSchema = z
  .array(LabsFeatureSchema)
  .min(1)
  .superRefine((features, ctx) => {
    const ids = new Set<string>();
    for (const [index, feature] of features.entries()) {
      if (ids.has(feature.id)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate Labs feature id: ${feature.id}`,
        });
      }
      ids.add(feature.id);
    }
  });

export const TestimonialSchema = z.object({
  id: NonEmptyText,
  quote: NonEmptyText,
  name: NonEmptyText,
  role: NonEmptyText,
  initials: z.string().min(1).max(4).refine((value) => value.trim().length > 0),
  image: z.string().regex(/^images\/reviews\/[\w.-]+\.webp$/).optional(),
  product: z.enum(["bookMySlot", "Retail CRM", "AI Imaging", "mossaic Studio"]),
  rating: z.number().int().min(1).max(5),
});

export const TestimonialsSchema = z
  .array(TestimonialSchema)
  .min(1)
  .superRefine((testimonials, ctx) => {
    const ids = new Set<string>();
    for (const [index, testimonial] of testimonials.entries()) {
      if (ids.has(testimonial.id)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate testimonial id: ${testimonial.id}`,
        });
      }
      ids.add(testimonial.id);
    }
  });

export const RoadmapSchema = z.array(
  z.object({
    year: NonEmptyText,
    name: NonEmptyText,
    desc: NonEmptyText,
    status: z.enum(["done", "next", "future"]),
  }),
);

const HeadingSchema = z.object({
  lineOne: NonEmptyText,
  accent: NonEmptyText,
  lineTwo: NonEmptyText,
});

export const SiteConfigSchema = z.object({
  navLinks: z.array(
    z.object({
      href: z.string().regex(/^#[\w-]+$/),
      label: NonEmptyText,
    }),
  ),
  heroStats: z.array(
    z.object({
      value: NonEmptyText,
      suffix: z.string(),
      label: NonEmptyText,
    }),
  ),
  heroCopy: z.object({
    lineOne: NonEmptyText,
    accent: NonEmptyText,
    lineTwo: NonEmptyText,
    lineThree: NonEmptyText,
    description: NonEmptyText,
  }),
  productsCopy: z.object({
    tag: NonEmptyText,
    titleLine: NonEmptyText,
    titleAccent: NonEmptyText,
    description: NonEmptyText,
  }),
  testimonialsCopy: z.object({
    tag: NonEmptyText,
    titleLead: NonEmptyText,
    titleAccent: NonEmptyText,
    description: NonEmptyText,
  }),
  mission: z.object({
    tag: NonEmptyText,
    heading: HeadingSchema,
    body: NonEmptyText,
    pillars: z.array(
      z.object({ title: NonEmptyText, desc: NonEmptyText }),
    ),
  }),
  vision: z.object({
    tag: NonEmptyText,
    heading: HeadingSchema,
    body: NonEmptyText,
  }),
  company: z.object({
    founded: NonEmptyText,
    hq: NonEmptyText,
    team: NonEmptyText,
    focus: NonEmptyText,
  }),
  principles: z.array(
    z.object({
      num: NonEmptyText,
      title: NonEmptyText,
      desc: NonEmptyText,
    }),
  ),
  complianceBadges: z.array(NonEmptyText),
  techStack: z.array(NonEmptyText),
  contactInterests: z
    .array(
      z.object({
        value: NonEmptyText,
        label: NonEmptyText,
      }),
    )
    .min(1)
    .superRefine((interests, ctx) => {
      const values = new Set<string>();
      for (const [index, interest] of interests.entries()) {
        if (values.has(interest.value)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "value"],
            message: `Duplicate contact-interest value: ${interest.value}`,
          });
        }
        values.add(interest.value);
      }
    }),
  site: z.object({
    name: NonEmptyText,
    tagline: NonEmptyText,
    techPill: NonEmptyText,
    email: z.string().email(),
    alternateEmail: z.string().email().optional(),
    location: NonEmptyText,
    domains: NonEmptyText,
    founder: z.object({
      name: NonEmptyText,
      role: NonEmptyText,
      initials: z.string().min(1).max(4).refine((value) => value.trim().length > 0),
    }),
    proofBar: z.array(
      z.object({
        highlight: NonEmptyText,
        after: z.string(),
      }),
    ),
  }),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductStatus = Product["status"];
export type StudioProject = z.infer<typeof StudioProjectSchema>;
export type LabsFeature = z.infer<typeof LabsFeatureSchema>;
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type RoadmapItem = z.infer<typeof RoadmapSchema>[number];
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
