export const themeChoices = ["system", "light", "dark"] as const;

export type ThemeChoice = (typeof themeChoices)[number];
