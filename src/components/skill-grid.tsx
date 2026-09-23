import { SkillTile } from "@/components/skill-tile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Skill } from "@/content/skills";

export function SkillGrid({ skills }: { skills: Skill[] }) {
  return (
    <ul className="grid grid-cols-5 gap-4 px-6 py-4 sm:grid-cols-8 md:grid-cols-10">
      {skills.map(({ name, iconSrc, href }) => (
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
