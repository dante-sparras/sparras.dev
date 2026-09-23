import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { BlackHoleBanner } from "@/components/black-hole-banner";
import { LinkCardGrid } from "@/components/link-card-grid";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileOverview } from "@/components/profile-overview";
import { ReferencesMarquee } from "@/components/references-marquee";
import { Section } from "@/components/section";
import { SkillGrid } from "@/components/skill-grid";
import { StripedDivider } from "@/components/striped-divider";
import { H2 } from "@/components/typography/h2";
import { Muted } from "@/components/typography/muted";
import { P } from "@/components/typography/p";
import { getSections, type SectionId } from "@/content/outline";
import { posts } from "@/content/posts";
import { getProfile } from "@/content/profile";
import { getProjects } from "@/content/projects";
import { getReferences } from "@/content/references";
import { skills } from "@/content/skills";
import { isLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const profile = getProfile(lang);
  const messages = getMessages(lang);
  const sections = getSections(lang);
  const sectionContent: Record<SectionId, ReactNode> = {
    references: <ReferencesMarquee references={getReferences(lang)} />,
    skills: <SkillGrid skills={skills} />,
    projects: (
      <LinkCardGrid
        items={getProjects(lang)}
        showLessLabel={messages.showLess}
        showMoreLabel={messages.showMore}
      />
    ),
    blog: (
      <LinkCardGrid
        items={posts}
        showLessLabel={messages.showLess}
        showMoreLabel={messages.showMore}
      />
    ),
  };

  return (
    <>
      <header className="relative">
        <div className="relative">
          <BlackHoleBanner alt={messages.bannerAlt} />
          <div className="pointer-events-none absolute bottom-0 left-4 z-10 flex items-end gap-2 pb-3 sm:left-6 sm:gap-4">
            <ProfileAvatar
              alt={profile.avatar.alt}
              className="pointer-events-auto size-28 sm:size-38"
              src={profile.avatar.src}
            />
            <div className="flex min-w-0 flex-col gap-1.5 pb-1">
              <H2 className="whitespace-nowrap font-normal font-pixel text-xl leading-none sm:text-3xl">
                {profile.name}
              </H2>
              <Muted className="whitespace-nowrap text-xs sm:text-sm">
                {profile.role}
              </Muted>
            </div>
          </div>
        </div>
      </header>
      <StripedDivider />
      <ProfileOverview locale={lang} />
      <P className="text-balance px-6 py-5">{profile.bio}</P>
      <StripedDivider />
      {sections.map((entry) => (
        <Fragment key={entry.id}>
          <Section entry={entry}>{sectionContent[entry.id]}</Section>
          <StripedDivider />
        </Fragment>
      ))}
    </>
  );
}
