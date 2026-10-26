import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = process.cwd();
const outputPath = path.join(root, "dist", "index.html");
const deckOutputPath = path.join(root, "dist", "deck", "index.html");
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

  const { default: DeckPage } = await server.ssrLoadModule(
    "/src/deck/DeckPage.tsx",
  );
  const renderedDeck = renderToString(
    createElement(StrictMode, null, createElement(DeckPage)),
  );
  const deckHtml = await readFile(deckOutputPath, "utf8");
  if (!rootPlaceholder.test(deckHtml)) {
    throw new Error(
      `Could not find the empty #root mount point in ${deckOutputPath}.`,
    );
  }
  await writeFile(
    deckOutputPath,
    deckHtml.replace(
      rootPlaceholder,
      `<div id="root">${renderedDeck}</div>`,
    ),
  );
  console.log("Prerendered homepage and initial deck slide.");
} finally {
  await server.close();
}
