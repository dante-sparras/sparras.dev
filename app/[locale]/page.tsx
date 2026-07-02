import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const { home } = getDictionary(raw);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeSwitcher locale={raw} />
        <LanguageSwitcher locale={raw} />
      </div>
      <main className="flex max-w-lg flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{home.title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {home.description}
        </p>
      </main>
    </div>
  );
}
