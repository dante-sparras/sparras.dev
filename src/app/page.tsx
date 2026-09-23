import type Image from "next/image";
import type Link from "next/link";
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
import { cn } from "@/lib/utils";

//#region DATA

const name: string = "Dante Sparrås";
const role: string = "Full-stack Developer";
const aboutMe: string = `I'm a Full-stack developer specializing in web and game development. Both artistic and technical, I blend strong design sensibility with deep technical expertise. My core strengths include writing clean and readable code, designing robust architecture, building modular and scalable systems, understanding low-level mechanics, and delivering exceptional developer and user experiences (DX + UX). I'm driven to create elegant, high-performance solutions that scale seamlessly.`;

const skills: {
  tooltipContent: string;
  src: React.ComponentProps<typeof Image>["src"];
  href: React.ComponentProps<typeof Link>["href"];
}[] = [
  {
    tooltipContent: "Next.js",
    src: "/icons/nextjs.svg",
    href: "https://nextjs.org/",
  },
  {
    tooltipContent: "shadcn/ui",
    src: "/icons/shadcn-ui.svg",
    href: "https://ui.shadcn.com/",
  },
  {
    tooltipContent: "TailwindCSS",
    src: "/icons/tailwindcss.svg",
    href: "https://tailwindcss.com/",
  },
  {
    tooltipContent: "Convex",
    src: "/icons/convex.svg",
    href: "https://www.convex.dev/",
  },
  {
    tooltipContent: "React",
    src: "/icons/react.svg",
    href: "https://react.dev/",
  },
  { tooltipContent: "Bun", src: "/icons/bun.svg", href: "https://bun.com/" },
  {
    tooltipContent: "Node.js",
    src: "/icons/nodejs.svg",
    href: "https://nodejs.org/en",
  },
  {
    tooltipContent: "Unity",
    src: "/icons/unity.svg",
    href: "https://unity.com/",
  },
  {
    tooltipContent: "C#",
    src: "/icons/c-sharp.svg",
    href: "https://learn.microsoft.com/en-us/dotnet/csharp/",
  },
  {
    tooltipContent: "TypeScript",
    src: "/icons/typescript.svg",
    href: "https://www.typescriptlang.org/",
  },
  {
    tooltipContent: "JavaScript",
    src: "/icons/javascript.svg",
    href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    tooltipContent: "CSS",
    src: "/icons/css.svg",
    href: "https://developer.mozilla.org/en-US/docs/Web/CSS",
  },
  {
    tooltipContent: "HTML5",
    src: "/icons/html5.svg",
    href: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  },
  {
    tooltipContent: "C++",
    src: "/icons/c-plus-plus.svg",
    href: "https://learn.microsoft.com/en-us/cpp/cpp/?view=msvc-170",
  },
  {
    tooltipContent: "Git",
    src: "/icons/git.svg",
    href: "https://git-scm.com/",
  },
  {
    tooltipContent: "GitHub",
    src: "/icons/github.svg",
    href: "https://github.com/",
  },
  {
    tooltipContent: "Visual Studio Code",
    src: "/icons/vscode.svg",
    href: "https://code.visualstudio.com/",
  },
  {
    tooltipContent: "Visual Studio",
    src: "/icons/visual-studio.svg",
    href: "https://visualstudio.microsoft.com/",
  },
];

const projects: {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}[] = [
  {
    title: "sparras.dev",
    description:
      "My personal website built with Next.js, Tailwind CSS, and shadcn/ui.",
    href: "https://github.com/dante-sparras/sparras.dev",
  },
];

const references: {
  name: string;
  initials: string;
  avatarSrc: string;
  companyLogoSrc: string;
  workplace?: string;
  quote?: string;
}[] = [
  {
    name: "Sebastian Aarnio",
    initials: "SA",
    avatarSrc: "/sebastian-aarnio.png",
    companyLogoSrc: "/spacexai-logo.jpg",
    workplace: "Software Engineer @ SpaceXAI",
  },
  {
    name: "Olie Aarnio",
    initials: "OA",
    avatarSrc: "/olie-aarnio.png",
    companyLogoSrc: "/casuology-logo.jpg",
    workplace: "Game Content Writer / Narrative Designer @ Casuology",
  },
  {
    name: "Henry Brandt",
    initials: "HB",
    avatarSrc: "/henry-brandt.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: "Student @ YH Akademin",
  },
  {
    name: "Robert Johansson",
    initials: "RJ",
    avatarSrc: "/robert-johansson.png",
    companyLogoSrc: "/yh-akademin-logo.jpg",
    workplace: "Student @ YH Akademin",
  },
];

const blogPosts: {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}[] = [];

//#endregion

function StripedDivider({ className }: { className?: string }) {
  return <div className={cn("h-4 border-y bg-stripes", className)} />;
}

function SkillGrid({ skills: items }: { skills: typeof skills }) {
  return (
    <ul className="grid grid-cols-5 gap-4 px-6 py-4 sm:grid-cols-8 md:grid-cols-10">
      {items.map(({ tooltipContent, src, href }) => (
        <Tooltip key={tooltipContent}>
          <TooltipTrigger
            render={
              <li>
                <SkillTile href={href} src={src} label={tooltipContent} />
              </li>
            }
          />
          <TooltipContent>{tooltipContent}</TooltipContent>
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
                {name}
              </H2>
              <Muted className="whitespace-nowrap text-xs sm:text-sm">
                {role}
              </Muted>
            </div>
          </div>
        </div>
      </header>
      <StripedDivider />
      <ProfileOverview />
      <section aria-labelledby="about-heading">
        <P className="text-balance px-6 py-5">{aboutMe}</P>
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
      <BlogSection blogPosts={blogPosts} />
      <StripedDivider />
    </>
  );
}
