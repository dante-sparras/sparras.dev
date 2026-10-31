import { getProfile, siteUrl } from "@/content/profile";
import type { Locale } from "@/i18n/locale";

const knownFor = ["C#", ".NET", "SQL Server", "TypeScript", "Next.js", "Unity"];

/**
 * schema.org data that tells search engines who this page is about and which
 * accounts are his. The phone number stays out, on purpose.
 */
export function getProfileStructuredData(locale: Locale) {
  const profile = getProfile(locale);

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${siteUrl}/${locale}`,
    inLanguage: locale,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      alternateName: "Dante Sparras",
      jobTitle: profile.role,
      url: siteUrl,
      image: `${siteUrl}${profile.avatar.src}`,
      sameAs: profile.socialLinks.map((link) => link.href),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Norrköping",
        addressCountry: "SE",
      },
      affiliation: {
        "@type": "EducationalOrganization",
        name: profile.school.name,
        url: profile.school.href,
      },
      knowsAbout: knownFor,
    },
  };
}

/** Safe inside a script tag: a `<` in the data can't close it. */
export function serializeStructuredData(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
