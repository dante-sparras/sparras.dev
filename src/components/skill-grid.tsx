import { SkillTile } from "@/components/skill-tile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SkillCategory } from "@/content/skills";

export function SkillGrid({
  categories,
}: {
  categories: readonly SkillCategory[];
}) {
  return (
    <div>
      {categories.map((category) => {
        const headingId = `skills-${category.id}-heading`;

        return (
          <section
            key={category.id}
            aria-labelledby={headingId}
            className="border-t first:border-t-0"
          >
            <h4
              id={headingId}
              className="px-6 pt-4 font-medium text-sm tracking-tight"
            >
              {category.title}
            </h4>
            <ul className="grid grid-cols-5 gap-4 px-6 pt-3 pb-4 sm:grid-cols-8 md:grid-cols-10">
              {category.skills.map(({ name, iconSrc, href }) => (
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
          </section>
        );
      })}
    </div>
  );
}
