"use client";

import { Download, Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/i18n/locale";
import { type ResumeTheme, resumeThemes } from "@/lib/resume-theme";
import { cn } from "@/lib/utils";

const themeIcons = { dark: Moon, light: Sun } satisfies Record<
  ResumeTheme,
  typeof Moon
>;

export function ResumeDownload({
  lang,
  label,
  fileName,
  themeLabels,
}: {
  lang: Locale;
  label: string;
  /** Without the extension; each theme adds its own suffix. */
  fileName: string;
  themeLabels: Record<ResumeTheme, string>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "cursor-pointer",
        )}
      >
        <Download aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={label} className="w-auto">
        {resumeThemes.map((theme) => {
          const Icon = themeIcons[theme];

          return (
            <DropdownMenuItem
              key={theme}
              className="cursor-pointer whitespace-nowrap"
              render={
                <a
                  href={`/${lang}/resume/${theme}`}
                  download={`${fileName}-${theme}.pdf`}
                >
                  <Icon aria-hidden />
                  {themeLabels[theme]}
                </a>
              }
            />
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
