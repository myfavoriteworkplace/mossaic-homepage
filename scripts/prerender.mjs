import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = process.cwd();
const outputPath = path.join(root, "dist", "index.html");
const rootPlaceholder = /<div id="root"><\/div>/;
const server = await createServer({
  appType: "custom",
  server: {
    middlewareMode: true,
    hmr: false,
  },
  logLevel: "error",
});

try {
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const renderedApp = renderToString(
    createElement(StrictMode, null, createElement(App)),
  );
  const headingCount = (renderedApp.match(/<h1(?:\s|>)/g) ?? []).length;

  if (headingCount !== 1) {
    throw new Error(
      `Expected exactly one homepage H1 in prerendered output; found ${headingCount}.`,
    );
  }

  const html = await readFile(outputPath, "utf8");
  if (!rootPlaceholder.test(html)) {
    throw new Error(
      `Could not find the empty #root mount point in ${outputPath}.`,
    );
  }

  await writeFile(
    outputPath,
    html.replace(rootPlaceholder, `<div id="root">${renderedApp}</div>`),
  );
  console.log("Prerendered homepage with exactly one H1.");
} finally {
  await server.close();
}
