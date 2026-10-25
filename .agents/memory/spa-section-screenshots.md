---
name: SPA section screenshots
description: Reliable visual checks for React sections that mount after initial navigation and reveal on scroll.
---

When checking a deep section in the Replit preview, navigating directly to its hash may leave the browser at the top because React creates the target after the initial document fragment lookup. A full-page capture may also show later sections blank when they use viewport-triggered reveal animations.

**Why:** the page is client-rendered and its reveal components animate only after entering the viewport.

**How to apply:** wait for the app to hydrate, scroll the browser to the target section, then capture the viewport at the needed widths.
