import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const { home } = getDictionary(raw);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col items-center justify-center gap-4 border-x border-border px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{home.title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {home.description}
        </p>
      </main>
    </div>
  );
}
