# Meta (Facebook) Domain Verification

## What was done

To verify the `mossaic.in` domain with Meta Business Manager, a domain verification meta-tag was added to the homepage's `<head>` section.

### Tag added to `index.html`

```html
<meta name="facebook-domain-verification" content="d9fsf06xrj4ozyx6vnayx80gvrqskr" />
```

**Location in file:** inside `<head>` directly after the `theme-color` meta-tag, before the Open Graph block.

---

## Why this is required

Meta requires domain ownership verification before you can:
- Run ads with a verified domain
- Assign pixel events to the domain
- Use the domain in Facebook Business Manager

---

## Verification steps (Meta's instructions)

1. The meta-tag has been added to `index.html` in the `<head>` section.
2. **Deploy the site** so the tag is publicly accessible at `http://mossaic.in/`.
3. Confirm the tag is visible by visiting `http://mossaic.in/` and viewing the page source (`Ctrl+U` / `Cmd+Option+U`).
4. Return to Meta Business Manager → **Brand Safety** → **Domains** and click **Verify domain**.

> Note: Meta may take up to 72 hours to detect the tag. If verification fails, click **Verify domain** again or check the tag using Meta's [Sharing Debugger Tool](https://developers.facebook.com/tools/debug/).

---

## Verification details

| Field | Value |
|---|---|
| Domain | mossaic.in |
| Meta-tag name | `facebook-domain-verification` |
| Verification content value | `d9fsf06xrj4ozyx6vnayx80gvrqskr` |
| Added to | `index.html` → `<head>` |
| Date added | June 2026 |
