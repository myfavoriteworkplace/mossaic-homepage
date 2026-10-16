---
name: Portable npm lockfiles
description: Keep committed package tarball URLs usable outside Replit.
---

Committed `package-lock.json` files must not point to `package-firewall.replit.internal`; GitHub Actions cannot resolve that Replit-only host.

**Why:** GitHub Actions returned `ENOTFOUND` for internal mirror URLs while the same lockfile installed successfully inside Replit, masking the portability issue.

**How to apply:** Before committing dependency updates, scan lockfile `resolved` URLs for the internal hostname. Use public `https://registry.npmjs.org/` tarball URLs, preserve package versions and integrity hashes, then verify a clean install outside any Replit-only cache.
