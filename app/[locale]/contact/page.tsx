import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageIntro } from "@/components/page-intro";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const { pages } = getDictionary(raw);
  return { title: pages.contact.title };
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const { pages } = getDictionary(raw);
  return (
    <PageIntro
      title={pages.contact.title}
      description={pages.contact.description}
    />
  );
}
