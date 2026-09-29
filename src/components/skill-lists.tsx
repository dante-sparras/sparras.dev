import Image from "next/image";
import Link from "next/link";
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
    <div className="divide-y">
      {categories.map((category) => {
        const headingId = `skills-${category.id}`;

        return (
          <section
            key={category.id}
            aria-labelledby={headingId}
            className="grid grid-cols-1 sm:grid-cols-[12rem_1fr]"
          >
            <h4
              id={headingId}
              className="px-6 pt-4 pb-1 text-sm sm:border-r sm:py-5"
            >
              {category.title}
            </h4>
            <ul className="flex flex-wrap gap-2 px-6 pt-2 pb-4 sm:py-4">
              {category.skills.map((skill) => (
                <li key={skill.name}>
                  <Link
                    href={skill.href}
                    className="group inline-flex h-7 items-center gap-1.5 rounded-full border bg-background px-2.5 font-mono text-[0.8125rem] text-foreground transition-colors outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1"
                  >
                    <Image
                      src={skill.iconSrc}
                      alt=""
                      width={14}
                      height={14}
                      className="size-3.5 object-contain opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
                    />
                    {skill.name}
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
