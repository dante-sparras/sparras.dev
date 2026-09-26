import { SkillTile } from "@/components/skill-tile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SkillGroup } from "@/content/skills";

export function SkillGrid({ groups }: { groups: SkillGroup[] }) {
  return (
    <div>
      {groups.map((group) => (
        <div key={group.id}>
          <h4 className="border-b px-6 py-3 font-medium text-muted-foreground text-sm">
            {group.title}
          </h4>
          <ul className="grid grid-cols-5 gap-4 px-6 py-4 sm:grid-cols-8 md:grid-cols-10">
            {group.skills.map(({ name, iconSrc, href }) => (
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
        </div>
      ))}
    </div>
  );
}
