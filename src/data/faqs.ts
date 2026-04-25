export type Faq = {
  id: string;
  label: string;
  question: string;
  keywords: string[];
  answer: string;
};

export const FAQ_GREETING =
  "Hi, I'm Mossie — your Mossaic FAQ helper. Ask me about our products, compliance, or how to get in touch — or tap a topic below.";

export const FAQ_FALLBACK =
  "I don't know that one yet — but here's what I can help with:";

export const FAQS: Faq[] = [
  {
    id: "what-is-mossaic",
    label: "About Mossaic",
    question: "What is Mossaic?",
    keywords: [
      "mossaic",
      "company",
      "about",
      "who",
      "what is",
      "what do you do",
      "tell me about",
    ],
    answer:
      "Mossaic is a modular SaaS company founded in 2025, based in Kerala, India. We build vertical software for Indian businesses — starting with healthcare and extending into retail and explainable AI. Our tagline says it best: the future, assembled.",
  },
  {
    id: "products",
    label: "Products",
    question: "What products do you build?",
    keywords: [
      "products",
      "build",
      "make",
      "offerings",
      "what do you sell",
      "lineup",
      "portfolio",
    ],
    answer:
      "We have three products: bookMySlot (live — dental practice management), Retail CRM (coming soon — for Indian retail), and AI Imaging (planned for 2027 — explainable AI diagnostic assist for dental radiology).",
  },
  {
    id: "bookmyslot",
    label: "bookMySlot",
    question: "What is bookMySlot?",
    keywords: [
      "bookmyslot",
      "book my slot",
      "dental",
      "clinic",
      "practice management",
      "appointments",
      "scheduling",
      "smile deals",
    ],
    answer:
      "bookMySlot is our live dental practice management product — slot booking, clinical records, doctor assignments, patient reminders, inventory, and Smile Deals. It's used by 50+ clinics across Kerala. You can see it at bookmyslot.dental.mossaic.in.",
  },
  {
    id: "pricing",
    label: "Pricing",
    question: "How much does it cost?",
    keywords: [
      "pricing",
      "price",
      "cost",
      "how much",
      "fees",
      "fee",
      "plans",
      "plan",
      "subscription",
      "rupees",
      "rs",
      "rate",
      "rates",
      "charge",
    ],
    answer:
      "Pricing is in rupees and varies by product. For bookMySlot, head to bookmyslot.dental.mossaic.in for current plans. For Retail CRM and AI Imaging waitlists, drop us a note via the Contact section and we'll share details directly.",
  },
  {
    id: "compliance",
    label: "Compliance",
    question: "Is your software DISHA and IT Act compliant?",
    keywords: [
      "disha",
      "compliance",
      "compliant",
      "regulation",
      "regulatory",
      "it act",
      "law",
      "legal",
      "audit",
      "consent",
      "gst",
      "secure",
      "security",
    ],
    answer:
      "Yes — DISHA, the IT Act, and GST-readiness are part of our foundation, not afterthoughts. Audit trails, consent management, and data locality come built in across every product.",
  },
  {
    id: "hosting",
    label: "Data hosting",
    question: "Where is data hosted?",
    keywords: [
      "hosting",
      "hosted",
      "data",
      "where",
      "server",
      "servers",
      "cloud",
      "india region",
      "locality",
      "stored",
      "storage",
    ],
    answer:
      "All customer data is hosted in India-region servers. We don't ship your data to a foreign cloud — that's a deliberate design choice, not a marketing line.",
  },
  {
    id: "retail-crm",
    label: "Retail CRM",
    question: "What is Retail CRM?",
    keywords: [
      "retail",
      "crm",
      "shop",
      "store",
      "kirana",
      "loyalty",
      "inventory",
      "whatsapp",
      "billing",
    ],
    answer:
      "Retail CRM is our next product — coming in 2026. It's customer and inventory management built for Indian retail: inventory sync, loyalty programs, WhatsApp-native communication, and GST-ready billing. Express interest via the Contact section to get early access.",
  },
  {
    id: "ai-imaging",
    label: "AI Imaging",
    question: "What is AI Imaging?",
    keywords: [
      "ai imaging",
      "imaging",
      "ai",
      "radiology",
      "diagnostic",
      "diagnosis",
      "grad-cam",
      "gradcam",
      "explainable",
      "x-ray",
      "xray",
    ],
    answer:
      "AI Imaging is our planned 2027 product — explainable AI-assisted dental imaging with Grad-CAM overlays, helping radiologists and dentists flag anomalies faster with full audit trails. Join the waitlist via the Contact section.",
  },
  {
    id: "demo",
    label: "Try it",
    question: "Can I try bookMySlot or get a demo?",
    keywords: [
      "demo",
      "try",
      "trial",
      "test",
      "see it",
      "free trial",
      "sign up",
      "signup",
      "register",
      "onboard",
      "get started",
    ],
    answer:
      "Absolutely. For bookMySlot, visit bookmyslot.dental.mossaic.in directly — or send us a note through the Contact section and we'll set up a walkthrough for your clinic.",
  },
  {
    id: "contact",
    label: "Contact us",
    question: "How do I get in touch?",
    keywords: [
      "contact",
      "reach",
      "email",
      "phone",
      "talk",
      "speak",
      "get in touch",
      "support",
      "help",
      "human",
      "person",
    ],
    answer:
      "Easiest way: email connect@mossaic.in, or use the Contact section on this page — pick the topic that fits and we'll get back within a working day.",
  },
  {
    id: "location",
    label: "Where you are",
    question: "Where is Mossaic based?",
    keywords: [
      "where",
      "located",
      "location",
      "based",
      "office",
      "kerala",
      "india",
      "headquarters",
      "hq",
      "address",
      "city",
    ],
    answer:
      "We're headquartered in Kerala, India, with a remote-first, India-based team. Founded in 2025.",
  },
  {
    id: "tech",
    label: "Tech stack",
    question: "What technology do you use?",
    keywords: [
      "technology",
      "tech",
      "stack",
      "framework",
      "react",
      "node",
      "postgres",
      "supabase",
      "python",
      "built with",
      "language",
    ],
    answer:
      "Our stack: React, Node.js, PostgreSQL and Supabase for the data layer, Python for AI workloads with Grad-CAM, all served via REST APIs and hosted on India-region infrastructure.",
  },
];
