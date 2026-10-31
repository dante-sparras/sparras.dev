"use client";

import { ChevronDown, Download, Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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

/** Prints well and suits an application, so it is the one-click download. */
const defaultTheme: ResumeTheme = "light";

/** White instead of the theme's blue `primary`: the page is monochrome. */
const buttonColors = "bg-foreground text-background hover:bg-foreground/80";

export function ResumeDownload({
  lang,
  buttonLabel,
  label,
  menuLabel,
  fileName,
  themeLabels,
}: {
  lang: Locale;
  /** Short enough for the nav. */
  buttonLabel: string;
  /** Says what the button does, for screen readers and as a tooltip. */
  label: string;
  menuLabel: string;
  /** Without the extension; each theme adds its own suffix. */
  fileName: string;
  themeLabels: Record<ResumeTheme, string>;
}) {
  const resumeHref = (theme: ResumeTheme) => `/${lang}/resume/${theme}`;
  const resumeFile = (theme: ResumeTheme) => `${fileName}-${theme}.pdf`;

  return (
    <ButtonGroup>
      <a
        href={resumeHref(defaultTheme)}
        download={resumeFile(defaultTheme)}
        aria-label={label}
        title={label}
        data-slot="button"
        className={cn(
          buttonVariants({ variant: null, size: "lg" }),
          buttonColors,
        )}
      >
        <Download aria-hidden />
        {buttonLabel}
      </a>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={menuLabel}
          title={menuLabel}
          className={cn(
            buttonVariants({ variant: null, size: "icon-lg" }),
            buttonColors,
            "cursor-pointer",
          )}
        >
          <ChevronDown aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          aria-label={menuLabel}
          className="w-auto"
        >
          {resumeThemes.map((theme) => {
            const Icon = themeIcons[theme];

            return (
              <DropdownMenuItem
                key={theme}
                className="cursor-pointer whitespace-nowrap"
                render={
                  <a href={resumeHref(theme)} download={resumeFile(theme)}>
                    <Icon aria-hidden />
                    {themeLabels[theme]}
                  </a>
                }
              />
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
