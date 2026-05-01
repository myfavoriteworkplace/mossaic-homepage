export type Faq = {
  id: string;
  label: string;
  question: string;
  keywords: string[];
  /** Static answer. Ignored when `dynamicAnswer` is provided. */
  answer: string;
  /**
   * Optional reply generator — used when the answer needs runtime context
   * (e.g. the time-of-day greeting). Takes precedence over `answer`.
   */
  dynamicAnswer?: () => string;
  /**
   * Explicit control over whether the suggestion-chip menu appears under
   * this reply. Undefined = inherit the legacy default (no chips when an
   * FAQ matched, chips when it didn't). Setting `true` for a Tier-1
   * conversational entry (greeting / "what can you do") keeps the menu
   * easy to find; setting `false` for a "thanks" / "bye" reply prevents
   * a tone-deaf chip-shower after a polite goodbye.
   */
  showSuggestions?: boolean;
  /**
   * When true, this entry is excluded from the chip list rendered under
   * bot messages. Used for small-talk and meta entries so the chip menu
   * stays tightly focused on Mossaic's product / company topics.
   */
  hideFromChips?: boolean;
  /**
   * Optional contextual follow-up chips to render after THIS specific reply,
   * overriding the global FAQ chip list. Each value is an FAQ `id` to surface
   * as a chip. When present, only these chips show — useful for routing the
   * user from a product answer (e.g. bookMySlot) into the most likely next
   * questions (Pricing, Demo, Compliance) without flooding them with the
   * full menu.
   */
  nextChips?: string[];
};

export const FAQ_GREETING =
  "Hi, I'm Mossie — your Mossaic FAQ helper. Ask me about our products, compliance, or how to get in touch — or tap a topic below.";

export const FAQ_FALLBACK =
  "I don't know that one yet — but here's what I can help with:";

/* ── Tier-3 fallback replies ─────────────────────────────────────────────
 * Used by Chatbot.tsx when no FAQ matches and the input pattern hints at
 * a specific kind of "miss". Keeps the brand voice warm even on rejections.
 * `gibberish` and `off-topic` still surface the chip menu so the user has
 * a next step; `profanity` deliberately does not. */
export const FAQ_FALLBACK_OFFTOPIC =
  "I only know about Mossaic, I'm afraid — but I'd be glad to help with anything about our products, pricing, or company.";

export const FAQ_FALLBACK_PROFANITY =
  "Let's keep it friendly. I'm here for Mossaic questions whenever you're ready.";

export const FAQ_FALLBACK_GIBBERISH =
  "I didn't quite catch that. Here's what I can help with —";

/* ── Time-of-day helper for the dynamic "good morning" reply ───────────── */
function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return "Good morning. Hope your day's off to a calm start. What can I help you with at Mossaic?";
  if (h >= 12 && h < 17)
    return "Good afternoon. Mossie here — what can I help you with at Mossaic today?";
  if (h >= 17 && h < 21)
    return "Good evening. Mossie here — anything I can help you with at Mossaic?";
  return "Hope you're winding down for the night. I'll be here whenever you're back — or write to us at connect@mossaic.in.";
}

/* ────────────────────────────────────────────────────────────────────────
 * FAQ entries
 *
 * Order matters when the matcher hits a tie: the first entry with the top
 * score wins. So the array runs:
 *   1. Substantive product / company FAQs (highest priority on a tie)
 *   2. Tier-2 Mossaic meta gaps (founders, hiring, name origin, …)
 *   3. Tier-1 conversational / small-talk entries (lowest priority on a tie)
 *
 * That way "hi, what's the pricing" still routes to the pricing answer
 * rather than the greeting.
 * ────────────────────────────────────────────────────────────────────── */
