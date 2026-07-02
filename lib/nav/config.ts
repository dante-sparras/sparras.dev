export const navLinkIds = [
  "about",
  "skills",
  "portfolio",
  "testimonials",
  "contact",
] as const;

export type NavLinkId = (typeof navLinkIds)[number];

/** SY26 anchor targets (sections land here as they ship). */
export const navAnchors: Record<NavLinkId, string> = {
  about: "#info",
  skills: "#skills",
  portfolio: "#portfolio",
  testimonials: "#references",
  contact: "#contact",
};

export const resumePath = "/resume/Resume_dante-sparras_2026.pdf";
