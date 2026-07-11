import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import type { Dictionary } from "./dictionaries/types";
import { getPageCopy, pageTitleMetadata, type LocaleParams } from "./locale";

type PageKey = keyof Dictionary["pages"];

/**
 * Factory for static locale section pages (about / work / resume / contact).
 * Keeps route files one-liners without duplicating metadata + PageIntro wiring.
 */
export function createSectionPage(key: PageKey) {
  async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
    return pageTitleMetadata(params, key);
  }

  async function Page({ params }: LocaleParams) {
    const page = await getPageCopy(params, key);
    return <PageIntro title={page.title} description={page.description} />;
  }

  return { generateMetadata, Page };
}
