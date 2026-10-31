import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { ResumeDocument } from "@/components/resume-document";
import { isLocale, locales } from "@/i18n/locale";
import { isResumeTheme, resumeThemes } from "@/lib/resume-theme";

/** Same as the homepage, so "Current" and durations stay in step with it. */
export const revalidate = 900;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    resumeThemes.map((theme) => ({ lang, theme })),
  );
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/[lang]/resume/[theme]">,
) {
  const { lang, theme } = await params;
  if (!isLocale(lang) || !isResumeTheme(theme)) notFound();

  const pdf = await renderToBuffer(
    <ResumeDocument locale={lang} theme={theme} />,
  );
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf" },
  });
}
