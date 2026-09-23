import type { ImageSrc } from "@/content/types";

export type Reference = {
  name: string;
  initials: string;
  avatarSrc: string;
  companyLogoSrc: ImageSrc;
  workplace?: string;
  quote?: string;
};

export const references: Reference[] = [
  {
    name: "Sebastian Aarnio",
    initials: "SA",
    avatarSrc: "/sebastian-aarnio.png",
    companyLogoSrc: "/spacexai-logo.jpg",
    workplace: "Software Engineer @ SpaceXAI",
  },
  {
    name: "Olie Aarnio",
    initials: "OA",
    avatarSrc: "/olie-aarnio.png",
    companyLogoSrc: "/casuology-logo.jpg",
    workplace: "Game Content Writer / Narrative Designer @ Casuology",
  },
  {
    name: "Henry Brandt",
    initials: "HB",
    avatarSrc: "/henry-brandt.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: "Student @ YH Akademin",
  },
  {
    name: "Robert Johansson",
    initials: "RJ",
    avatarSrc: "/robert-johansson.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: "Student @ YH Akademin",
  },
];
