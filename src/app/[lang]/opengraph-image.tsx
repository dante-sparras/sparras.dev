import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getProfile } from "@/content/profile";
import { isLocale, locales } from "@/i18n/locale";

/** The card a shared link shows on LinkedIn, Discord, X and in messages. */
export const alt = "Dante Sparrås";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = (file: string) =>
  readFile(path.join(process.cwd(), "src/assets/resume", file));

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const profile = getProfile(lang);
  const [banner, pixelFont, regularFont, semiboldFont] = await Promise.all([
    asset("banner.png"),
    asset("geist-pixel-regular.ttf"),
    asset("geist-regular.ttf"),
    asset("geist-semibold.ttf"),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        width: "100%",
        height: "100%",
        padding: 64,
        background: "#000",
        color: "#fff",
        fontFamily: "Geist",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: drawn to a PNG, not a page */}
      <img
        alt=""
        src={`data:image/png;base64,${banner.toString("base64")}`}
        style={{
          position: "absolute",
          top: -96,
          left: 0,
          width: 1200,
          height: 480,
          objectFit: "cover",
        }}
      />
      <div style={{ fontFamily: "Geist Pixel", fontSize: 76 }}>
        {profile.name}
      </div>
      <div style={{ marginTop: 8, color: "#a3a3a3", fontSize: 34 }}>
        {profile.role}
      </div>
      <div style={{ marginTop: 32, fontSize: 34, fontWeight: 600 }}>
        {profile.availability.title}
      </div>
      <div style={{ marginTop: 8, color: "#a3a3a3", fontSize: 28 }}>
        {`${profile.availability.dates} · ${profile.availability.workplace}`}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist Pixel", data: pixelFont, weight: 400 },
        { name: "Geist", data: regularFont, weight: 400 },
        { name: "Geist", data: semiboldFont, weight: 600 },
      ],
    },
  );
}
