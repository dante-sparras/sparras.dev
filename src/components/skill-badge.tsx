import Image from "next/image";
import type { Skill } from "@/content/skills";

/**
 * Only the icon until hovered, then a pill with the name. The surrounding row
 * sets `group`, so focusing it from the keyboard reveals its names. The name
 * stays in the DOM for screen readers.
 */
export function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <li className="group/skill flex h-6 items-center rounded-full border border-transparent px-1.5 transition-colors duration-200 hover:border-border hover:bg-background group-focus-visible:border-border motion-reduce:transition-none">
      <Image
        src={skill.iconSrc}
        alt=""
        width={14}
        height={14}
        className="size-3.5 object-contain opacity-70 transition-opacity group-hover:opacity-100"
      />
      <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 ease-out group-hover/skill:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] motion-reduce:transition-none">
        <span className="min-w-0 overflow-hidden whitespace-nowrap font-mono text-foreground text-xs">
          <span className="pl-1.5">{skill.name}</span>
        </span>
      </span>
    </li>
  );
}
