import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type SocialLink = {
  platform: string;
  href: Href;
  iconSrc: ImageSrc;
};

type ProfileCopy = {
  role: string;
  summary: string;
  bio: string;
  avatarAlt: string;
  focus: string;
  location: string;
};

const company: { name: string; href: Href } = {
  name: "Casuology",
  href: "https://casuology.com",
};

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
    bio: "I'm a Full-stack developer specializing in web and game development. Both artistic and technical, I blend strong design sensibility with deep technical expertise. My core strengths include writing clean and readable code, designing robust architecture, building modular and scalable systems, understanding low-level mechanics, and delivering exceptional developer and user experiences (DX + UX). I'm driven to create elegant, high-performance solutions that scale seamlessly.",
    avatarAlt: "Picture of Dante Sparrås",
    focus: "Building games",
    location: "Norrköping, Sweden",
  },
  sv: {
    role: "Fullstackutvecklare",
    summary: "Fullstackutvecklare med inriktning på webb- och spelutveckling.",
    bio: "Jag är fullstackutvecklare med inriktning på webb- och spelutveckling. Både konstnärlig och teknisk, och jag förenar ett starkt formspråk med djup teknisk kompetens. Mina främsta styrkor är att skriva ren och läsbar kod, utforma robust arkitektur, bygga modulära och skalbara system, förstå lågnivåmekanik och leverera en exceptionell upplevelse för både utvecklare och användare (DX + UX). Jag drivs av att skapa eleganta, högpresterande lösningar som skalar sömlöst.",
    avatarAlt: "Bild på Dante Sparrås",
    focus: "Bygger spel",
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
    location: text.location,
    timeZone: "Europe/Stockholm",
    socialLinks,
  };
}
