# Mossaic Homepage — Deployment Guide

> **Audience:** anyone (technical or non-technical) who needs to understand or repeat the setup that gets the Mossaic homepage live at **https://mossaic.in**.
>
> **Last updated:** April 2026.

---

## 1. Overview in plain English

The Mossaic homepage lives in this Git repository as source code (React + TypeScript files written for the Vite build tool). It is **not** a plain HTML site, so it cannot just be uploaded to a host as-is — it has to be "built" first, which turns the source files into a small set of plain HTML/CSS/JS files that browsers can run.

We host the built site on **GitHub Pages**, which is GitHub's free static hosting service, and we point our **GoDaddy-registered domain `mossaic.in`** at it.

The whole thing is automatic: every time someone pushes a change to the `main` branch on GitHub, a small "robot" called a GitHub Actions workflow runs, builds the site, and publishes it. Within about 90 seconds the change is live at `mossaic.in`.

---

## 2. The flow, step by step

```
┌──────────────────────────┐
│ Developer edits code     │
│ on their laptop          │
└────────────┬─────────────┘
             │
             │ git push origin main
             ▼
┌──────────────────────────┐
│ GitHub repository        │
│ myfavoriteworkplace/     │
│ mossaic-homepage         │
└────────────┬─────────────┘
             │
             │ Push triggers the workflow
             ▼
┌──────────────────────────┐
│ GitHub Actions runs      │
│ deploy-pages.yml         │
│  1. npm ci               │
│  2. npm run build        │
│  3. Upload dist/ folder  │
│  4. Publish to Pages     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ GitHub Pages serves the  │
│ built site on its CDN    │
└────────────┬─────────────┘
             │
             │ DNS lookup for mossaic.in
             ▼
┌──────────────────────────┐
│ GoDaddy DNS returns      │
│ GitHub's four IP addrs   │
│ Browser loads from there │
└──────────────────────────┘
```

The end result: a visitor types `mossaic.in` into their browser and within a second sees the latest pushed version of the site.

---

## 3. Part 1 — Code changes inside the repository

These three pieces of code make GitHub Pages work for a Vite project. Without them, a successful push still wouldn't produce a working live site.

### 3.1 The active deployment workflow

**File:** `.github/workflows/deploy-pages.yml`

This file tells GitHub Actions what to do every time we push to `main`. It checks out the code, installs Node 20, runs the build, and uploads the result.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          # Set this in repo settings → Variables if hosting at /<repo>/
          # e.g. BASE_PATH: /mossaic-homepage/
          BASE_PATH: ${{ vars.BASE_PATH || '/' }}

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**What each piece does, in plain English:**

- `on: push: branches: [main]` — Run automatically every time someone pushes to `main`.
- `on: workflow_dispatch` — Allow a human to also trigger it manually from the Actions tab. Useful when you change a setting (like adding the BASE_PATH variable) and want to redeploy without making a code change.
- `permissions:` — Give the workflow exactly the rights it needs: read code, write to Pages, prove its identity.
- `concurrency: group: pages` — If two pushes happen in quick succession, queue the second one so they don't fight over the same deployment slot.
- `npm ci` — Install dependencies cleanly from `package-lock.json` (faster and more reliable than `npm install` in CI).
- `npm run build` — Run the Vite build, which produces a `dist/` folder containing the real website.
- `BASE_PATH: ${{ vars.BASE_PATH || '/' }}` — Read a repo variable called `BASE_PATH` if it exists, otherwise default to `/`. This is the toggle for switching between custom-domain hosting and subpath hosting (more on this in Part 2).
- `actions/upload-pages-artifact@v3` with `path: ./dist` — Take the built site and hand it to GitHub Pages.
- `deploy:` job — A second job that just calls GitHub's official deploy action to publish what `build` uploaded.

### 3.2 The disabled placeholder workflow

**File:** `.github/workflows/deploy.yml`

This file exists for historical reasons (an older deploy workflow we replaced). It's now a deliberate no-op — it does nothing on push, so it doesn't conflict with the real workflow.

