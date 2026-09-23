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
import { type SectionId, sections } from "@/content/outline";
import { posts } from "@/content/posts";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { references } from "@/content/references";
import { skills } from "@/content/skills";

const sectionContent: Record<SectionId, ReactNode> = {
  references: <ReferencesMarquee references={references} />,
  skills: <SkillGrid skills={skills} />,
  projects: <LinkCardGrid items={projects} />,
  blog: <LinkCardGrid items={posts} />,
};

export default function Home() {
  return (
    <>
      <header className="relative">
        <div className="relative">
          <BlackHoleBanner />
          <div className="pointer-events-none absolute bottom-0 left-4 z-10 flex items-end gap-2 pb-3 sm:left-6 sm:gap-4">
            <ProfileAvatar className="pointer-events-auto size-28 sm:size-38" />
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
      <ProfileOverview />
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
