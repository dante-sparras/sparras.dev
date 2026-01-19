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
const projects = [
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
const blogPosts = [
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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col">
        <div className="relative h-52 w-full border-border border-b">
          <GameOfLifeCanvas
            speed={100}
            showGrid
            targetCellSize={15}
            backgroundColorVar="--background"
            cellColorVar="--foreground"
            className="opacity-25"
            fadeIntensity={0.9}
            stagnationThreshold={5}
          />
        </div>
        <div className="-translate-y-2/3 absolute top-52 z-10 ml-6 flex w-fit overflow-hidden rounded-full border border-border bg-background">
          <Image
            src="/portrait.webp"
            alt="Picture of Dante Sparrås"
            width={152}
            height={152}
            className="pointer-events-none"
            priority
          />
        </div>
        <div className="h-16 bg-stripes" />
        <div className="*:py-2 *:pl-6">
          <H2 className="flex items-center border-border border-y">
            Dante Sparrås
          </H2>
          <Muted className="border-border border-b">
            Frontend & .NET Developer
          </Muted>
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 py-8">
        <H3>About</H3>
        <P className="text-muted-foreground">
          I&apos;m a passionate developer focused on building modern web
          applications and mobile experiences. With expertise in frontend
          technologies and .NET backend development, I create scalable and
          user-friendly solutions.
        </P>
      </section>

      {/* Tech Stack Section */}
      <section className="border-border border-t px-6 py-8">
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

      {/* Projects Section */}
      <section className="border-border border-t px-6 py-8">
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

      {/* Blog Section */}
      <section className="border-border border-t px-6 py-8">
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
