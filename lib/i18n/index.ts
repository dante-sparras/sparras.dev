export {
  defaultLocale,
  isLocale,
  localeFromAcceptLanguage,
  locales,
  type Locale,
} from "./config";
export type { Dictionary } from "./dictionaries/types";
export { getDictionary, getSiteMetadata } from "./get-dictionary";
export {
  getPageCopy,
  pageTitleMetadata,
  requireLocale,
  type LocaleParams,
} from "./locale";
export { createSectionPage } from "./section-page";
export { localizedPath, pathnameWithoutLocale } from "./paths";
