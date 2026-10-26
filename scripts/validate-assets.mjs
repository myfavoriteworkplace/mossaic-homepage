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
const REVIEW_IMAGE_MAX_BYTES = 100 * 1024;
const REVIEW_IMAGE_MAX_DIMENSION = 384;

function getWebpDimensions(filePath) {
  const image = readFileSync(filePath);
  if (
    image.length < 12 ||
    image.toString("ascii", 0, 4) !== "RIFF" ||
    image.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= image.length) {
    const chunkType = image.toString("ascii", offset, offset + 4);
    const chunkSize = image.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > image.length) return null;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: 1 + image.readUIntLE(dataOffset + 4, 3),
        height: 1 + image.readUIntLE(dataOffset + 7, 3),
      };
    }

    if (
      chunkType === "VP8 " &&
      chunkSize >= 10 &&
      image[dataOffset + 3] === 0x9d &&
      image[dataOffset + 4] === 0x01 &&
      image[dataOffset + 5] === 0x2a
    ) {
      return {
        width: image.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: image.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === "VP8L" && chunkSize >= 5 && image[dataOffset] === 0x2f) {
      const widthByte = image[dataOffset + 1];
      const sizeByte = image[dataOffset + 2];
      const heightByte = image[dataOffset + 3];
      const alphaByte = image[dataOffset + 4];
      return {
        width: 1 + widthByte + ((sizeByte & 0x3f) << 8),
        height: 1 + (sizeByte >> 6) + (heightByte << 2) + ((alphaByte & 0x0f) << 10),
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

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

const reviewImageErrors = [];
const testimonialsPath = join(projectRoot, "src/data/testimonials.json");
if (existsSync(testimonialsPath)) {
  const testimonials = JSON.parse(readFileSync(testimonialsPath, "utf8"));
  for (const testimonial of testimonials) {
    if (!testimonial.image) continue;

    if (
      typeof testimonial.image !== "string" ||
      !/^images\/reviews\/[\w.-]+\.webp$/.test(testimonial.image)
    ) {
      reviewImageErrors.push(
        `${testimonial.id}: review images must be WebP files under images/reviews/.`,
      );
      continue;
    }

    const imagePath = join(publicRoot, testimonial.image);
    if (!existsSync(imagePath)) {
      reviewImageErrors.push(`${testimonial.id}: public/${testimonial.image} was not found.`);
      continue;
    }

    const imageSize = statSync(imagePath).size;
    if (imageSize > REVIEW_IMAGE_MAX_BYTES) {
      reviewImageErrors.push(
        `${testimonial.id}: review image is ${imageSize} bytes; maximum is ${REVIEW_IMAGE_MAX_BYTES} bytes.`,
      );
    }

    const dimensions = getWebpDimensions(imagePath);
    if (!dimensions) {
      reviewImageErrors.push(`${testimonial.id}: review image is not a valid WebP file.`);
      continue;
    }
    if (dimensions.width !== dimensions.height) {
      reviewImageErrors.push(
        `${testimonial.id}: review image must be square, got ${dimensions.width}×${dimensions.height}.`,
      );
    }
    if (
      dimensions.width > REVIEW_IMAGE_MAX_DIMENSION ||
      dimensions.height > REVIEW_IMAGE_MAX_DIMENSION
    ) {
      reviewImageErrors.push(
        `${testimonial.id}: review image dimensions are ${dimensions.width}×${dimensions.height}; maximum is ${REVIEW_IMAGE_MAX_DIMENSION}×${REVIEW_IMAGE_MAX_DIMENSION}.`,
      );
    }
  }
}

if (reviewImageErrors.length > 0) {
  console.error("Asset validation failed for review images:");
  for (const error of reviewImageErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${referenceCount} public asset reference(s) across ${sourceFiles.length} source file(s).`,
);