```yaml
name: Deploy (disabled — superseded by deploy-pages.yml)

# This workflow is intentionally a no-op. The active deploy is in
# .github/workflows/deploy-pages.yml. You may safely delete this file.

on:
  workflow_dispatch:

jobs:
  noop:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This workflow is disabled. See deploy-pages.yml."
```

**What to do with it:** Safe to delete whenever you like. We kept it because direct deletion was blocked at the time. To remove it, run on your machine:

```
rm .github/workflows/deploy.yml
git add -A && git commit -m "Remove disabled placeholder workflow" && git push
```

### 3.3 The custom-domain marker

**File:** `public/CNAME`

This is a single-line text file containing exactly:

```
mossaic.in
```

**Why it has to be there and why it has to be in `public/`:**

- GitHub Pages will only serve a custom domain if the published site contains a file literally called `CNAME` at its root, with the domain on a single line.
- Vite copies everything in the `public/` folder into `dist/` during the build. So putting `CNAME` in `public/` means it ends up at the root of the built site (`dist/CNAME`), which is what GitHub Pages then publishes.
- A `CNAME` file at the **repository root** (not inside `public/`) does **nothing** — Vite ignores it during the build.

### 3.4 The Vite config tweak

**File:** `vite.config.ts`

We added two lines so the build can switch between two hosting modes (custom domain vs. subpath) via an environment variable.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  // ... rest of the config unchanged
});
```

**Why this matters:**

- Vite needs to know what URL prefix to put in front of every JS/CSS reference in the built `index.html`.
- For the custom domain `mossaic.in`, the site lives at `/`, so assets should be referenced as `/assets/...`. → `base: "/"`.
- For the subpath URL `myfavoriteworkplace.github.io/mossaic-homepage/`, the site lives at `/mossaic-homepage/`, so assets must be referenced as `/mossaic-homepage/assets/...`. → `base: "/mossaic-homepage/"`.
- Reading from `process.env.BASE_PATH` lets us toggle this from outside the code, by setting a repo variable on GitHub. No code change needed to switch.

---

## 4. Part 2 — Settings to change on github.com

These are the clicks inside the GitHub web UI. They have to match the code changes in Part 1 or nothing works.

### 4.1 Pages → Source = "GitHub Actions"

**Path:** Repo → **Settings** (gear-icon tab in the repo's top nav) → **Pages** (in the left sidebar under "Code and automation") → **Build and deployment → Source** dropdown.

**Change to:** **GitHub Actions** (NOT "Deploy from a branch").

**Why this is critical:** With "Deploy from a branch" selected, GitHub serves your raw files straight off the branch — including the unbuilt source `index.html` that references `/src/main.tsx`, which doesn't exist after build. You'd see a blank page and a 404 on `/src/main.tsx` in DevTools. With "GitHub Actions", GitHub serves whatever the workflow uploaded (i.e. the built site).

### 4.2 Pages → Custom domain = `mossaic.in`

**Path:** Same Pages screen → scroll to **Custom domain** section.

**Change to:** Type `mossaic.in` and click **Save**.

GitHub will run a DNS check. If your DNS records (Part 3) are already in place and propagated, you'll see a green check ("DNS check successful"). If DNS isn't ready, leave the value saved anyway — GitHub re-checks every few minutes.

### 4.3 Pages → Enforce HTTPS ✓

**Path:** Same Pages screen → **Enforce HTTPS** checkbox below the custom domain.

**When to tick it:** This checkbox stays greyed out for up to an hour after the DNS check passes — GitHub uses that hour to issue a free TLS certificate from Let's Encrypt for `mossaic.in`. Once it goes from grey to clickable, tick it. After that, all `http://mossaic.in` requests auto-upgrade to `https://mossaic.in`.

### 4.4 Variables → BASE_PATH (optional, conditional)

**Path:** Repo → **Settings** → **Secrets and variables** (left sidebar) → **Actions** → **Variables** tab (next to "Secrets" — easy to miss).

**The rule:**

| If you're hosting at... | Set BASE_PATH to... | Why |
|---|---|---|
| `mossaic.in` (custom domain) | **No variable, or delete it** | Site is at `/`, default works |
| `myfavoriteworkplace.github.io/mossaic-homepage/` only | `/mossaic-homepage/` (with both slashes) | Site is in a subfolder, assets need that prefix |

