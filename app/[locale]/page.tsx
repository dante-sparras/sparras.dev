import { HeroSection } from "@/components/hero-section";
import { ProfileDetails } from "@/components/profile-details";
import { SiteMain } from "@/components/site-main";
import { getDictionary, requireLocale, type LocaleParams } from "@/lib/i18n";

export default async function HomePage({ params }: LocaleParams) {
  const locale = await requireLocale(params);
  const { home } = getDictionary(locale);

  return (
    <SiteMain>
      <HeroSection hero={home.hero} />
      <ProfileDetails details={home.details} />
    </SiteMain>
  );
}
