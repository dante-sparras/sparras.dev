/** Canonical site identity (metadata, links, absolute URLs). */
export const SITE_URL = "https://sparras.dev" as const;
export const SITE_NAME = "sparras.dev" as const;
export const SITE_AUTHOR = "Dante Sparrås" as const;

/** E.164 digits with leading + (source of truth for tel: links). */
const PHONE_E164 = "+46735546593" as const;

/** Contact details shown on the profile hero (not i18n). */
export const SITE_CONTACT = {
  email: "dante.sparras@pm.me",
  phoneDisplay: "+46 73 554 65 93",
  phoneHref: `tel:${PHONE_E164}`,
  websiteDisplay: SITE_NAME,
  websiteHref: SITE_URL,
} as const;
