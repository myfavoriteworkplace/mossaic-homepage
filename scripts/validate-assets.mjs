import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const projectRoot = process.cwd();
const publicRoot = join(projectRoot, "public");
const sourceRoots = ["src", "deck", "scripts"];
const sourceExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const assetReferencePattern =
  /(?:\$\{\s*import\.meta\.env\.BASE_URL\s*\}|%BASE_URL%|public\/|\/|\.\/|\.\.\/)?((?:icons|images)\/[\w./-]+\.(?:svg|png|jpe?g|webp|avif|gif))/gi;

function collectSourceFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

const sourceFiles = [
  join(projectRoot, "index.html"),
  ...sourceRoots.flatMap((directory) =>
    collectSourceFiles(join(projectRoot, directory)),
  ),
].filter(existsSync);

if (!existsSync(publicRoot)) {
  console.error("Asset validation failed: public/ was not found.");
  process.exit(1);
}

let referenceCount = 0;
const missingReferences = [];

for (const sourcePath of sourceFiles) {
  const source = readFileSync(sourcePath, "utf8");
  // Ignore remote asset URLs while preserving character offsets for line numbers.
  const searchableSource = source.replace(
    /https?:\/\/[^\s"'`<>]+/gi,
    (url) => " ".repeat(url.length),
  );

  for (const match of searchableSource.matchAll(assetReferencePattern)) {
    const assetPath = match[1];
    referenceCount += 1;

    if (!existsSync(join(publicRoot, assetPath))) {
      const line = searchableSource.slice(0, match.index).split("\n").length;
      missingReferences.push({
        file: relative(projectRoot, sourcePath).split(sep).join("/"),
        line,
        assetPath,
      });
    }
  }
}

if (missingReferences.length > 0) {
  console.error("Asset validation failed; these public files do not exist:");
  for (const reference of missingReferences) {
    console.error(`- ${reference.file}:${reference.line} → public/${reference.assetPath}`);
  }
  process.exit(1);
}

console.log(
  `Validated ${referenceCount} public asset reference(s) across ${sourceFiles.length} source file(s).`,
);
