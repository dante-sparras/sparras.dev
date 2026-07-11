import { ProfileHero } from "@/components/profile-hero";
import { SiteMain } from "@/components/site-main";
import { getDictionary, requireLocale, type LocaleParams } from "@/lib/i18n";
import { getNorrkopingWeather } from "@/lib/weather/norrkoping";

export default async function HomePage({ params }: LocaleParams) {
  const locale = await requireLocale(params);
  const { home } = getDictionary(locale);
  const weather = await getNorrkopingWeather();

  return (
    <SiteMain>
      <ProfileHero
        hero={home.hero}
        temperatureC={weather?.temperatureC ?? null}
      />
    </SiteMain>
  );
}
