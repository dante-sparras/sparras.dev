/** Canonical site identity (metadata, links, absolute URLs). */
export const SITE_URL = "https://sparras.dev" as const;
export const SITE_NAME = "sparras.dev" as const;
export const SITE_AUTHOR = "Dante Sparrås" as const;

/** Contact details shown on the profile hero (not i18n). */
export const SITE_CONTACT = {
  email: "dante.sparras@pm.me",
  phoneDisplay: "+46 73 554 65 93",
  phoneHref: "tel:+46735546593",
  websiteDisplay: SITE_NAME,
  websiteHref: SITE_URL,
} as const;
