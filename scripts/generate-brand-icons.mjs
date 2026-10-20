import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(projectRoot, "public/brand/mossaic-faithful.svg");
const svgOutputPath = join(projectRoot, "public/favicon.svg");
const faviconPngPath = join(projectRoot, "public/favicon.png");
const touchIconPath = join(projectRoot, "public/apple-touch-icon.png");
const sourceSvg = readFileSync(sourcePath, "utf8");
const rootMatch = sourceSvg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);

if (!rootMatch) {
  throw new Error(`Could not parse the root SVG element in ${sourcePath}`);
}

const viewBoxMatch = rootMatch[1].match(/\bviewBox=["']([^"']+)["']/i);
const sourceViewBox = viewBoxMatch?.[1];
const viewBoxValues = sourceViewBox?.trim().split(/[\s,]+/).map(Number);

if (
  !viewBoxValues ||
  viewBoxValues.length !== 4 ||
  viewBoxValues.some((value) => !Number.isFinite(value)) ||
  viewBoxValues[2] <= 0 ||
  viewBoxValues[3] <= 0
) {
  throw new Error(`The source SVG needs a valid four-number viewBox: ${sourcePath}`);
}

const [minX, minY, sourceWidth, sourceHeight] = viewBoxValues;
const canvasSize = Math.max(sourceWidth, sourceHeight);
const x = (canvasSize - sourceWidth) / 2;
const y = (canvasSize - sourceHeight) / 2;

// Keep the favicon standalone: browsers commonly block nested external images
// when an SVG is loaded as an icon, so embed the canonical SVG's contents.
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">
  <rect width="${canvasSize}" height="${canvasSize}" fill="#0A1628"/>
  <svg x="${x}" y="${y}" width="${sourceWidth}" height="${sourceHeight}" viewBox="${minX} ${minY} ${sourceWidth} ${sourceHeight}" preserveAspectRatio="xMidYMid meet">
${rootMatch[2]}
  </svg>
</svg>
`;

writeFileSync(svgOutputPath, faviconSvg);

function renderPng(size, outputPath) {
  execFileSync(
    "magick",
    [
      svgOutputPath,
      "-resize",
      `${size}x${size}`,
      "-strip",
      "-define",
      "png:compression-level=9",
      "-depth",
      "8",
      `PNG24:${outputPath}`,
    ],
    { stdio: "inherit" },
  );
}

renderPng(256, faviconPngPath);
renderPng(180, touchIconPath);

console.log("Generated favicon.svg, favicon.png, and apple-touch-icon.png from mossaic-faithful.svg.");
