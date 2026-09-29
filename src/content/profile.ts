import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";
import type { Coordinates } from "@/lib/weather";

export type SocialLink = {
  platform: string;
  href: Href;
  iconSrc: ImageSrc;
};

/**
 * A piece of the bio: plain text, or a reference to an entry in
 * `src/content/skills.ts` (matched by `skill`) that is rendered with its icon.
 * Use `label` when the wording in the sentence differs from the skill name.
 */
export type BioPart = string | { skill: string; label?: string };

type ProfileCopy = {
  role: string;
  summary: string;
  bio: BioPart[];
  avatarAlt: string;
  focus: string;
  studies: string;
  location: string;
};

const company: { name: string; href: Href } = {
  name: "Casuology",
  href: "https://casuology.com",
};

const school = "YH Akademin";

const email = "contact@sparras.dev";

const coordinates: Coordinates = { latitude: 58.5877, longitude: 16.1924 };

const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    href: "https://github.com/dante-sparras",
    iconSrc: "/icons/github.svg",
  },
  {
    platform: "X",
    href: "https://x.com/DanteSparras",
    iconSrc: "/icons/x.svg",
  },
  {
    platform: "LinkedIn",
    href: "https://www.linkedin.com/in/dante-sparras/",
    iconSrc: "/icons/linkedin.svg",
  },
  {
    platform: "Discord",
    href: "https://discord.com/users/274954642566283264",
    iconSrc: "/icons/discord.svg",
  },
];

const profileCopy: Record<Locale, ProfileCopy> = {
  en: {
    role: "Full-stack Developer",
    summary: "Full-stack developer specializing in web and game development.",
    bio: [
      "I'm a full-stack developer who designs and builds websites and web applications, with game development as a second focus. On the web I work in ",
      { skill: "TypeScript" },
      " with ",
      { skill: "Next.js" },
      " and ",
      { skill: "TailwindCSS", label: "Tailwind CSS" },
      ". For games, I use ",
      { skill: "C#" },
      " with ",
      { skill: "Unity" },
      ". I care about writing clean, performant code, designing thoughtfully and shipping work that holds up. I enjoy working closely with teams and sharing what I learn.",
    ],
    avatarAlt: "Picture of Dante Sparrås",
    focus: "Building games",
    studies: "Student",
    location: "Norrköping, Sweden",
  },
  sv: {
    role: "Fullstackutvecklare",
    summary: "Fullstackutvecklare med inriktning på webb- och spelutveckling.",
    bio: [
      "Jag är en fullstackutvecklare som designar och bygger webbplatser och webbapplikationer, med spelutveckling som ett andra fokusområde. På webben arbetar jag i ",
      { skill: "TypeScript" },
      " med ",
      { skill: "Next.js" },
      " och ",
      { skill: "TailwindCSS", label: "Tailwind CSS" },
      ". För spel använder jag ",
      { skill: "C#" },
      " med ",
      { skill: "Unity" },
      ". Jag bryr mig om att skriva ren och effektiv kod, designa omsorgsfullt och leverera arbete som håller. Jag trivs med att arbeta nära andra i team och dela med mig av det jag lär mig.",
    ],
    avatarAlt: "Bild på Dante Sparrås",
    focus: "Bygger spel",
    studies: "Student",
    location: "Norrköping, Sverige",
  },
};

export function getProfile(locale: Locale) {
  const text = profileCopy[locale];

  return {
    name: "Dante Sparrås",
    role: text.role,
    summary: text.summary,
    bio: text.bio,
    avatar: {
      src: "/avatar/profile.png" satisfies ImageSrc,
      alt: text.avatarAlt,
    },
    company,
    focus: text.focus,
    studies: text.studies,
    school,
    location: text.location,
    coordinates,
    timeZone: "Europe/Stockholm",
    email,
    socialLinks,
  };
}
