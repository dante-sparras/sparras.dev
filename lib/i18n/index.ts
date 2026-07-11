export type { Dictionary } from "./dictionaries/types";
export { getDictionary, getSiteMetadata } from "./dictionary";
export {
  defaultLocale,
  getPageCopy,
  isLocale,
  localeFromAcceptLanguage,
  locales,
  localizedPath,
  pageTitleMetadata,
  pathnameHasLocale,
  pathnameWithoutLocale,
  requireLocale,
  type Locale,
  type LocaleParams,
} from "./locale";
export { createSectionPage } from "./section-page";
