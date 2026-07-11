import { SiteMain } from "@/components/site-main";

type PageIntroProps = {
  title: string;
  description: string;
};

/** Placeholder intro for section pages (about / work / resume / contact). */
export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <SiteMain className="px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        {description}
      </p>
    </SiteMain>
  );
}
