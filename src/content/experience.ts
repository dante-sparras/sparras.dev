import { timeZone } from "@/content/profile";
import { allSkills } from "@/content/skills";
import type { Href, ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";

export type YearMonth = {
  year: number;
  /** Calendar month from 1 to 12. */
  month: number;
};

export type ExperienceIcon =
  | "briefcase"
  | "gamepad"
  | "graduation"
  | "school"
  | "code"
  | "megaphone"
  | "lightbulb"
  | "award";

type Employment =
  | "full-time"
  | "part-time"
  | "freelance"
  | "contributor"
  | "volunteer";

/** `contribution` is work done without being hired, such as helping out at a studio. */
export type ExperienceKind = "education" | "work" | "contribution";

type ExperienceRoleSource = {
  title: Record<Locale, string>;
  /** Left off for a one-off honor, which is not a kind of employment. */
  employment?: Employment;
  icon: ExperienceIcon;
  start: YearMonth;
  /**
   * Omitted when the position is still open with no planned end.
   * A future month stays open until that month has passed.
   */
  end?: YearMonth;
  /** A single month, such as an award, with no duration. */
  pointInTime?: boolean;
  description: Record<Locale, readonly string[]>;
  /** Names from `skills.ts`. */
  skills: readonly string[];
};

type ExperienceSource = {
  company: string;
  kind: ExperienceKind;
  href?: Href;
  location: Record<Locale, string>;
  icon: ExperienceIcon;
  logoSrc?: ImageSrc;
  roles: readonly ExperienceRoleSource[];
};

const employmentLabels: Record<Employment, Record<Locale, string>> = {
  "full-time": { en: "Full-time", sv: "Heltid" },
  "part-time": { en: "Part-time", sv: "Deltid" },
  freelance: { en: "Freelance", sv: "Frilans" },
  contributor: { en: "Contributor", sv: "Medhjälpare" },
  volunteer: { en: "Volunteer", sv: "Ideellt" },
};

const kindLabels: Record<ExperienceKind, Record<Locale, string>> = {
  education: { en: "Education", sv: "Utbildning" },
  work: { en: "Work", sv: "Arbete" },
  contribution: { en: "Contribution", sv: "Bidrag" },
};

const periodLabels: Record<
  Locale,
  {
    years: (count: number) => string;
    months: (count: number) => string;
    current: string;
  }
> = {
  en: {
    years: (count) => `${count}y`,
    months: (count) => `${count}m`,
    current: "Current",
  },
  sv: {
    // A no-break space keeps each number with its unit when the line wraps.
    years: (count) => `${count}\u00a0år`,
    months: (count) => `${count}\u00a0mån`,
    current: "pågående",
  },
};

/**
 * Positions from the public resume, newest organization first.
 * Months are inclusive, matching a range such as 01.2026–10.2026 = 10m.
 */
const experienceSources: readonly ExperienceSource[] = [
  {
    company: "YH Akademin",
    kind: "education",
    href: "https://yh.se",
    location: { en: "Stockholm, Sweden", sv: "Stockholm, Sverige" },
    icon: "graduation",
    logoSrc: "/yh-akademin-logo.jpg",
    roles: [
      {
        title: { en: ".NET Developer", sv: "Systemutvecklare .NET" },
        employment: "full-time",
        icon: "graduation",
        start: { year: 2026, month: 1 },
        end: { year: 2027, month: 12 },
        description: {
          en: [
            "Advanced Higher Vocational Education Diploma in .NET development.",
          ],
          sv: [
            "Studerar till kvalificerad yrkeshögskoleexamen som systemutvecklare .NET.",
          ],
        },
        skills: [
          "C#",
          "SQL Server",
          "HTML",
          "CSS",
          "JavaScript",
          "Git",
          "GitHub",
        ],
      },
    ],
  },
  {
    company: "Casuology",
    kind: "contribution",
    href: "https://casuology.com",
    location: { en: "Turku, Finland", sv: "Åbo, Finland" },
    icon: "gamepad",
    logoSrc: "/casuology-logo.jpg",
    roles: [
      {
        title: { en: "Game Programmer", sv: "Spelprogrammerare" },
        employment: "contributor",
        icon: "code",
        start: { year: 2022, month: 7 },
        description: {
          en: [
            "Developing gameplay systems and features in Unity and C#.",
            "Helping out at a small independent game studio.",
          ],
          sv: [
            "Utvecklar spelsystem och funktioner i Unity och C#.",
            "Hjälper till på en liten oberoende spelstudio.",
          ],
        },
        skills: ["Unity", "C#", "Git", "GitHub"],
      },
    ],
  },
  {
    company: "The Game Assembly",
    kind: "education",
    href: "https://thegameassembly.com",
    location: { en: "Stockholm, Sweden", sv: "Stockholm, Sverige" },
    icon: "graduation",
    logoSrc: "/tga-logo.jpg",
    roles: [
      {
        title: { en: "Game Programming", sv: "Spelprogrammering" },
        employment: "full-time",
        icon: "gamepad",
        start: { year: 2021, month: 8 },
        end: { year: 2022, month: 2 },
        description: {
          en: [
            "Developed Lich's Grimoire, a mobile game, from concept to completion in a six-person team.",
            "Worked on gameplay mechanics as one of four programmers and built tools for the team's workflow.",
          ],
          sv: [
            "Utvecklade Lich's Grimoire, ett mobilspel, från idé till färdigt spel i ett team på sex personer.",
            "Arbetade med spelmekanik som en av fyra programmerare och byggde verktyg för teamets arbetsflöde.",
          ],
        },
        skills: ["C++", "C#", "Unity", "Perforce"],
      },
    ],
  },
  {
    company: "NTI Gymnasiet",
    kind: "education",
    href: "https://ntigymnasiet.se",
    location: { en: "Södertälje, Sweden", sv: "Södertälje, Sverige" },
    icon: "school",
    logoSrc: "/nti-logo.jpg",
    roles: [
      {
        title: { en: "Technology Programme", sv: "Teknikprogrammet" },
        employment: "full-time",
        icon: "graduation",
        start: { year: 2018, month: 8 },
        end: { year: 2021, month: 6 },
        description: { en: [], sv: [] },
        skills: [
          "Python",
          "C#",
          "Unity",
          "HTML",
          "CSS",
          "JavaScript",
          "Git",
          "GitHub",
        ],
      },
      {
        title: { en: "Student Ambassador", sv: "Elevambassadör" },
        employment: "volunteer",
        icon: "megaphone",
        start: { year: 2018, month: 12 },
        end: { year: 2021, month: 6 },
        description: {
          en: [
            "Represented the school at events for prospective students and their parents.",
          ],
          sv: [
            "Representerade skolan vid evenemang för blivande elever och deras föräldrar.",
          ],
        },
        skills: [],
      },
      {
        title: { en: "Makerspace Coordinator", sv: "Ansvarig för makerspace" },
        employment: "volunteer",
        icon: "lightbulb",
        start: { year: 2018, month: 12 },
        end: { year: 2021, month: 6 },
        description: {
          en: [
            "Ran the school's makerspace on my own initiative, mentoring students in 3D modelling, 3D printing, electronics, and soldering.",
          ],
          sv: [
            "Drev skolans makerspace på eget initiativ och handledde elever i 3D-modellering, 3D-utskrift, elektronik och lödning.",
          ],
        },
        skills: [],
      },
      {
        title: {
          en: "Best Diploma Project (voted by students)",
          sv: "Bästa gymnasiearbete (utsett av eleverna)",
        },
        icon: "award",
        start: { year: 2021, month: 6 },
        end: { year: 2021, month: 6 },
        pointInTime: true,
        description: { en: [], sv: [] },
        skills: [],
      },
    ],
  },
];

export type ExperienceRole = {
  title: string;
  icon: ExperienceIcon;
  meta: string;
  description: readonly string[];
  skills: readonly string[];
};

export type Experience = {
  company: string;
  kind: ExperienceKind;
  kindLabel: string;
  href?: Href;
  location: string;
  icon: ExperienceIcon;
  logoSrc?: ImageSrc;
  isCurrent: boolean;
  roles: readonly ExperienceRole[];
};

function monthIndex(value: YearMonth) {
  return value.year * 12 + value.month;
}

const yearMonthFormat = new Intl.DateTimeFormat("en", {
  timeZone,
  year: "numeric",
  month: "numeric",
});

/** The month in Dante's time zone, so a new month starts at local midnight, not UTC. */
function monthOf(now: Date): YearMonth {
  const parts = yearMonthFormat.formatToParts(now);
  const part = (type: "year" | "month") =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return { year: part("year"), month: part("month") };
}

function hasStarted(start: YearMonth, now: Date) {
  return monthIndex(start) <= monthIndex(monthOf(now));
}

function isOngoing(end: YearMonth | undefined, now: Date) {
  if (!end) return true;
  return monthIndex(end) >= monthIndex(monthOf(now));
}

function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

/** Inclusive month span, so January through October of the same year is 10. */
export function inclusiveMonthCount(start: YearMonth, end: YearMonth) {
  return (end.year - start.year) * 12 + (end.month - start.month) + 1;
}

export function formatExperiencePeriod(
  start: YearMonth,
  end: YearMonth | undefined,
  now: Date,
  locale: Locale,
) {
  const startLabel = `${padMonth(start.month)}.${start.year}`;
  if (!hasStarted(start, now)) {
    // Not begun yet: no "Current" and no duration to count.
    const endLabel = end ? `–${padMonth(end.month)}.${end.year}` : "";
    return { range: `${startLabel}${endLabel}`, duration: "" };
  }

  const today = monthOf(now);
  const effectiveEnd = end && monthIndex(end) < monthIndex(today) ? end : today;
  const months = inclusiveMonthCount(start, effectiveEnd);
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const labels = periodLabels[locale];
  const duration = [
    years > 0 ? labels.years(years) : null,
    remainder > 0 ? labels.months(remainder) : null,
  ]
    .filter((part) => part !== null)
    .join(" ");
  const range = `${startLabel}–${
    end && !isOngoing(end, now)
      ? `${padMonth(end.month)}.${end.year}`
      : labels.current
  }`;

  return { range, duration };
}

function skillLabel(name: string) {
  const skill = allSkills.find((entry) => entry.name === name);
  if (!skill) {
    throw new Error(`Unknown skill in experience: ${name}`);
  }
  return skill.name;
}

function roleMeta(role: ExperienceRoleSource, locale: Locale, now: Date) {
  if (role.pointInTime) {
    return `${padMonth(role.start.month)}.${role.start.year}`;
  }
  if (!role.employment) {
    throw new Error(
      `Experience role is missing an employment type: ${role.title.en}`,
    );
  }
  const { range, duration } = formatExperiencePeriod(
    role.start,
    role.end,
    now,
    locale,
  );
  return [employmentLabels[role.employment][locale], range, duration]
    .filter(Boolean)
    .join(" | ");
}

export function getExperience(locale: Locale, now = new Date()): Experience[] {
  return experienceSources.map((entry) => ({
    company: entry.company,
    kind: entry.kind,
    kindLabel: kindLabels[entry.kind][locale],
    href: entry.href,
    location: entry.location[locale],
    icon: entry.icon,
    logoSrc: entry.logoSrc,
    isCurrent: entry.roles.some(
      (role) =>
        !role.pointInTime &&
        hasStarted(role.start, now) &&
        isOngoing(role.end, now),
    ),
    roles: entry.roles.map((role) => ({
      title: role.title[locale],
      icon: role.icon,
      meta: roleMeta(role, locale, now),
      description: role.description[locale],
      skills: role.skills.map(skillLabel),
    })),
  }));
}