**Important:** Once you've set up the custom domain, leave BASE_PATH unset/deleted. The subpath URL will simply redirect to `mossaic.in` automatically — you don't need to also serve assets at the subpath.

After adding/removing this variable, manually trigger a redeploy: **Actions tab → click `deploy-pages.yml` → Run workflow → Run workflow** (the green button on the right).

---

## 5. Part 3 — Settings to change on GoDaddy

This is the half people get stuck on. Two distinct kinds of changes: DNS records (which tell the world where `mossaic.in` lives) and product cleanup (which stops GoDaddy from competing with GitHub for the domain).

### 5.1 DNS records to ADD

**Path:** GoDaddy → **My Products** → next to `mossaic.in` click **DNS** (or click the domain name → "Manage DNS") → **DNS Records** tab.

**Add four `A` records on `@`:**

| Type | Name | Data | TTL |
|---|---|---|---|
| A | @ | `185.199.108.153` | 600 seconds (or default) |
| A | @ | `185.199.109.153` | 600 seconds (or default) |
| A | @ | `185.199.110.153` | 600 seconds (or default) |
| A | @ | `185.199.111.153` | 600 seconds (or default) |

These four IP addresses are GitHub Pages' load-balanced edge servers. All four are required; GitHub uses round-robin between them.

**Add one `CNAME` record on `www`:**

| Type | Name | Data | TTL |
|---|---|---|---|
| CNAME | www | `myfavoriteworkplace.github.io` | 1 Hour |

This makes `www.mossaic.in` work too. GitHub will auto-redirect `www.mossaic.in` to `mossaic.in` once the custom-domain step (4.2) is done.

### 5.2 DNS record to REMOVE

| Type | Name | Data | Why remove it |
|---|---|---|---|
| A | @ | `WebsiteBuilder Site` | This is auto-created by GoDaddy's free Websites + Marketing product and competes with the four GitHub IPs above. As long as it's there, browsers randomly land on GoDaddy's parking page about half the time. |

To remove: find that row in the DNS Records table → click the trash icon → confirm.

**Catch:** Just deleting it won't work. GoDaddy automatically recreates it within a minute as long as the Websites + Marketing product is still bound to `mossaic.in`. So you have to do step 5.4 first, then come back and delete this row.

### 5.3 Forwarding section — confirmed OFF

**Path:** GoDaddy → DNS page → **Forwarding** tab.

Both **Domain** and **Subdomains** sections should say **"Not set up"**. If anything is configured here (e.g. forwarding `mossaic.in` to a "Coming Soon" page), turn it OFF — forwarding overrides DNS records and would route visitors away from GitHub.

In our case this was already correctly off, so no action was needed.

### 5.4 Disconnect / cancel "Websites + Marketing Free"

This is the one that most surprises people. GoDaddy automatically gave us a free site-builder product when we registered the domain, and it auto-attached itself to `mossaic.in`. It's the source of the WebsiteBuilder DNS record (5.2) — you can't permanently delete that record while this product is bound to the domain.

**Recommended path — cancel the product entirely:**

1. Top-right of GoDaddy → click your **profile icon / account name** → **My Products**.
2. Find the **Websites + Marketing** section → row labeled **"Websites + Marketing Free · MOSSAIC.IN"**.
3. Click the **three-dot menu (⋯)** at the right of that row, OR click the row itself to expand it.
4. Choose **Cancel Subscription** / **Cancel Product** / **Remove**. Since it's the free tier there's no payment involved. Confirm.

**Alternative path — keep the product but disconnect the domain:**

1. From the dashboard, click **Edit Website** to open the visual editor.
2. Find **Settings** (gear icon, usually top-right of the editor).
3. Under **Site Settings → Domain**, switch from `mossaic.in` to a temporary `*.godaddysites.com` domain.
4. Save.

**After either path:** Go back to **DNS → DNS Records**, find the **A · @ · WebsiteBuilder Site** row, and delete it. This time it should stay gone.

**Also visible in My Products:** an "InstantPage (Websites + Marketing)" with a **Redeem** button. **Don't redeem it** — that would re-create the same problem.

