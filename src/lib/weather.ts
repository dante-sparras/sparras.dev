export type WeatherCondition =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type CurrentWeather = {
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
};

export type Coordinates = { latitude: number; longitude: number };

const REVALIDATE_SECONDS = 900;

/** Groups WMO weather interpretation codes (used by Open-Meteo). */
export function weatherCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partlyCloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "cloudy";
}

export function formatTemperature(celsius: number) {
  return `${Math.round(celsius) || 0}°C`;
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: unknown;
    weather_code?: unknown;
    is_day?: unknown;
  };
};

export async function getCurrentWeather({
  latitude,
  longitude,
}: Coordinates): Promise<CurrentWeather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;

    const { current } = (await response.json()) as OpenMeteoResponse;
    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      return null;
    }

    return {
      temperature: current.temperature_2m,
      condition: weatherCondition(current.weather_code),
      isDay: current.is_day !== 0,
    };
  } catch {
    return null;
  }
}
