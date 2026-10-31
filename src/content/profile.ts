import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";
import type { Coordinates } from "@/lib/weather";

export type SocialLink = {
  platform: string;
  href: Href;
  iconSrc: ImageSrc;
};

type ProfileCopy = {
  /** The one headline for the site, the page description and the resume. */
  role: string;
  /** Written for search results and shared links, so it names the search. */
  pageTitle: string;
  summary: string;
  availability: {
    title: string;
    dates: string;
    /** For the banner on the homepage, where the full dates don't fit. */
    shortDates: string;
    workplace: string;
  };
  bio: string;
  avatarAlt: string;
  resumeSummary: string;
  languages: string[];
  studies: string;
  location: string;
  pronouns: string;
};

const school: { name: string; href: Href } = {
  name: "YH Akademin",
  href: "https://yh.se",
};

export const siteUrl = "https://www.sparras.dev";

export const timeZone = "Europe/Stockholm";

const email = "contact@sparras.dev";

const phone = {
  display: "+46 73 554 65 93",
  href: "tel:+46735546593" as const,
};

const mapsHref: Href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Norrköping, Sweden")}`;

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
    role: ".NET Developer Student",
    pageTitle: "Dante Sparrås – .NET Developer Student, LIA 2027 in Norrköping",
    summary:
      ".NET developer student at YH Akademin in Norrköping, building Windows tools in C#. Looking for a 24-week LIA internship in 2027, on site or remote.",
    availability: {
      title: "Looking for a 24-week LIA internship",
      dates: "8 March–28 May and 30 August–19 November 2027",
      shortDates: "8 Mar–28 May & 30 Aug–19 Nov 2027",
      workplace: "Norrköping or remote",
    },
    bio: "I'm studying .NET development at YH Akademin. I work across web, desktop and game development. I like following best practices and care about writing clean, performant code, designing thoughtfully and shipping work that holds up. I enjoy working closely with teams and sharing what I learn.",
    avatarAlt: "Picture of Dante Sparrås",
    resumeSummary:
      ".NET developer student at YH Akademin, finishing in December 2027. Looking for a 24-week LIA internship: 8 March–28 May and 30 August–19 November 2027. Based in Norrköping and open to remote work.",
    languages: ["Swedish", "English"],
    studies: "Student",
    location: "Norrköping, Sweden",
    pronouns: "he/him",
  },
  sv: {
    role: "Student, systemutvecklare .NET",
    pageTitle: "Dante Sparrås – systemutvecklare .NET, LIA 2027 i Norrköping",
    summary:
      "Studerar till systemutvecklare .NET på YH Akademin i Norrköping och bygger Windows-verktyg i C#. Söker LIA-plats på 24 veckor 2027, på plats eller på distans.",
    availability: {
      title: "Söker LIA-plats på 24 veckor",
      dates: "8 mars–28 maj och 30 augusti–19 november 2027",
      shortDates: "8 mars–28 maj & 30 aug–19 nov 2027",
      workplace: "Norrköping eller distans",
    },
    bio: "Jag studerar till systemutvecklare .NET på YH Akademin. Jag arbetar med webb-, skrivbords- och spelutveckling. Jag gillar att följa bästa praxis och bryr mig om att skriva ren och effektiv kod, designa omsorgsfullt och leverera arbete som håller. Jag trivs med att arbeta nära andra i team och dela med mig av det jag lär mig.",
    avatarAlt: "Bild på Dante Sparrås",
    resumeSummary:
      "Studerar till systemutvecklare .NET på YH Akademin, med examen i december 2027. Söker en arbetsplats för min LIA på 24 veckor: 8 mars–28 maj och 30 augusti–19 november 2027. Bor i Norrköping och kan även arbeta på distans.",
    languages: ["Svenska", "engelska"],
    studies: "Student",
    location: "Norrköping, Sverige",
    pronouns: "han/honom",
  },
};

export function getProfile(locale: Locale) {
  const text = profileCopy[locale];

  return {
    name: "Dante Sparrås",
    role: text.role,
    pageTitle: text.pageTitle,
    summary: text.summary,
    availability: text.availability,
    bio: text.bio,
    avatar: {
      src: "/avatar/profile.png" satisfies ImageSrc,
      alt: text.avatarAlt,
    },
    resumeSummary: text.resumeSummary,
    languages: text.languages,
    studies: text.studies,
    school,
    location: text.location,
    mapsHref,
    pronouns: text.pronouns,
    coordinates,
    timeZone,
    email,
    phone,
    socialLinks,
  };
}
