import { BlackHoleBanner } from "@/components/black-hole-banner";
import { BlogSection } from "@/components/blog-section";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileOverview } from "@/components/profile-overview";
import { ProjectsSection } from "@/components/projects-section";
import { ReferencesSection } from "@/components/references-section";
import { SkillTile } from "@/components/skill-tile";
import { H2 } from "@/components/typography/h2";
import { H3 } from "@/components/typography/h3";
import { Muted } from "@/components/typography/muted";
import { P } from "@/components/typography/p";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { posts } from "@/content/posts";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { references } from "@/content/references";
import { type Skill, skills } from "@/content/skills";
import { cn } from "@/lib/utils";

function StripedDivider({ className }: { className?: string }) {
  return <div className={cn("h-4 border-y bg-stripes", className)} />;
}

function SkillGrid({ skills: items }: { skills: Skill[] }) {
  return (
    <ul className="grid grid-cols-5 gap-4 px-6 py-4 sm:grid-cols-8 md:grid-cols-10">
      {items.map(({ name, iconSrc, href }) => (
        <Tooltip key={name}>
          <TooltipTrigger
            render={
              <li>
                <SkillTile href={href} src={iconSrc} label={name} />
              </li>
            }
          />
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      ))}
    </ul>
  );
}

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
      <section aria-labelledby="about-heading">
        <P className="text-balance px-6 py-5">{profile.bio}</P>
      </section>
      <StripedDivider />
      <ReferencesSection references={references} />
      <StripedDivider />
      {/** UNCOMMENT LATER THIS YEAR */}
      {/* <section aria-labelledby="github-calendar-heading">
        <div className="relative flex items-center justify-center px-6 py-5">
          <GitHubCalendar
            username="dante-sparras"
            weekStart={1}
            blockSize={9.35}
          />
        </div>
      </section> */}
      <section aria-labelledby="skills-heading">
        <H3 id="skills" className="border-b px-6 py-3">
          Skills
        </H3>
        <SkillGrid skills={skills} />
      </section>
      <StripedDivider />
      <ProjectsSection projects={projects} />
      <StripedDivider />
      <BlogSection blogPosts={posts} />
      <StripedDivider />
    </>
  );
}
