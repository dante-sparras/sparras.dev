import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Bio } from "@/components/bio";
import { BlackHoleBanner } from "@/components/black-hole-banner";
import { ExperienceList } from "@/components/experience-list";
import { LinkCardGrid } from "@/components/link-card-grid";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  ProfileOverview,
  SocialLinkBadges,
} from "@/components/profile-overview";
import { ProjectList } from "@/components/project-list";
import { ReferencesSection } from "@/components/references-marquee";
import { ResumeDownload } from "@/components/resume-download";
import { Section } from "@/components/section";
import { SkillLists } from "@/components/skill-lists";
import { Muted } from "@/components/typography/muted";
import { P } from "@/components/typography/p";
import { buttonVariants } from "@/components/ui/button";
import { getExperience } from "@/content/experience";
import { getSections, type SectionId } from "@/content/outline";
import { posts } from "@/content/posts";
import { getProfile } from "@/content/profile";
import { getProjects } from "@/content/projects";
import { getReferences } from "@/content/references";
import { getSkillCategories } from "@/content/skills";
import { isLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";

/**
 * Regenerate every 15 minutes. Experience's "Current" labels and durations
 * depend on today's date, so the page must not stay frozen at build time.
 */
export const revalidate = 900;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const profile = getProfile(lang);
  const messages = getMessages(lang);
  const sections = getSections(lang);
  const projects = getProjects(lang);
  const sectionContent: Record<Exclude<SectionId, "references">, ReactNode> = {
    experience: (
      <ExperienceList
        currentLabel={messages.current}
        entries={getExperience(lang)}
        websiteLabel={messages.website}
        additionalRolesLabel={messages.additionalRoles}
      />
    ),
    skills: <SkillLists categories={getSkillCategories(lang)} />,
    projects: (
      <ProjectList
        projects={projects}
        showLessLabel={messages.showLess}
        showAllLabel={messages.showAllProjects(projects.length)}
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
      <header className="border-b-bleed">
        <div className="relative">
          <BlackHoleBanner alt={messages.bannerAlt} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-[radial-gradient(ellipse_50%_60%_at_25%_100%,rgb(0_0_0/0.85)_30%,transparent)]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end">
            <div className="pointer-events-auto border-t border-r">
              <ProfileAvatar
                alt={profile.avatar.alt}
                className="size-28 sm:size-38"
                src={profile.avatar.src}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 border-t pt-2 pb-2">
              {/* Pronouns drop below the name when the row is too narrow. */}
              <h1 className="flex scroll-m-20 flex-wrap items-baseline gap-x-2 gap-y-1 border-b px-3 pb-2 font-pixel text-xl leading-none sm:text-3xl">
                <span className="whitespace-nowrap">{profile.name}</span>
                <span className="whitespace-nowrap font-sans text-muted-foreground text-xs sm:text-sm">
                  {profile.pronouns}
                </span>
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3">
                <Muted className="whitespace-nowrap text-xs sm:text-sm">
                  {profile.role}
                </Muted>
                <SocialLinkBadges locale={lang} />
              </div>
            </div>
          </div>
        </div>
      </header>
      <section
        aria-label={messages.availability}
        className="flex flex-col gap-4 border-b-bleed px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-pretty font-semibold text-base">
            {profile.availability.title}
          </p>
          <Muted className="mt-1 text-pretty">
            {profile.availability.dates}
          </Muted>
          <Muted className="text-pretty">
            {profile.availability.workplace}
          </Muted>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ResumeDownload
            lang={lang}
            label={messages.downloadResume}
            menuLabel={messages.chooseResumeTheme}
            fileName={messages.resume.fileName}
            themeLabels={messages.resumeThemes}
          />
          <Link
            href={`mailto:${profile.email}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {messages.contactMe}
          </Link>
        </div>
      </section>
      <ProfileOverview locale={lang} />
      <P className="text-pretty border-b-bleed px-6 py-6 text-base leading-7">
        <Bio parts={profile.bio} />
      </P>
      {sections.map(({ id, title }) =>
        id === "references" ? (
          <ReferencesSection
            key={id}
            entry={{ id, title }}
            references={getReferences(lang)}
            pauseLabel={messages.pauseReferences}
            playLabel={messages.playReferences}
          />
        ) : (
          <Section key={id} entry={{ id, title }}>
            {sectionContent[id]}
          </Section>
        ),
      )}
    </>
  );
}
