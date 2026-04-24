# Mossaic Homepage

A futuristic, performance-first homepage for **Mossaic** — the company behind [bookMySlot](https://bookmyslot.dental.mossaic.in) and the upcoming Retail CRM and AI Imaging products. Designed to feel like a tech company first impression: animated WebGL particle hero, 3D tilt cards, magnetic CTAs, scroll-driven reveals, and a serif/mono editorial type system on a moss-green palette.

## Tech stack

- **React 18 + TypeScript** — component model
- **Vite 5** — dev server + production bundler
- **Tailwind CSS 3** — utility styling layered over CSS-variable design tokens
- **Framer Motion** — every animation, reveal, and gesture
- **Lucide React** — icons
- A small **vanilla canvas** particle network for the hero (no Three.js — keeps the bundle small)

Runs on **Node.js 20**.

## Project structure

```
src/
├─ components/
│  ├─ Nav.tsx
│  ├─ Hero.tsx
│  ├─ HeroBackground.tsx       canvas particle network
│  ├─ ProofBar.tsx
│  ├─ Products.tsx
│  ├─ Why.tsx
│  ├─ Founder.tsx
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
│     └─ Toast.tsx              contact form success toast
├─ data/site.ts                 single source of truth for all page copy
├─ styles/globals.css           Tailwind layers + CSS variables (brand tokens)
├─ App.tsx, main.tsx
index.html                      meta, OG, fonts (Instrument Serif, Geist, Geist Mono)
tailwind.config.ts              colors, fonts, keyframes
vite.config.ts                  binds 0.0.0.0:5000, allows all hosts (proxy/iframe-friendly)
```

To edit copy, products, testimonials, or roadmap items, edit **`src/data/site.ts`** — components consume from there.

## Local development

```bash
npm install
npm run dev          # http://localhost:5000
npm run build        # outputs static site to ./dist
npm run preview      # serves the built ./dist on :5000
```

## Workflow

A single workflow named **`Start application`** runs `npm run dev` on port 5000.

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
