import {
  Code2,
  Database,
  FileCode2,
  Globe,
  Layers,
  Server,
  Smartphone,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GitHubCalendar } from "react-github-calendar";
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

// Tech stack data with placeholder icons
const techStack = [
  { name: "React", icon: Code2 },
  { name: "Next.js", icon: Globe },
  { name: "TypeScript", icon: FileCode2 },
  { name: ".NET", icon: Server },
  { name: "Node.js", icon: Terminal },
  { name: "SQL", icon: Database },
  { name: "Tailwind", icon: Layers },
  { name: "React Native", icon: Smartphone },
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

export default function Home() {
  return (
    <div className="flex flex-col *:after:block *:after:h-8 *:after:border-border *:after:border-y *:after:bg-stripes *:after:content-['']">
      <section aria-labelledby="hero-heading">
        <div className="relative after:block after:h-14 after:border-border after:border-y after:bg-stripes after:content-['']">
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
            className="-translate-y-3/4 pointer-events-none absolute top-52 ml-6 rounded-full border"
            priority
          />
        </div>
        <div className="divide-y *:py-3 *:pl-6">
          <H2>Dante Sparrås</H2>
          <Muted>Frontend & .NET Developer</Muted>
        </div>
      </section>

      <section aria-labelledby="about-heading">
        <P className="px-6 py-5 leading-relaxed">
          I&apos;m a passionate developer focused on building modern web
          applications and mobile experiences. With expertise in frontend
          technologies and .NET backend development, I create scalable and
          user-friendly solutions.
        </P>
      </section>

      <section aria-labelledby="github-calendar-heading">
        <div className="relative flex items-center justify-center px-6 py-5">
          <GitHubCalendar
            username="dante-sparras"
            weekStart={1}
            blockSize={9.35}
          />
        </div>
      </section>

      <section aria-labelledby="tech-stack-heading">
        <H3 className="mb-6">Tech Stack</H3>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted"
            >
              <tech.icon className="h-8 w-8 text-muted-foreground" />
              <span className="text-center text-muted-foreground text-xs">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="projects-heading" className="py-8">
        <H3 className="mb-6">Projects</H3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <section aria-labelledby="blog-heading" className="py-8">
        <H3 className="mb-6">Blog</H3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
