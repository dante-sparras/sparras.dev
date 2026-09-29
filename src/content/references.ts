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
  quote?: string;
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
    quote:
      "Strong engineer who combines solid technical skills with a real eye for design.",
  },
  {
    name: "Olie Aarnio",
    initials: "OA",
    avatarSrc: "/olie-aarnio.png",
    companyLogoSrc: "/casuology-logo.jpg",
    workplace: {
      en: "Game Content Writer @ Casuology",
      sv: "Spelinnehållsskribent @ Casuology",
    },
    quote:
      "Reliable to work with. Ships polished work and cares about the details.",
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
    quote: "Explains his code clearly and makes complex things easy to follow.",
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
    quote: "Taught our team new technologies and concepts along the way.",
  },
  {
    name: "Frank Jonsson",
    initials: "FJ",
    avatarSrc: "/frank-jonsson.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
    quote: "Analytical and driven, dedicated to the craft. A dependable teammate who takes responsibility for the result.",
  },
  {
    name: "Leopold Hedefalk Nybom",
    initials: "LH",
    avatarSrc: "/leopold-hedefalk-nybom.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
    quote: "He picks up new tech fast and shares what he learns. He helped me set up an AI coding agent and use it daily.",
  },
];

export function getReferences(locale: Locale): Reference[] {
  return referenceSources.map((reference) => ({
    name: reference.name,
    initials: reference.initials,
    avatarSrc: reference.avatarSrc,
    companyLogoSrc: reference.companyLogoSrc,
    workplace: reference.workplace[locale],
    quote: reference.quote,
  }));
}
