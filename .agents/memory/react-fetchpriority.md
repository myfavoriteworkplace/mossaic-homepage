---
name: React fetch priority attribute
description: Workaround for React runtime/type mismatch when setting the native image fetchpriority attribute.
---

When setting the native image priority attribute in this project, pass lowercase `fetchpriority` through JSX spread syntax instead of using `fetchPriority`.

**Why:** The installed React runtime warned on `fetchPriority` despite the TypeScript DOM type accepting it; lowercase JSX was rejected by TypeScript. A lowercase attribute passed in a spread emits correctly without either issue.

**How to apply:** For image priority attributes, use `{...{ fetchpriority: "high" }}` and verify the rendered HTML plus browser console.
