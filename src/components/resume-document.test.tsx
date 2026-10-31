import { describe, expect, test } from "bun:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument, skillIcon } from "@/components/resume-document";
import { skills } from "@/content/skills";
import { locales } from "@/i18n/locale";
import { resumeThemes } from "@/lib/resume-theme";

function pageCount(pdf: Buffer) {
  return pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0;
}

function imageCount(pdf: Buffer) {
  return pdf.toString("latin1").match(/\/Subtype\s*\/Image\b/g)?.length ?? 0;
}

describe("ResumeDocument", () => {
  test("has an icon for every skill", () => {
    // A failure here means: run `bun scripts/generate-resume-assets.ts`.
    const missing = skills.filter((skill) => !skillIcon(skill.iconSrc, "dark"));

    expect(missing.map((skill) => skill.name)).toEqual([]);
  });

  const versions = locales.flatMap((locale) =>
    resumeThemes.map((theme) => ({ locale, theme })),
  );

  for (const { locale, theme } of versions) {
    test(`fits on one page in ${locale} ${theme}`, async () => {
      const pdf = await renderToBuffer(
        <ResumeDocument locale={locale} theme={theme} />,
      );

      expect(pageCount(pdf)).toBe(1);
    });

    test(`embeds the banner and avatar in ${locale} ${theme}`, async () => {
      const pdf = await renderToBuffer(
        <ResumeDocument locale={locale} theme={theme} />,
      );

      expect(imageCount(pdf)).toBeGreaterThanOrEqual(2);
    });
  }
});
