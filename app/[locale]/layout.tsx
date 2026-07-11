import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import {
  getSiteMetadata,
  isLocale,
  locales,
  type LocaleParams,
} from "@/lib/i18n";

type Props = LocaleParams & {
  children: React.ReactNode;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return getSiteMetadata(locale);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <Navbar locale={locale} />
      {/* Content column: max-w-3xl, side borders, horizontal padding (aligns with navbar). */}
      <div className="flex min-h-0 flex-1 flex-col px-6">
        <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col border-x border-border">
          {children}
        </main>
      </div>
    </div>
  );
}
