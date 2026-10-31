import type { Locale } from "@/i18n/locale";
import type { ResumeTheme } from "@/lib/resume-theme";
import type { WeatherCondition } from "@/lib/weather";

type Messages = {
  mainNavigation: string;
  profileDetails: string;
  socialLinks: string;
  language: string;
  showMore: string;
  showLess: string;
  showAllProjects: (count: number) => string;
  current: string;
  website: string;
  additionalRoles: (count: number) => string;
  downloadResume: string;
  resumeThemes: Record<ResumeTheme, string>;
  resume: {
    title: string;
    fileName: string;
    contact: string;
    work: string;
    education: string;
    contributions: string;
    projects: string;
    skills: string;
  };
  localTime: string;
  temperatureUnit: string;
  celsius: string;
  fahrenheit: string;
  timeFormat: string;
  hour24: string;
  hour12: string;
  weather: Record<WeatherCondition, string>;
  bannerAlt: string;
  logoAlt: (platform: string) => string;
};

export const messages: Record<Locale, Messages> = {
  en: {
    mainNavigation: "Main navigation",
    profileDetails: "Profile details",
    socialLinks: "Social links",
    language: "Language",
    showMore: "Show More",
    showLess: "Show Less",
    showAllProjects: (count) => `Show all projects (${count})`,
    current: "Current",
    website: "Website",
    additionalRoles: (count) =>
      `${count} more ${count === 1 ? "role" : "roles"}`,
    downloadResume: "Download resume",
    resumeThemes: { dark: "Dark", light: "Light (for printing)" },
    resume: {
      title: "Resume",
      fileName: "Dante-Sparras-Resume",
      contact: "Contact",
      work: "Work Experience",
      education: "Education",
      contributions: "Other Experience",
      projects: "Projects",
      skills: "Skills",
    },
    localTime: "Local time",
    temperatureUnit: "Temperature unit",
    celsius: "Celsius (°C)",
    fahrenheit: "Fahrenheit (°F)",
    timeFormat: "Time format",
    hour24: "24-hour",
    hour12: "12-hour (AM/PM)",
    weather: {
      clear: "clear",
      partlyCloudy: "partly cloudy",
      cloudy: "cloudy",
      fog: "fog",
      drizzle: "drizzle",
      rain: "rain",
      snow: "snow",
      thunderstorm: "thunderstorm",
    },
    bannerAlt: "Pixel black hole accretion disk",
    logoAlt: (platform) => `${platform} Logo`,
  },
  sv: {
    mainNavigation: "Huvudnavigering",
    profileDetails: "Profiluppgifter",
    socialLinks: "Sociala länkar",
    language: "Språk",
    showMore: "Visa mer",
    showLess: "Visa mindre",
    showAllProjects: (count) => `Visa alla projekt (${count})`,
    current: "Pågående",
    website: "Webbplats",
    additionalRoles: (count) =>
      `${count} ytterligare ${count === 1 ? "roll" : "roller"}`,
    downloadResume: "Ladda ner CV",
    resumeThemes: { dark: "Mörk", light: "Ljus (för utskrift)" },
    resume: {
      title: "CV",
      fileName: "Dante-Sparras-CV",
      contact: "Kontakt",
      work: "Arbetslivserfarenhet",
      education: "Utbildning",
      contributions: "Övrig erfarenhet",
      projects: "Projekt",
      skills: "Färdigheter",
    },
    localTime: "Lokal tid",
    temperatureUnit: "Temperaturenhet",
    celsius: "Celsius (°C)",
    fahrenheit: "Fahrenheit (°F)",
    timeFormat: "Tidsformat",
    hour24: "24-timmars",
    hour12: "12-timmars (AM/PM)",
    weather: {
      clear: "klart",
      partlyCloudy: "halvklart",
      cloudy: "mulet",
      fog: "dimma",
      drizzle: "duggregn",
      rain: "regn",
      snow: "snö",
      thunderstorm: "åska",
    },
    bannerAlt: "Pixelkonst av ett svart håls ackretionsskiva",
    logoAlt: (platform) => `${platform}-logotyp`,
  },
};

export function getMessages(locale: Locale) {
  return messages[locale];
}
