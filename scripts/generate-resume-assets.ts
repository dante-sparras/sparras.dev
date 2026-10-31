/**
 * Rebuilds the images in `src/assets/resume` from `public`. The PDF renderer
 * can't embed SVG, and the originals would make the resume over a megabyte.
 *
 * Run `bun scripts/generate-resume-assets.ts` after adding a skill or an
 * organization logo.
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { getExperience } from "@/content/experience";
import { skills } from "@/content/skills";

const output = path.join(process.cwd(), "src/assets/resume");
const publicFile = (src: unknown) => path.join("public", String(src));
const baseName = (src: unknown) =>
  path.basename(String(src), path.extname(String(src)));
const black = { r: 0, g: 0, b: 0, alpha: 1 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

await mkdir(path.join(output, "icons"), { recursive: true });
await mkdir(path.join(output, "icons-light"), { recursive: true });
await mkdir(path.join(output, "logos"), { recursive: true });

/** White or pale grey marks made for the site's black background. */
function isPaleMonochrome(pixels: Buffer) {
  let visible = 0;
  let brightness = 0;
  let colorfulness = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, alpha] = pixels.subarray(i, i + 4);
    if (alpha === undefined || alpha < 128) continue;
    visible += 1;
    brightness += (r + g + b) / 3;
    colorfulness += Math.max(r, g, b) - Math.min(r, g, b);
  }
  return (
    visible > 0 && brightness / visible > 150 && colorfulness / visible < 12
  );
}

for (const skill of skills) {
  const icon = await sharp(publicFile(skill.iconSrc), { density: 300 })
    .resize(48, 48, { fit: "contain", background: transparent })
    .ensureAlpha()
    .png()
    .toBuffer();
  const file = `${baseName(skill.iconSrc)}.png`;
  await sharp(icon).toFile(path.join(output, "icons", file));

  if (isPaleMonochrome(await sharp(icon).raw().toBuffer())) {
    await sharp(icon)
      .negate({ alpha: false })
      .toFile(path.join(output, "icons-light", file));
  }
}

for (const { logoSrc } of getExperience("en")) {
  if (!logoSrc) continue;
  await sharp(publicFile(logoSrc))
    .resize(88, 88)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90 })
    .toFile(path.join(output, "logos", `${baseName(logoSrc)}.jpg`));
}

/** The same icons as the site's profile section, plus the social logos. */
const lucide = (icon: typeof MailIcon) =>
  Buffer.from(renderToStaticMarkup(createElement(icon, { size: 96 })));

const contactIcons = {
  mail: lucide(MailIcon),
  phone: lucide(PhoneIcon),
  location: lucide(MapPinIcon),
  website: lucide(GlobeIcon),
  github: await readFile("public/icons/github.svg"),
  linkedin: await readFile("public/icons/linkedin.svg"),
};

/** The muted text color of each resume theme. */
const contactColors = { dark: "#a1a1a1", light: "#525252" };

await mkdir(path.join(output, "contact"), { recursive: true });

for (const [name, svg] of Object.entries(contactIcons)) {
  const shape = await sharp(svg, { density: 300 })
    .resize(48, 48, { fit: "contain", background: transparent })
    .ensureAlpha()
    .png()
    .toBuffer();

  for (const [theme, color] of Object.entries(contactColors)) {
    await sharp({
      create: { width: 48, height: 48, channels: 4, background: color },
    })
      .composite([{ input: shape, blend: "dest-in" }])
      .png()
      .toFile(path.join(output, "contact", `${name}-${theme}.png`));
  }
}

await sharp("public/avatar/profile.png")
  .resize(320, 320)
  .flatten({ background: black })
  .jpeg({ quality: 88 })
  .toFile(path.join(output, "avatar.jpg"));

const banner = sharp("public/banner/black-hole-banner.png").resize(1080, 432, {
  kernel: "nearest",
});

await banner
  .clone()
  .flatten({ background: black })
  .png({ palette: true, colours: 64 })
  .toFile(path.join(output, "banner.png"));

// The artwork has no transparency: its black is empty space. For a white page,
// brightness becomes opacity, and the colors are deepened so they still read.
// Its black is not pure, so near-black must count as fully transparent.
const { data: bannerPixels, info } = await banner
  .clone()
  .flatten({ background: black })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const lightBanner = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  const [r = 0, g = 0, b = 0] = bannerPixels.subarray(i * 3, i * 3 + 3);
  const peak = Math.max(r, g, b, 1);
  const deepen = (channel: number) => (channel / peak) * 150;
  lightBanner[i * 4] = deepen(r);
  lightBanner[i * 4 + 1] = deepen(g);
  lightBanner[i * 4 + 2] = deepen(b);
  lightBanner[i * 4 + 3] = Math.min(255, Math.max(0, peak - 24) * 3.2);
}
await sharp(lightBanner, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(path.join(output, "banner-light.png"));
