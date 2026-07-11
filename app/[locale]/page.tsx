import { ProfileHero } from "@/components/hero-section";
import { SiteMain } from "@/components/site-main";
import { getDictionary, requireLocale, type LocaleParams } from "@/lib/i18n";

export default async function HomePage({ params }: LocaleParams) {
  const locale = await requireLocale(params);
  const { home } = getDictionary(locale);

  return (
    <SiteMain>
      <ProfileHero hero={home.hero} />
    </SiteMain>
  );
}
