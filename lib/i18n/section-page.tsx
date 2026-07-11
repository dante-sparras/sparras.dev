import type { Metadata } from "next";
import type { Dictionary } from "./dictionaries/types";
import { getPageCopy, pageTitleMetadata, type LocaleParams } from "./locale";

type PageKey = keyof Dictionary["pages"];

/**
 * Factory for static locale section pages (about / work / resume / contact).
 * Keeps route files one-liners without duplicating metadata + title wiring.
 */
export function createSectionPage(key: PageKey) {
  async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
    return pageTitleMetadata(params, key);
  }

  async function Page({ params }: LocaleParams) {
    const page = await getPageCopy(params, key);
    return (
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {page.description}
        </p>
      </header>
    );
  }

  return { generateMetadata, Page };
}
