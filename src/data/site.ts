export const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#why", label: "Why Mossaic" },
  { href: "#founder", label: "Founder" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#contact", label: "Contact" },
];

export const HERO_STATS = [
  { value: "50", suffix: "+", label: "Clinics live" },
  { value: "850", suffix: "+", label: "Slots booked" },
  { value: "1", prefix: "", suffix: "", label: "Product live" },
];

export type ProductStatus = "live" | "soon" | "future";

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProductStatus;
  statusLabel: string;
  tags: string[];
  metrics?: { value: string; label: string; green?: boolean }[];
  cta: { label: string; href: string };
  accent: "moss" | "amber" | "blue" | "purple";
};

export const PRODUCTS: Product[] = [
  {
    id: "bookmyslot",
    name: "bookMySlot",
    category: "Dental SaaS · Practice Management",
    description:
      "Complete dental practice management — slot booking, clinical records, doctor assignments, patient reminders, inventory tracking, and Smile Deals. Built for Indian dental clinics.",
    status: "live",
    statusLabel: "● Live",
    tags: ["Slot booking", "Clinical records", "Smile Deals", "DISHA compliant"],
    metrics: [
      { value: "850+", label: "Slots booked", green: true },
      { value: "12s", label: "Avg confirm time" },
    ],
    cta: { label: "Try bookMySlot free", href: "https://bookmyslot.dental.mossaic.in" },
    accent: "moss",
  },
  {
    id: "retail-crm",
    name: "Retail CRM",
    category: "Retail & Commerce",
    description:
      "Customer relationship management built for Indian retail — inventory sync, loyalty programs, WhatsApp-native communication, and GST-ready billing.",
    status: "soon",
    statusLabel: "Coming soon",
    tags: ["Inventory", "Loyalty", "GST billing"],
    cta: { label: "Express interest", href: "#contact" },
    accent: "amber",
  },
  {
    id: "ai-imaging",
    name: "AI Imaging",
    category: "Dental AI · Diagnostic Assist",
    description:
      "Explainable AI-assisted dental imaging with Grad-CAM overlays — helping radiologists and dentists flag anomalies faster with full audit trails.",
    status: "future",
    statusLabel: "2027",
    tags: ["Grad-CAM", "Explainable AI", "Audit trail"],
    cta: { label: "Join waitlist", href: "#contact" },
    accent: "purple",
  },
];

export const PRINCIPLES = [
  {
    num: "01",
    title: "Modular by default",
    desc: "Every feature is a module. Clinics add what they need, skip what they don't. No feature bloat, no forced upgrades, no all-or-nothing contracts.",
  },
  {
    num: "02",
    title: "Compliance built in",
    desc: "DISHA, IT Act, and healthcare data regulations are not afterthoughts. Audit trails, consent management, and data locality are part of the foundation.",
  },
  {
    num: "03",
    title: "Explainable, not opaque",
    desc: "Where AI is used — in imaging, in scheduling, in recommendations — we show our working. Grad-CAM overlays, confidence scores, and audit trails come standard.",
  },
  {
    num: "04",
    title: "India-first architecture",
    desc: "Data hosted in India-region servers. Pricing in rupees. GST-ready billing. Built for Indian regulatory reality, not retrofitted from Western markets.",
  },
];

export const COMPLIANCE_BADGES = [
  "DISHA Compliant",
  "IT Act Ready",
  "India-region hosting",
  "GST ready",
];

export const TECH_STACK = [
  "React",
  "Node.js",
  "PostgreSQL",
  "Supabase",
  "Render",
  "Python",
  "Grad-CAM AI",
  "REST API",
];

export const ROADMAP = [
  {
    year: "2025",
    name: "bookMySlot",
    desc: "Dental practice management — live and growing across Kerala clinics",
    status: "done" as const,
  },
  {
    year: "2026",
    name: "Retail CRM",
    desc: "Customer & inventory management for Indian retail businesses",
    status: "next" as const,
  },
  {
    year: "2027",
    name: "AI Imaging",
    desc: "Explainable AI diagnostic assist for dental radiology",
    status: "future" as const,
  },
  {
    year: "Beyond",
    name: "More to come",
    desc: "New industries, new problems — always modular, always compliant",
    status: "future" as const,
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "Before bookMySlot we managed everything on WhatsApp and a paper register. Now patients book themselves and I get notified. It just works.",
    name: "Dr. Priya Menon",
    role: "Elite Dental Avenue, Kochi",
    initials: "PM",
  },
  {
    quote:
      "Setup took under 10 minutes. Our no-show rate has dropped noticeably since we started using the automated reminders feature.",
    name: "Dr. Suresh Kumar",
    role: "Sunrise Dental Clinic, Kozhikode",
    initials: "SK",
  },
  {
    quote:
      "The Smile Deals section brought in three new patients in the first week. I didn't expect that from a scheduling tool.",
    name: "Dr. Asha Nair",
    role: "Bright Smile Clinic, Thrissur",
    initials: "AN",
  },
];

export const CONTACT_INTERESTS = [
  "bookMySlot — dental clinic",
  "Retail CRM — early access",
  "Partnership / investment",
  "General enquiry",
  "Careers at Mossaic",
];

export const SITE = {
  email: "connect@mossaic.in",
  location: "Kerala, India · Remote-first team",
  domains: "mossaic.in · bookmyslot.dental.mossaic.in",
  founder: { name: "Arun", role: "Founder & CEO · Mossaic", initials: "A" },
  proofBar: [
    "Trusted by **50+ dental clinics** across Kerala",
    "India-region data hosting · **DISHA compliant**",
    "Founded in Kerala · **Building for India**",
    "**Free to get started** · No setup fees",
  ],
};