### 5.5 What `dnschecker.org` should show when everything is clean

After the cleanup propagates (10–60 minutes), querying `mossaic.in` with record type `A` at https://dnschecker.org should return **only** these four IPs:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

If you still see `76.x.x.x` or `13.x.x.x` rows, the WebsiteBuilder record is still alive somewhere — go back to step 5.4.

---

## 6. Part 4 — The order in which everything was done

This is the order that worked for us, with a brief reason for each step.

1. **Wrote the build workflow** (`deploy-pages.yml`) and committed it. Without this, GitHub has nothing to run.
2. **Created `public/CNAME`** containing `mossaic.in`. Without this, GitHub Pages refuses to serve a custom domain.
3. **Updated `vite.config.ts`** to read `BASE_PATH` from environment. Without this, the asset paths in the built HTML can't be switched between custom-domain mode and subpath mode.
4. **Pushed everything to `main`** on GitHub.
5. **Settings → Pages → Source = "GitHub Actions"**. Without this, GitHub keeps serving the raw branch instead of the built site.
6. **Settings → Variables → added `BASE_PATH = /mossaic-homepage/`** temporarily, just so we could verify the subpath URL worked while DNS was still being set up.
7. **Manually ran the workflow** from the Actions tab. Confirmed both jobs went green.
8. **Verified** `https://myfavoriteworkplace.github.io/mossaic-homepage/` loaded the real site.
9. **Set up DNS at GoDaddy** — added the four A records and the `www` CNAME.
10. **Settings → Pages → Custom domain = `mossaic.in`** in GitHub. GitHub started its DNS verification.
11. **Removed the `BASE_PATH` variable** in GitHub (now that custom domain was active, default `/` is correct).
12. **Manually re-ran the workflow** so the new build (without the subpath prefix) got published.
13. **Discovered the GoDaddy parking page issue** — `mossaic.in` was showing GoDaddy's template instead of our site.
14. **Diagnosed via dnschecker.org** — saw extra `76.x.x.x` IPs alongside our four GitHub IPs. The WebsiteBuilder product was the culprit.
15. **Disconnected/cancelled** the Websites + Marketing Free product on GoDaddy.
16. **Deleted the leftover `WebsiteBuilder Site` A record** in GoDaddy DNS.
17. **Waited ~15 minutes** for DNS caches to expire.
18. **Hard-refreshed `mossaic.in`** — site loaded.
19. **Ticked "Enforce HTTPS"** in GitHub Settings → Pages once the option became available.

---

## 7. Troubleshooting log — problems we hit and how we fixed them

### Problem 1: Browser DevTools showed `404 https://myfavoriteworkplace.github.io/src/main.tsx`

**Symptom:** Site was a blank page. DevTools network tab showed a 404 fetching `/src/main.tsx`.

**Cause:** GitHub Pages was serving the raw, unbuilt `index.html` from the `main` branch. That source file contains a literal `<script type="module" src="/src/main.tsx">` tag — meaningful only inside Vite's dev server, not in production. The browser tried to fetch the TypeScript source file and (correctly) got a 404. This happened because **Settings → Pages → Source** was set to "Deploy from a branch" instead of "GitHub Actions". The presence of the auto-generated `pages-build-deployment` workflow in the Actions sidebar was the giveaway — that workflow only exists when "Deploy from a branch" is the source.

**Fix:** Settings → Pages → Source → change to **GitHub Actions**. Manually re-run the deploy workflow.

### Problem 2: Subpath URL showed the broken page even after switching Source

**Symptom:** `myfavoriteworkplace.github.io/mossaic-homepage/` still 404'd on assets even after the workflow ran green.

**Cause:** The build was producing asset URLs like `/assets/index-XXX.js` (no subpath prefix), so the browser was looking at `myfavoriteworkplace.github.io/assets/...` instead of `myfavoriteworkplace.github.io/mossaic-homepage/assets/...`.

**Fix:** Add a repo variable `BASE_PATH = /mossaic-homepage/` (with both slashes), then re-run the workflow. The next build emitted the correctly-prefixed asset URLs.

