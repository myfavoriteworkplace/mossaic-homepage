# Mossaic Homepage — Design & Coding Standards

> This document is the authoritative guide for any agent or developer working on the Mossaic homepage codebase. Read it before writing or reviewing code.

---

## 1. Core Philosophy

**Code should be understandable by humans first, machines second.**

AI-style "compressed" or "cryptic" code is unacceptable. Every line written here will eventually be read, debugged, or extended by a human engineer. Optimise for that reader — not for brevity or for making the generator look clever.

---

## 2. General Coding Standards

### 2.1 Readable Code
- Use clear, descriptive names for variables, functions, and components. A name should say *what it is*, not abbreviate it beyond recognition.
- Prefer `isLoading`, `handleSubmit`, `formattedDate` over `il`, `hs`, `fd`.
- Consistent formatting throughout — indent with 2 spaces, use trailing commas, keep line length ≤ 100 characters where practical.

### 2.2 Maintainable Structure
- Break logic into small, single-purpose functions or components rather than long monolithic blocks.
- If a function does more than one thing, split it.
- If a component exceeds **~200 lines**, extract sub-components into separate files.
- Reuse before you rewrite — check whether a utility or component already exists before adding a new one.

### 2.3 Debug-Friendly
- Add inline comments wherever the logic is non-obvious. Comments should explain **intent**, not just re-state the mechanics.

  ```ts
  // ✅ Good — explains why
  // Clamp opacity to avoid bleed-through on light themes
  const opacity = Math.min(rawOpacity, 0.6);

  // ❌ Bad — states the obvious
  // Set opacity to min of rawOpacity and 0.6
  const opacity = Math.min(rawOpacity, 0.6);
  ```

- Avoid "clever hacks" — if a workaround is necessary, document *why* it exists and what it works around.
- Error handling must be **explicit**. Do not swallow errors silently or use empty `catch` blocks.

### 2.4 Human-First Clarity
- Write code that a developer unfamiliar with the file can read and understand in under 5 minutes.
- Avoid deeply nested ternaries, overly chained calls, or one-liners that sacrifice readability for conciseness.

### 2.5 Consistency
- Follow the existing patterns in the codebase. If components use a certain prop-naming convention or file structure, continue it — do not introduce a competing style.
- **ESLint + Prettier are recommended** for this project but not yet configured. Until they are, manually match the formatting of the surrounding code.

### 2.6 Documentation
- Exported functions and components should have a short JSDoc comment explaining their purpose and any non-obvious parameters.

  ```ts
  /**
   * Generates SVG polygon points for a pointy-top regular hexagon.
   * @param cx  Centre x in viewBox units
   * @param cy  Centre y in viewBox units
   * @param r   Vertex radius (centre → point)
   */
  function hexPts(cx: number, cy: number, r: number): string { … }
  ```

- Inline comments should explain *why*, not *what*.

---

## 3. Project-Specific Conventions

These rules are unique to the Mossaic homepage and override any general preference where they conflict.

### 3.1 Single Source of Truth for Content
All page copy — headings, taglines, product descriptions, testimonials, roadmap items, proof-bar stats — lives in **`src/data/site.ts`**.

- **Never hardcode strings directly in components.** Import from `site.ts` instead.
- Adding or editing any visible text means editing `site.ts`, not the component file.

### 3.2 Design Tokens Must Stay in Sync
Brand colours and spacing tokens are defined in **two mirrored places**:

| File | Purpose |
|---|---|
| `src/styles/globals.css` | CSS custom properties (`--moss`, `--ink`, `--hero-bg`, …) |
| `tailwind.config.ts` | Tailwind utilities (`bg-moss`, `text-ink-3`, `border-border1`, …) |

If a brand colour changes, **update both files**. Changing one without the other will cause visual inconsistencies that are hard to trace.

### 3.3 Animation Contract — Always Respect `prefers-reduced-motion`
Every animation added to this project must:
1. Check `prefers-reduced-motion: reduce` (via Framer Motion's `useReducedMotion()` hook or a CSS media query).
2. Provide a fully static, no-motion fallback when the preference is active.

Non-negotiable — this is an accessibility requirement, not optional polish.

```ts
// Example pattern
const reduced = useReducedMotion();
<motion.div animate={reduced ? {} : { y: [0, -10, 0] }} />
```

### 3.4 Bundle Size Discipline
The production target is **≤ 100 KB gzipped JS**. Before adding any new dependency:
- Check whether the functionality already exists in the project (Framer Motion, Lucide React, and Tailwind cover most needs).
- If a new package is genuinely needed, confirm its minified + gzipped size is acceptable.
- **Three.js is explicitly excluded** — the hero canvas particle system uses vanilla Canvas API to keep the bundle lean.

### 3.5 Logo Components Are Locked
`src/components/Logo.tsx` and `src/components/ui/Wordmark.tsx` are **brand-critical files**.

- Do not modify their visual output, props, or SVG geometry without explicit written sign-off from the brand owner.
- The `variant="image"` (raster) and `variant="mark"` (SVG) modes in `Logo.tsx` must continue to work correctly after any unrelated refactor.
- The `AssemblyBackdrop.tsx` references brand assets from `public/brand/` — do not rename or move those files.

### 3.6 Theme System
Four themes are supported: **Aurora** (default), Light, Moss, Mono. Themes are applied via `data-theme` attribute on `<html>`.

- All new colour usage must reference CSS variables (e.g., `var(--ink)`) rather than hardcoded hex values, so it responds correctly to theme switches.
- Test any UI change in at least the Aurora and Light themes before considering it done.

---

## 4. Developer Takeaway

| ✅ Do | ❌ Don't |
|---|---|
| Write clear, named, commented code | Write compressed one-liners to save lines |
| Update `site.ts` for copy changes | Hardcode strings in JSX |
| Update both CSS vars and Tailwind config for colour changes | Change only one of the two |
| Add `prefers-reduced-motion` fallbacks to every animation | Ship animations without reduced-motion support |
| Keep components under ~200 lines | Build monolithic 500-line components |
| Justify new dependencies by bundle impact | Add packages without checking bundle size |
| Treat `Logo.tsx` and `Wordmark.tsx` as locked | Edit brand components without sign-off |