export const FAQS: Faq[] = [
  /* ── Tier 0 — original substantive entries ─────────────────────────── */
  {
    id: "what-is-mossaic",
    label: "About Mossaic",
    question: "What is Mossaic?",
    keywords: [
      "mossaic",
      "what is mossaic",
      "what is",
      "what do you do",
      "tell me about",
      "about mossaic",
      "who are mossaic",
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
      "offerings",
      "what do you sell",
      "what do you make",
      "what do you build",
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
    /* Dynamic phrasing — auto-stamps the current month/year so the answer
       reads "live" rather than evergreen. Static `answer` above is kept as
       a fallback for any tooling that doesn't call dynamicAnswer. */
    dynamicAnswer: () => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const now = new Date();
      const stamp = `${months[now.getMonth()]} ${now.getFullYear()}`;
      return `bookMySlot is our live dental practice management product — slot booking, clinical records, doctor assignments, patient reminders, inventory, and Smile Deals. As of ${stamp}, 50+ clinics across Kerala trust bookMySlot — and the list keeps growing. You can see it at bookmyslot.dental.mossaic.in.`;
    },
    /* After the bookMySlot answer, surface the three most likely next
       questions instead of the full chip menu. */
    showSuggestions: true,
    nextChips: ["pricing", "demo", "compliance"],
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
      "data hosted",
      "server",
      "servers",
      "cloud",
      "india region",
      "data locality",
      "where is data",
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
      "radiology",
      "diagnostic",
      "diagnosis",
      "grad-cam",
      "gradcam",
      "explainable ai",
      "x-ray",
      "xray",
      "dental imaging",
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
      "help desk",
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
      "located",
      "location",
      "where are you",
      "where is mossaic",
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
      "tech stack",
      "stack",
      "framework",
      "react",
      "node",
      "postgres",
      "supabase",
      "python",
      "built with",
      "programming language",
    ],
    answer:
      "Our stack: React, Node.js, PostgreSQL and Supabase for the data layer, Python for AI workloads with Grad-CAM, all served via REST APIs and hosted on India-region infrastructure.",
  },

  /* ── Tier 2 — Mossaic-meta gaps (hidden from chips, surface naturally) ─ */
  {
    id: "founder",
    label: "Founder",
    question: "Who founded Mossaic?",
    keywords: [
      "founder",
      "founded by",
      "ceo",
      "leadership team",
      "who runs",
      "who leads",
      "who founded",
      "sourabh",
      "founders",
    ],
    answer:
      "Mossaic was founded in 2025 and is led from Kerala by a small, India-first team. For specifics on leadership or to reach the founder, drop a note via the Contact section or email connect@mossaic.in.",
    hideFromChips: true,
  },
  {
    id: "hiring",
    label: "Careers",
    question: "Are you hiring?",
    keywords: [
      "hiring",
      "career",
      "careers",
      "job",
      "jobs",
      "work with you",
      "join",
      "internship",
      "intern",
      "opening",
      "openings",
      "vacancy",
      "recruit",
      "recruitment",
    ],
    answer:
      "We're a small team and grow selectively. If you'd like to be considered for future roles, please send your background to connect@mossaic.in — we read every note.",
    hideFromChips: true,
  },
  {
    id: "customers",
    label: "Customers",
    question: "Who are your customers?",
    keywords: [
      "customer",
      "customers",
      "client",
      "clients",
      "users",
      "how many users",
      "traction",
      "who uses",
      "case study",
      "case studies",
    ],
    answer:
      "bookMySlot is live in 50+ clinics across Kerala. Retail CRM and AI Imaging are pre-launch — interest lists open via the Contact section.",
    /* Same time-stamped phrasing as the bookMySlot entry, so a "how many
       clinics use you" question reads as freshly true rather than canned. */
    dynamicAnswer: () => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const now = new Date();
      const stamp = `${months[now.getMonth()]} ${now.getFullYear()}`;
      return `As of ${stamp}, bookMySlot is live in 50+ clinics across Kerala — and the list keeps growing. Retail CRM and AI Imaging are pre-launch — interest lists open via the Contact section.`;
    },
    hideFromChips: true,
  },
  {
    id: "name-origin",
    label: "The name",
    question: "Why the name Mossaic?",
    keywords: [
      "name",
      "why mossaic",
      "mossaic mean",
      "mossaic means",
      "name origin",
      "why the name",
      "what does mossaic mean",
      "meaning",
    ],
    answer:
      "Mossaic = mosaic + AI. Each product is a tile, and together they form a picture of modular, India-first software. The capital 'AI' in the wordmark is a deliberate nod to that.",
    hideFromChips: true,
  },
  {
    id: "roadmap",
    label: "Roadmap",
    question: "What's on the roadmap?",
    keywords: [
      "roadmap",
      "what's next",
      "whats next",
      "upcoming",
      "future",
      "future products",
      "timeline",
      "launching",
      "launch",
      "next product",
    ],
    answer:
      "Next on the roadmap: Retail CRM in 2026, then AI Imaging in 2027. The Roadmap section on this page has the full timeline.",
    hideFromChips: true,
  },
  {
    id: "refund",
    label: "Refunds",
    question: "Can I get a refund or cancel?",
    keywords: [
      "refund",
      "refunds",
      "cancel",
      "cancellation",
      "money back",
      "terminate",
      "unsubscribe",
    ],
    answer:
      "For bookMySlot subscriptions, please write to connect@mossaic.in — we handle these case-by-case so the right person can look after you.",
    hideFromChips: true,
  },
  {
    id: "payments",
    label: "Payment methods",
    question: "What payment methods do you accept?",
    keywords: [
      "payment",
      "payments",
      "pay",
      "razorpay",
      "upi",
      "card",
      "cards",
      "netbanking",
      "wallet",
      "paytm",
      "gpay",
      "phonepe",
    ],
    answer:
      "bookMySlot accepts UPI, cards, and netbanking via Razorpay. For enterprise or custom billing, please write to connect@mossaic.in.",
    hideFromChips: true,
  },
  {
    id: "mobile-app",
    label: "Mobile app",
    question: "Do you have a mobile app?",
    keywords: [
      "app",
      "mobile app",
      "android",
      "ios",
      "iphone",
      "play store",
      "app store",
      "download",
      "apk",
    ],
    answer:
      "bookMySlot today is a responsive web app, optimised for the tablets clinics use at reception. A dedicated mobile app is on the post-2026 roadmap.",
    hideFromChips: true,
  },
  {
    id: "integrations",
    label: "Integrations",
    question: "What does it integrate with?",
    keywords: [
      "integration",
      "integrations",
      "api",
      "whatsapp api",
      "tally",
      "zoho",
      "sync",
      "third party",
      "connect with",
    ],
    answer:
      "bookMySlot integrates with WhatsApp for patient reminders. Retail CRM will ship with WhatsApp and GST billing integrations from day one.",
    hideFromChips: true,
  },
  {
    id: "privacy-terms",
    label: "Privacy & terms",
    question: "Where can I read your privacy policy and terms?",
    keywords: [
      "privacy",
      "privacy policy",
      "terms",
      "tos",
      "terms of service",
      "gdpr",
      "data protection",
      "policy",
    ],
    answer:
      "Privacy and terms are part of our compliance posture (DISHA + IT Act). Detailed policies are available on request — just write to connect@mossaic.in.",
    hideFromChips: true,
  },

  /* ── Tier 1 — Conversational small-talk ─────────────────────────────
   * Placed last so a tie with any substantive entry above resolves in
   * favour of the substantive answer (matcher returns first-best). All
   * are hidden from the chip menu so the chip list stays product-focused. */
  {
    id: "smalltalk-time-of-day",
    label: "Time of day",
    question: "Good morning",
    keywords: [
      "good morning",
      "good afternoon",
      "good evening",
      "good night",
      "good day",
      "morning",
      "afternoon",
      "evening",
      "night",
      "shubh prabhat",
    ],
    answer: "",
    dynamicAnswer: timeOfDayGreeting,
    showSuggestions: true,
    hideFromChips: true,
  },
  {
    id: "smalltalk-greeting",
    label: "Greeting",
    question: "Hi",
    keywords: [
      "hi",
      "hii",
      "hiii",
      "hiya",
      "hey",
      "heyy",
      "hello",
      "helo",
      "hola",
      "namaste",
      "namaskar",
      "namaskaram",
      "vanakkam",
      "salaam",
    ],
    answer:
      "Hello — Mossie here. Lovely to have you stop by. What would you like to know about Mossaic?",
    showSuggestions: true,
    hideFromChips: true,
  },
  {
    id: "smalltalk-how-are-you",
    label: "How are you",
    question: "How are you?",
    keywords: [
      "how are you",
      "how r u",
      "how are u",
      "how's it going",
      "hows it going",
      "how do you do",
      "how you doing",
      "what's up",
      "whats up",
      "sup",
      "hru",
    ],
    answer:
      "I'm doing well, thank you for asking. The more interesting question is how I can help you with Mossaic today.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-thanks",
    label: "Thanks",
    question: "Thanks",
    keywords: [
      "thanks",
      "thank you",
      "thank u",
      "thanx",
      "thx",
      "ty",
      "tysm",
      "thankyou",
      "dhanyavaad",
      "dhanyawad",
      "shukriya",
      "appreciate",
      "appreciated",
    ],
    answer:
      "You're most welcome. Do let me know if there's anything else.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-goodbye",
    label: "Goodbye",
    question: "Bye",
    keywords: [
      "bye",
      "byee",
      "goodbye",
      "good bye",
      "see you",
      "see ya",
      "later",
      "ttyl",
      "alvida",
      "cya",
    ],
    answer:
      "Goodbye, and thank you for stopping by. We're at connect@mossaic.in whenever you'd like to pick this up again.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-ack",
    label: "Acknowledgment",
    question: "Ok",
    keywords: [
      "ok",
      "okay",
      "okey",
      "k",
      "kk",
      "got it",
      "gotcha",
      "cool",
      "alright",
      "sure",
      "fine",
      "hmm",
      "hmmm",
      "right",
      "noted",
    ],
    answer:
      "Sounds good. I'm right here if anything else comes up.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-compliment",
    label: "Compliment",
    question: "You're great",
    keywords: [
      "you're cool",
      "youre cool",
      "you are cool",
      "nice",
      "awesome",
      "amazing",
      "well done",
      "great job",
      "good job",
      "love it",
      "kudos",
      "brilliant",
      "fantastic",
    ],
    answer:
      "That's very kind — thank you. The Mossaic team will be glad to hear it.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-apology",
    label: "Apology",
    question: "Sorry",
    keywords: ["sorry", "my bad", "apologies", "oops", "my mistake"],
    answer:
      "No need to apologise at all. What can I help you with?",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "smalltalk-who-are-you",
    label: "Who are you",
    question: "Who are you?",
    keywords: [
      "who are you",
      "your name",
      "what's your name",
      "whats your name",
      "what should i call you",
      "what is your name",
      "who am i talking to",
      "introduce yourself",
    ],
    answer:
      "I'm Mossie — Mossaic's FAQ helper. Ask me about our products, pricing, compliance, or how to reach the team.",
    showSuggestions: true,
    hideFromChips: true,
  },
  {
    id: "smalltalk-bot-or-human",
    label: "Bot or human",
    question: "Are you a bot?",
    keywords: [
      "are you a bot",
      "are you bot",
      "are you real",
      "are you human",
      "are you a person",
      "are you ai",
      "are you chatgpt",
      "chatgpt",
      "openai",
      "claude",
      "gemini",
      "llm",
      "robot",
    ],
    answer:
      "At knowing Mossaic inside out? Absolutely. At everything else, I leave that to the big models. I'm a small FAQ helper built specifically for Mossaic — for anything outside my list, the team is one email away at connect@mossaic.in.",
    showSuggestions: true,
    hideFromChips: true,
  },
  {
    id: "smalltalk-capabilities",
    label: "What can you do",
    question: "What can you do?",
    keywords: [
      "what can you do",
      "what can u do",
      "what should i ask",
      "help me",
      "help",
      "options",
      "menu",
      "capabilities",
      "your capabilities",
      "show me",
    ],
    answer:
      "Plenty. I can tell you about Mossaic, our three products (bookMySlot, Retail CRM, AI Imaging), pricing, compliance, hosting, and how to get in touch. Tap a topic below, or just type your question.",
    showSuggestions: true,
    hideFromChips: true,
  },
  {
    id: "smalltalk-who-built-you",
    label: "Who built you",
    question: "Who built you?",
    keywords: [
      "who built you",
      "who built mossie",
      "who made you",
      "who created you",
      "who designed you",
      "your maker",
      "who developed you",
      "your creator",
    ],
    answer:
      "I was built by the Mossaic team in Kerala, India. Would you like to know more about the company or our products?",
    showSuggestions: true,
    hideFromChips: true,
  },

  /* ── Easter eggs ──────────────────────────────────────────────────────
     Light, on-brand deflections for off-topic curiosities. Each pivots
     warmly back to product or brand vocabulary so the surprise doesn't
     leave the user without a next step. All hidden from the chip menu
     so they never advertise themselves — they're rewards for asking. */
  {
    id: "easter-egg-arithmetic-joke",
    label: "Joke / arithmetic",
    question: "Tell me a joke",
    keywords: [
      "tell me a joke",
      "joke",
      "make me laugh",
      "be funny",
      "say something funny",
      "what's 2+2",
      "whats 2+2",
      "2+2",
      "2 + 2",
      "what is 2+2",
      "1+1",
      "1 + 1",
      "what's 1+1",
      "math",
      "do math",
      "calculate",
      "arithmetic",
    ],
    answer:
      "I'm better at dental software than arithmetic — but I hear bookMySlot handles billing flawlessly.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "easter-egg-meaning-of-life",
    label: "Meaning of life",
    question: "What's the meaning of life?",
    keywords: [
      "meaning of life",
      "purpose of life",
      "why are we here",
      "what's the point",
      "whats the point",
      "what is the meaning of life",
      "answer to life",
      "answer to everything",
      "life the universe and everything",
    ],
    answer:
      "42, apparently — but at Mossaic we think it's modular software that actually works.",
    showSuggestions: false,
    hideFromChips: true,
  },
  {
    id: "easter-egg-sing-or-story",
    label: "Sing / story",
    question: "Sing me a song",
    keywords: [
      "sing me a song",
      "sing a song",
      "sing",
      "song",
      "tell me a story",
      "tell a story",
      "story",
      "perform",
      "entertain me",
      "rap",
      "poem",
      "recite",
    ],
    answer:
      "I'm more of a facts bot than a bard — but I can tell you the story of how bookMySlot is reshaping dental care in Kerala. Want me to start there?",
    showSuggestions: false,
    hideFromChips: true,
  },
];
