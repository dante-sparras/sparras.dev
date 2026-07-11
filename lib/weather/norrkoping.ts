export type WeatherSnapshot = {
  temperatureC: number;
};

/** Norrköping (Open-Meteo, no API key). Soft-fail → hide weather row. */
const NORRKOPING = {
  latitude: 58.5877,
  longitude: 16.1924,
  timezone: "Europe/Stockholm",
} as const;

export async function getNorrkopingWeather(): Promise<WeatherSnapshot | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(NORRKOPING.latitude));
    url.searchParams.set("longitude", String(NORRKOPING.longitude));
    url.searchParams.set("current", "temperature_2m");
    url.searchParams.set("timezone", NORRKOPING.timezone);

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
