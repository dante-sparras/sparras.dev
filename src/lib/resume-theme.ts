export const resumeThemes = ["dark", "light"] as const;

export type ResumeTheme = (typeof resumeThemes)[number];

export function isResumeTheme(value: string): value is ResumeTheme {
  return resumeThemes.some((theme) => theme === value);
}
