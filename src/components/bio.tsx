import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { BioPart } from "@/content/profile";
import { skills } from "@/content/skills";

const skillsByName = new Map(skills.map((skill) => [skill.name, skill]));

export function Bio({ parts }: { parts: readonly BioPart[] }) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      // biome-ignore lint/suspicious/noArrayIndexKey: parts are static and never reordered
      return <Fragment key={index}>{part}</Fragment>;
    }

    const skill = skillsByName.get(part.skill);
    if (!skill) throw new Error(`Bio references unknown skill "${part.skill}"`);

    return (
      <Link
        // biome-ignore lint/suspicious/noArrayIndexKey: parts are static and never reordered
        key={index}
        href={skill.href}
        className="inline-flex items-center gap-1 whitespace-nowrap underline-offset-4 hover:underline"
      >
        {part.label ?? skill.name}
        <Image
          src={skill.iconSrc}
          alt=""
          width={16}
          height={16}
          className="size-[0.9em] object-contain opacity-70 grayscale transition group-hover/bio:opacity-100 group-hover/bio:grayscale-0"
        />
      </Link>
    );
  });
}
