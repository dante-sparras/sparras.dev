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
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
