import type { ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Reference = {
  name: string;
  initials: string;
  avatarSrc: string;
  companyLogoSrc: ImageSrc;
  workplace?: string;
  quote?: string;
};

const referenceSources: {
  name: string;
  initials: string;
  avatarSrc: string;
  companyLogoSrc: ImageSrc;
  workplace: Record<Locale, string>;
}[] = [
  {
    name: "Sebastian Aarnio",
    initials: "SA",
    avatarSrc: "/sebastian-aarnio.png",
    companyLogoSrc: "/spacexai-logo.jpg",
    workplace: {
      en: "Software Engineer @ SpaceXAI",
      sv: "Mjukvaruutvecklare @ SpaceXAI",
    },
  },
  {
    name: "Olie Aarnio",
    initials: "OA",
    avatarSrc: "/olie-aarnio.png",
    companyLogoSrc: "/casuology-logo.jpg",
    workplace: {
      en: "Game Content Writer / Narrative Designer @ Casuology",
      sv: "Spelinnehållsskribent / narrativ designer @ Casuology",
    },
  },
  {
    name: "Henry Brandt",
    initials: "HB",
    avatarSrc: "/henry-brandt.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
  },
  {
    name: "Robert Johansson",
    initials: "RJ",
    avatarSrc: "/robert-johansson.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
  },
];

export function getReferences(locale: Locale): Reference[] {
  return referenceSources.map((reference) => ({
    name: reference.name,
    initials: reference.initials,
    avatarSrc: reference.avatarSrc,
    companyLogoSrc: reference.companyLogoSrc,
    workplace: reference.workplace[locale],
  }));
}
