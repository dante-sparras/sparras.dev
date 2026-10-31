import Image from "next/image";
import type { Skill } from "@/content/skills";

/** Always names the skill: a logo alone is unreadable at this size. */
export function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <li className="inline-flex h-6 items-center gap-1.5 rounded-full border bg-background px-2 font-mono text-muted-foreground text-xs">
      <Image
        src={skill.iconSrc}
        alt=""
        width={14}
        height={14}
        className="size-3.5 object-contain"
      />
      {skill.name}
    </li>
  );
}
