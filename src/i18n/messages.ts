import type { Locale } from "@/i18n/locale";
import type { WeatherCondition } from "@/lib/weather";

type Messages = {
  mainNavigation: string;
  profileDetails: string;
  socialLinks: string;
  language: string;
  showMore: string;
  showLess: string;
  localTime: string;
  sameTime: string;
  ahead: string;
  behind: string;
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
    localTime: "Local time",
    sameTime: "same time",
    ahead: "ahead",
    behind: "behind",
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
    localTime: "Lokal tid",
    sameTime: "samma tid",
    ahead: "före",
    behind: "efter",
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
