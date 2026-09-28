import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/content/skills";

export type SkillListCategory = {
  id: string;
  title: string;
  skills: readonly Skill[];
};

export function SkillLists({
  categories,
}: {
  categories: readonly SkillListCategory[];
}) {
  return (
    <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:grid-cols-2 md:grid-cols-3">
      {categories.map((category) => {
        const headingId = `skills-${category.id}`;

        return (
          <section key={category.id} aria-labelledby={headingId}>
            <h4 id={headingId} className="mb-3 font-medium text-sm">
              {category.title}
            </h4>
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-primary">
              {category.skills.map((skill) => (
                <li key={skill.name}>
                  <Link
                    href={skill.href}
                    className="group inline-flex items-center gap-2 text-sm"
                  >
                    <span className="underline-offset-4 group-hover:underline">
                      {skill.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="size-5 rounded-sm p-0.5"
                    >
                      <Image
                        src={skill.iconSrc}
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 object-contain"
                      />
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
