import Image from "next/image";
import Link from "next/link";
import GameOfLifeCanvas from "@/components/game-of-life";
import { H2 } from "@/components/typography/h2";
import { H3 } from "@/components/typography/h3";
import { Muted } from "@/components/typography/muted";
import { P } from "@/components/typography/p";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Tech stack data with placeholder icons
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

// Projects data
const projects: {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}[] = [
  {
    title: "Project One",
    description:
      "A full-stack web application built with Next.js and .NET backend.",
    href: "/showcase",
  },
  {
    title: "Project Two",
    description: "Mobile-first responsive design system using Tailwind CSS.",
    href: "/showcase",
  },
  {
    title: "Project Three",
    description: "Real-time data visualization dashboard with TypeScript.",
    href: "/showcase",
  },
];

// Blog posts data
const blogPosts: {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}[] = [
  {
    title: "Getting Started with Next.js",
    description:
      "Learn the basics of Next.js and build your first application.",
    href: "/blog",
  },
  {
    title: "TypeScript Best Practices",
    description:
      "Essential patterns and practices for writing better TypeScript.",
    href: "/blog",
  },
  {
    title: "Building Responsive UIs",
    description: "Mobile-first approach to creating adaptive user interfaces.",
    href: "/blog",
  },
];

function StripedDivider({ className }: { className?: string }) {
  return <div className={cn("h-8 border-y bg-stripes", className)} />;
}

export default function Home() {
  return (
    <>
      <header className="relative">
        <GameOfLifeCanvas
          speed={100}
          showGrid
          targetCellSize={15}
          backgroundColorVar="--background"
          cellColorVar="--foreground"
          fadeIntensity={0.9}
          stagnationThreshold={5}
          className="h-52 opacity-25"
        />
        <Image
          src="/portrait.webp"
          alt="Picture of Dante Sparrås"
          width={152}
          height={152}
          className="-translate-y-3/4 pointer-events-none absolute top-52 left-6 rounded-full border"
          priority
        />
        <StripedDivider className="h-14" />
        <H2 className="border-b py-3 pl-6">Dante Sparrås</H2>
        <Muted className="py-3 pl-6">Full-stack Developer</Muted>
      </header>
      <StripedDivider />
      <section aria-labelledby="about-heading">
        <P className="text-balance px-6 py-5">
          I&apos;m a Full-stack developer specializing in web and game
          development. Both artistic and technical, I blend strong design
          sensibility with deep technical expertise. My core strengths include
          writing clean and readable code, designing robust architecture,
          building modular and scalable systems, understanding low-level
          mechanics, and delivering exceptional developer and user experiences
          (DX + UX). I&apos;m driven to create elegant, high-performance
          solutions that scale seamlessly.
        </P>
      </section>
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
        <H3 className="border-b px-6 py-3">Skills</H3>
        <ul className="grid grid-cols-5 gap-4 px-6 py-6 sm:grid-cols-8 md:grid-cols-10">
          {skills.map(({ tooltipContent, src, href }) => (
            <Tooltip key={tooltipContent}>
              <TooltipTrigger
                render={
                  <li>
                    <Link
                      href={href}
                      className="mx-auto flex size-14 items-center justify-center rounded-md border border-border transition-colors hover:border-blue-500"
                    >
                      <Image
                        src={src}
                        alt={`${tooltipContent} Icon Logo`}
                        width={32}
                        height={32}
                        className="size-8 object-contain"
                      />
                    </Link>
                  </li>
                }
              />
              <TooltipContent>{tooltipContent}</TooltipContent>
            </Tooltip>
          ))}
        </ul>
      </section>
      <StripedDivider />
      <section aria-labelledby="projects-heading">
        <H3 id="projects" className="border-b px-6 py-3">
          Projects
        </H3>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.title} href={project.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <StripedDivider />
      <section aria-labelledby="blog-heading">
        <H3 id="blog" className="border-b px-6 py-3">
          Blog
        </H3>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.title} href={post.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <StripedDivider />
    </>
  );
}
