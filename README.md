# Mossaic — Homepage

Futuristic, performance-first homepage for **Mossaic**, the company building modular SaaS for India (starting with [bookMySlot](https://bookmyslot.dental.mossaic.in)).

Built with **React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion**, plus a tiny custom WebGL/canvas particle network in the hero. Fully static — the production output is plain HTML/CSS/JS that can be hosted **anywhere**.

## Develop locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:5000
```

## Build

```bash
npm run build        # outputs to ./dist
npm run preview      # serves ./dist on :5000
```

## Project structure

```
src/
├─ components/         Section components (Hero, Products, Why, Roadmap, …)
│  └─ ui/              Reusable bits (TiltCard, MagneticButton, AnimatedCounter, Toast, Reveal)
├─ data/site.ts        Single source of truth for all copy, products, testimonials, etc.
├─ styles/globals.css  Tailwind layers + design tokens (CSS variables)
├─ App.tsx, main.tsx
index.html
tailwind.config.ts     Brand colours and typography tokens
vite.config.ts
```

Edit copy, products or testimonials in `src/data/site.ts` — components consume from there.

## Deploy anywhere

The `dist/` folder is just static files. Pick whichever host you like — none of this is locked to any platform.

### Render (Static Site)
A `render.yaml` blueprint is included. In Render, create a new Blueprint and point it at this repo. Render will:
1. run `npm ci && npm run build`
2. publish `./dist`
3. handle SPA routing rewrites and asset caching

### GitHub Pages
A workflow at `.github/workflows/deploy-pages.yml` builds and deploys on every push to `main`.
Enable Pages in **Settings → Pages → Build and deployment → Source: GitHub Actions**.
If hosting at `username.github.io/<repo>/`, set repository variable `BASE_PATH` to `/<repo>/`.

### Vercel
Import the repo on Vercel — framework auto-detected as Vite. Build command `npm run build`, output `dist`. Done.

### Netlify
Import the repo. Build command `npm run build`, publish directory `dist`. Add a `_redirects` file with `/* /index.html 200` if you add client-side routes later.

### Cloudflare Pages
Build command `npm run build`, output directory `dist`.

### Plain Nginx / S3 / any static host
Upload `dist/` after running `npm run build`. Configure your host to serve `index.html` for unknown routes if you ever add client routing.

## Notes on the futuristic touches

- **WebGL/canvas particle network** — `src/components/HeroBackground.tsx`. Cursor-attracted, GPU-accelerated, capped frame rate, automatically disabled when `prefers-reduced-motion` is set.
- **3D tilt cards** — `src/components/ui/TiltCard.tsx`. Spring-based, used for products and testimonials.
- **Magnetic buttons** — `src/components/ui/MagneticButton.tsx`. Subtle cursor pull on the primary CTAs.
- **Animated counters** — count up when scrolled into view (`AnimatedCounter`).
- **Letter-by-letter hero headline** — staggered, blur-to-sharp reveal.
- **Roadmap timeline** — line draws itself in on scroll.
- **Smooth section reveals** via Framer Motion `useInView`.
- **Accessibility** — every motion respects `prefers-reduced-motion`; all interactive elements are real `<a>`/`<button>` elements.

## Performance budget

Targeting Lighthouse **Performance ≥ 90**, **Accessibility ≥ 95**, **SEO ≥ 95**, **Best Practices ≥ 95** on a clean build.

## License

© Mossaic Technologies.
