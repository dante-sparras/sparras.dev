import sharp from "sharp";

const inputFilePath = process.argv[2];
const inputFileName = inputFilePath.split("/").pop();

sharp(inputFilePath)
  .resize(480, 480, { fit: "cover" })
  .webp({ quality: 82 })
  .sharpen()
  .toFile(`${inputFileName}.webp`);

/**
 * USAGE:
 * bun run image-to-webp.ts <path-to-image>
 *
 * RETURNS:
 * Converts the input image to a 480x480 WebP image with quality 82 and
 * sharpening applied.
 */