### Problem 3: `mossaic.in` showed a GoDaddy parking page

**Symptom:** Visiting `https://mossaic.in` showed a default GoDaddy "Mossaic / Coming Soon"-style template, not our site. DevTools console showed errors from `content.js` and a `GET https://mossaic.in/markup/ad 500` — those are GoDaddy's parking-page tracking scripts, confirming the response wasn't from GitHub at all.

**Cause:** The GoDaddy Websites + Marketing Free product was attached to the domain and had auto-created an additional `A @ WebsiteBuilder Site` DNS record alongside our four GitHub IPs. DNS resolvers returned all of them; browsers randomly picked one. GitHub IPs gave the real site, GoDaddy IPs gave the parking page.

**Fix:** Cancel the Websites + Marketing Free product (My Products → ⋯ → Cancel), then delete the `WebsiteBuilder Site` A record from DNS. Wait for DNS cache (10–15 min). `dnschecker.org` should then show only the four GitHub IPs.

### Problem 4: Two workflows showed in the Actions sidebar with the same name

**Symptom:** The Actions tab listed "Deploy to GitHub Pages" twice in the left sidebar. Confusing.

**Cause:** Both `deploy-pages.yml` (the active one) and `deploy.yml` (a leftover I had to disable rather than delete due to a platform restriction at the time) used the same `name: Deploy to GitHub Pages` line at the top of their YAML.

**Fix:** Renamed the disabled file's `name:` field to `Deploy (disabled — superseded by deploy-pages.yml)` and changed its trigger to `workflow_dispatch` only (so it never runs on push). The leftover file can be deleted entirely whenever you want — see section 3.2.

### Problem 5: Concern about a "Delete CNAME" commit

**Symptom:** A commit history entry titled "Delete CNAME" raised concern about whether the custom-domain marker had been removed.

**Cause:** Two separate `CNAME` files existed at one point: one at the repo root (created by an earlier setup) and one in `public/` (the one Vite uses). The repo-root one was deleted as cleanup. This is harmless because Vite never copied it into the build output anyway.

**Fix:** No fix needed. Confirmed `public/CNAME` was still present and intact. **Important reminder: never delete `public/CNAME` — that's the one that matters.**

---

## 8. How to make changes from now on

Once everything is set up (which it is), the workflow for any future change to the site is:

1. **Edit the code** locally (or in any editor).
2. **`git push origin main`**.
3. **Wait ~90 seconds.** The GitHub Actions workflow runs automatically — you can watch it go green in the Actions tab if you want.
4. **Hard-refresh `https://mossaic.in`** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). Your change is live.

That's it. No manual builds, no FTP uploads, no DNS changes, no GoDaddy logins. The whole pipeline is reproducible, version-controlled, and (now that everything's debugged) "set and forget".

---

## 9. Quick-reference: all the credentials and identifiers we used

| Thing | Value |
|---|---|
| GitHub repository | `myfavoriteworkplace/mossaic-homepage` |
| GitHub Pages subpath URL | `https://myfavoriteworkplace.github.io/mossaic-homepage/` |
| Custom domain (production) | `mossaic.in` |
| Custom domain (www variant) | `www.mossaic.in` (auto-redirects to `mossaic.in`) |
| GitHub Pages A records (4) | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `www` CNAME target | `myfavoriteworkplace.github.io` |
| Active workflow file | `.github/workflows/deploy-pages.yml` |
| Disabled placeholder workflow | `.github/workflows/deploy.yml` (safe to delete) |
| Custom-domain marker | `public/CNAME` containing `mossaic.in` |
| Vite base config | `base: process.env.BASE_PATH || "/"` in `vite.config.ts` |
| BASE_PATH repo variable | Currently **unset** (correct for custom domain). Set to `/mossaic-homepage/` only if hosting at the subpath URL alone. |
| GitHub Pages Source setting | **GitHub Actions** |
| Cancelled GoDaddy product | Websites + Marketing Free |
| Removed DNS record | `A @ WebsiteBuilder Site` |
| DNS verification tool | https://dnschecker.org |

---

*End of guide. If something breaks in the future, start with Section 7 — odds are high it's one of those five problems again.*
