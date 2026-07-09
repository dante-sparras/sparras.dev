import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { profileMedia } from "@/lib/media/profile";
import { ProfileHero } from "@/components/profile-hero";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const { home } = getDictionary(raw);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col border-x border-border">
        <ProfileHero
          name={home.hero.name}
          handle={home.hero.handle}
          bannerSrc={profileMedia.banner}
          avatarSrc={profileMedia.avatar}
          bannerAlt={home.hero.bannerAlt}
          avatarAlt={home.hero.avatarAlt}
        />
      </main>
    </div>
  );
}
