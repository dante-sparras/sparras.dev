import { HeroSection } from "@/components/hero-section";
import { ProfileDetails } from "@/components/profile-details";
import { getDictionary, requireLocale, type LocaleParams } from "@/lib/i18n";

export default async function HomePage({ params }: LocaleParams) {
  const locale = await requireLocale(params);
  const { home } = getDictionary(locale);

  return (
    <>
      <HeroSection hero={home.hero} />
      <ProfileDetails details={home.details} />
    </>
  );
}
