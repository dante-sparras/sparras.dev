import { siteProfile } from "@/lib/site/profile";

export type WeatherSnapshot = {
  temperatureC: number;
};

/**
 * Current temperature in Norrköping via Open-Meteo (no API key).
 * Fails soft — callers hide the weather row when null.
 */
export async function getNorrkopingWeather(): Promise<WeatherSnapshot | null> {
  try {
    const { latitude, longitude } = siteProfile.weather;
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m");
    url.searchParams.set("timezone", "Europe/Stockholm");

    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current?: { temperature_2m?: number };
    };
    const temperatureC = data.current?.temperature_2m;
    if (typeof temperatureC !== "number" || Number.isNaN(temperatureC)) {
      return null;
    }
    return { temperatureC: Math.round(temperatureC) };
  } catch {
    return null;
  }
}
