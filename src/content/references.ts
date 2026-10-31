import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type Reference = {
  name: string;
  initials: string;
  avatarSrc: string;
  linkedinHref: Href;
  companyLogoSrc: ImageSrc;
  workplace?: string;
  quote?: string;
};

const referenceSources: {
  name: string;
  initials: string;
  avatarSrc: string;
  linkedinHref: Href;
  companyLogoSrc: ImageSrc;
  workplace: Record<Locale, string>;
  quote?: string;
}[] = [
  {
    name: "Sebastian Aarnio",
    initials: "SA",
    avatarSrc: "/references/sebastian-aarnio.webp",
    linkedinHref: "https://www.linkedin.com/in/sebastian-aarnio/",
    companyLogoSrc: "/spacexai-logo.jpg",
    workplace: {
      en: "Software Engineer @ SpaceXSI",
      sv: "Mjukvaruutvecklare @ SpaceXSI",
    },
    quote:
      "Strong engineer who combines solid technical skills with a real eye for design.",
  },
  {
    name: "Olie Aarnio",
    initials: "OA",
    avatarSrc: "/references/olie-aarnio.webp",
    linkedinHref: "https://www.linkedin.com/in/olie-aarnio-05bbb2173/",
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
    avatarSrc: "/references/henry-brandt.webp",
    linkedinHref: "https://www.linkedin.com/in/brandthenry/",
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
    avatarSrc: "/references/robert-johansson.webp",
    linkedinHref: "https://www.linkedin.com/in/robert-johansson86/",
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
    avatarSrc: "/references/frank-jonsson.webp",
    linkedinHref: "https://www.linkedin.com/in/fwjonsson/",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
    quote:
      "Analytical and driven, dedicated to the craft. A dependable teammate who takes responsibility for the result.",
  },
  {
    name: "Leopold Hedefalk Nybom",
    initials: "LH",
    avatarSrc: "/references/leopold-hedefalk-nybom.webp",
    linkedinHref: "https://www.linkedin.com/in/leopold-hedefalk-nybom/",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: {
      en: "Student @ YH Akademin",
      sv: "Student @ YH Akademin",
    },
    quote:
      "He picks up new tech fast and shares what he learns. He helped me set up an AI coding agent and use it daily.",
  },
];

export function getReferences(locale: Locale): Reference[] {
  return referenceSources.map((reference) => ({
    name: reference.name,
    initials: reference.initials,
    avatarSrc: reference.avatarSrc,
    linkedinHref: reference.linkedinHref,
    companyLogoSrc: reference.companyLogoSrc,
    workplace: reference.workplace[locale],
    quote: reference.quote,
  }));
}
