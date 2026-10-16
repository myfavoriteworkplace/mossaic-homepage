# Mossaic Homepage

A futuristic, performance-first homepage for **Mossaic** — the company behind [bookMySlot](https://bookmyslot.dental.mossaic.in), upcoming Retail CRM and AI Imaging products, and mossaic Studio for custom enterprise web engineering.

**Brand identity:**
- **Mosaic-M** mark — capital "M" assembled from glowing tiles with a luminous AI-core and break-away shards. `Logo.tsx` exposes two optical-size variants:
  - `variant="image"` (default) — full-detail SVG brand mark for ≥48px slots (navigation / footer). Asset: `public/brand/mossaic-faithful.svg`. Existing `mossaic-mark-512.png` and related PNGs are retained as backups and for the assembly backdrop.
  - `variant="mark"` — vector mosaic-M (SVG) for nav, favicon, and any dense UI. Crisp at any size. Same SVG geometry powers `public/favicon.svg`.
- **Wordmark:** `moss[AI]c` — the **AI** letters render in a glowing cyan→blue gradient — `src/components/ui/Wordmark.tsx`
- **Tagline:** "The future, assembled."
- **Type:** Bricolage Grotesque (display) + Inter (body) + Geist Mono (code)
- **Default theme:** Aurora (deep navy + cyan AI glow). Alternates: Light, Moss (the original green), Mono.

## Tech stack

- **React 18 + TypeScript** — component model
- **Vite 5** — dev server + production bundler
- **Tailwind CSS 3** — utility styling layered over CSS-variable design tokens
- **Framer Motion** — every animation, reveal, and gesture
- **Lucide React** — icons
- A small **vanilla canvas** particle network for the hero (no Three.js — keeps the bundle small)

Runs on **Node.js 22.22.0** (the project’s pinned build version).

## Code and dependency portability

- Use packages published on public registries; do not depend on Replit-only packages or package hosts.
- Keep npm configured for `https://registry.npmjs.org/` and ensure `package-lock.json` contains no `*.replit.internal` resolved URLs.
- Before finishing dependency changes, check both `package.json` and the lockfile so clean installs work outside Replit.
- Keep shared source code and build/CI configuration portable across hosts: use public libraries and standard APIs; do not commit Replit-only imports, internal hostnames, or assumptions about the Replit runtime. Keep unavoidable host-specific settings in host-specific configuration.

## Project structure

```
src/
├─ components/
│  ├─ Nav.tsx                   nav + theme switcher
│  ├─ Hero.tsx
│  ├─ HeroBackground.tsx       canvas particle network
│  ├─ ProofBar.tsx
│  ├─ Mission.tsx               mission + vision (company-level)
│  ├─ Products.tsx
│  ├─ Why.tsx
│  ├─ About.tsx                 founder card + company facts + story
│  ├─ Roadmap.tsx
│  ├─ Testimonials.tsx
│  ├─ Contact.tsx
│  ├─ Footer.tsx
│  ├─ Logo.tsx
│  └─ ui/
│     ├─ MagneticButton.tsx     cursor-attracted CTA
│     ├─ TiltCard.tsx           spring-based 3D tilt wrapper
│     ├─ AnimatedCounter.tsx    in-view count-up
│     ├─ Reveal.tsx             scroll fade-up
│     ├─ ThemeSwitcher.tsx      light / dark / mono dropdown
│     └─ Toast.tsx              contact form success toast
├─ data/
│  ├─ site.json                 site and section copy, contact options
│  ├─ products.json             product and service-card content
│  ├─ testimonials.json         customer quotes and ratings
│  ├─ roadmap.json              roadmap items
│  ├─ schemas.ts                Zod validation and inferred types
│  ├─ content.ts                typed data exports
│  ├─ site.ts                   compatibility re-exports
│  └─ faqs.ts                   chatbot content with runtime reply behavior
├─ deck/ui/                     shareable executive brochure UI
├─ styles/
│  ├─ globals.css               Tailwind layers + theme CSS vars under [data-theme]
│  └─ themes.ts                 THEMES registry, applyTheme, readTheme helpers
├─ App.tsx, main.tsx
index.html                      meta, OG, fonts (Bricolage Grotesque, Inter, Geist Mono)
                                + pre-paint script that applies stored theme
deck/index.html                 independent /deck/ entry with deck-specific sharing metadata
public/deck.json                brochure content, links, UI labels, and selected colors
tailwind.config.ts              colors, fonts, keyframes
vite.config.ts                  binds 0.0.0.0:5000, allows all hosts (proxy/iframe-friendly)
```

To edit homepage copy, products, testimonials, contact-interest options, or roadmap items, edit the matching JSON file in **`src/data/`**. Run `npm run validate:content` for a clear schema check; `npm run build` runs it automatically before compiling the site. The JSON is imported at build time, not fetched from a network. Chatbot FAQ entries remain in `src/data/faqs.ts` because some entries contain runtime reply functions.
To edit the brochure's slide order, copy, product details, metrics, links, labels, or selected theme colors, edit **`public/deck.json`**. The deck fetches this JSON at runtime and shows an explicit error if the file is missing or malformed.

## Local development

```bash
npm install
npm run dev          # http://localhost:5000
npm run build        # outputs static site to ./dist
npm run preview      # serves the built ./dist on :5000
```

## Workflow

A single workflow named **`Start application`** runs `npm run dev` on port 5000.
The homepage includes a fixed deck link; the standalone brochure is available at **`/deck/`** and supports direct visits and refreshes.

## Portability — deploy anywhere

The build output (`dist/`) is plain static files. The project is intentionally **not locked to any host**:

- **Render** — `render.yaml` blueprint included.
- **GitHub Pages** — workflow at `.github/workflows/deploy-pages.yml` builds and deploys on push to `main`.
- **Vercel / Netlify / Cloudflare Pages** — auto-detected as Vite (build `npm run build`, output `dist`).
- **Replit** — deployment is configured as `static` with build `npm run build` and `publicDir: dist`.
- **Any static host (Nginx, S3, etc.)** — upload the `dist/` folder.

See `README.md` for per-host instructions.

## Design tokens

Brand colors live in two places that mirror each other (single source of truth: the CSS variables):

- `src/styles/globals.css` — CSS variables (`--moss`, `--ink`, `--hero-bg`, etc.)
- `tailwind.config.ts` — same values exposed as Tailwind utilities (`bg-moss`, `text-ink-3`, `border-border1`, etc.)

If a brand color changes, update both.

## Accessibility

All animations check `prefers-reduced-motion: reduce` and disable themselves accordingly. Interactive elements are real `<a>`/`<button>` elements; the contact form has labels for every field.

## Performance

Production bundle: ~100 KB gzipped JS, ~5 KB gzipped CSS. Targeting Lighthouse Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
