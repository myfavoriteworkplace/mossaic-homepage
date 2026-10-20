---
name: Transparent SVG exports
description: Preserve transparent SVG padding when rendering PNG icon variants with ImageMagick.
---

When rasterizing transparent SVG icons with ImageMagick, pass `-background none` before the input and emit an alpha-capable PNG format. Verify a corner pixel's alpha value; a visual preview may composite transparency onto a white or dark viewer background.

**Why:** ImageMagick rendered this project's SVG padding as opaque white when no background was specified, despite the SVG containing no background rectangle.

**How to apply:** For generated favicons and touch icons, check `%[channels]`, `%[opaque]`, and a corner pixel after regeneration.
