import type { Href, ImageSrc } from "@/content/types";

export type SocialLink = {
  platform: string;
  label: string;
  href: Href;
  iconSrc: ImageSrc;
};

const company: { name: string; href: Href } = {
  name: "Casuology",
  href: "https://casuology.com",
};

const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    label: "github.com/dante-sparras",
    href: "https://github.com/dante-sparras",
    iconSrc: "/icons/github.svg",
  },
  {
    platform: "X",
    label: "x.com/DanteSparras",
    href: "https://x.com/DanteSparras",
    iconSrc: "/icons/x.svg",
  },
  {
    platform: "LinkedIn",
    label: "linkedin.com/in/dante-sparras",
    href: "https://www.linkedin.com/in/dante-sparras/",
    iconSrc: "/icons/linkedin.svg",
  },
];

export const profile = {
  name: "Dante Sparrås",
  role: "Full-stack Developer",
  summary: "Full-stack developer specializing in web and game development.",
  bio: "I'm a Full-stack developer specializing in web and game development. Both artistic and technical, I blend strong design sensibility with deep technical expertise. My core strengths include writing clean and readable code, designing robust architecture, building modular and scalable systems, understanding low-level mechanics, and delivering exceptional developer and user experiences (DX + UX). I'm driven to create elegant, high-performance solutions that scale seamlessly.",
  avatar: {
    src: "/avatar/profile.png",
    alt: "Picture of Dante Sparrås",
  },
  company,
  focus: "Building games",
  location: "Norrköping, Sweden",
  timeZone: "Europe/Stockholm",
  socialLinks,
};
