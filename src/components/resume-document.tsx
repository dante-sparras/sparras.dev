import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { type Experience, getExperience } from "@/content/experience";
import { getProfile } from "@/content/profile";
import { getProjects } from "@/content/projects";
import { getSkillCategories } from "@/content/skills";
import type { ImageSrc } from "@/content/types";
import type { Locale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import type { ResumeTheme } from "@/lib/resume-theme";

/** Listed in `outputFileTracingIncludes`, so these also exist on the server. */
const asset = (file: string) =>
  path.join(process.cwd(), "src/assets/resume", file);

/** Read up front: react-pdf takes a Windows image path for a URL. */
function loadImage(file: string) {
  const fullPath = asset(file);
  if (!existsSync(fullPath)) return null;

  const format = file.endsWith(".png") ? ("png" as const) : ("jpg" as const);
  return { data: readFileSync(fullPath), format };
}

const fileStem = (src: ImageSrc) =>
  path.basename(String(src), path.extname(String(src)));

/** Made by `scripts/generate-resume-assets.ts`. */
export function skillIcon(iconSrc: ImageSrc, theme: ResumeTheme) {
  const file = `${fileStem(iconSrc)}.png`;
  // Only icons too pale to see on white have a light variant.
  const lightVariant =
    theme === "light" ? loadImage(`icons-light/${file}`) : null;
  return lightVariant ?? loadImage(`icons/${file}`);
}

const organizationLogo = (logoSrc: ImageSrc) =>
  loadImage(`logos/${fileStem(logoSrc)}.jpg`);

Font.register({
  family: "Geist",
  fonts: [
    { src: asset("geist-regular.ttf"), fontWeight: 400 },
    { src: asset("geist-semibold.ttf"), fontWeight: 600 },
  ],
});
Font.register({ family: "Geist Mono", src: asset("geist-mono-regular.ttf") });
Font.register({ family: "Geist Pixel", src: asset("geist-pixel-regular.ttf") });

// Lines break between words; a resume should not hyphenate names or tools.
Font.registerHyphenationCallback((word) => [word]);

const BLACK = "#000000";

const palettes = {
  dark: {
    page: BLACK,
    sidebar: BLACK,
    text: "#f2f2f2",
    muted: "#9a9a9a",
    rule: "#2b2b2b",
    pill: "#383838",
    avatarRing: "#3d3d3d",
  },
  light: {
    page: "#ffffff",
    sidebar: "#f6f6f6",
    text: "#111111",
    muted: "#5c5c5c",
    rule: "#e4e4e4",
    pill: "#cfcfcf",
    avatarRing: "#cfcfcf",
  },
};

type Palette = (typeof palettes)[ResumeTheme];

const SIDEBAR_WIDTH = 170;
const SIDEBAR_X = 18;
const MAIN_X = 22;

function createStyles(colors: Palette) {
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      fontFamily: "Geist",
      fontSize: 9,
      lineHeight: 1.45,
      color: colors.text,
      backgroundColor: colors.page,
    },
    band: {
      position: "relative",
      flexDirection: "row",
      height: 104,
      backgroundColor: colors.page,
      overflow: "hidden",
    },
    banner: { position: "absolute", top: -28, right: -92, width: 400 },
    avatarCell: {
      width: SIDEBAR_WIDTH,
      alignItems: "center",
      justifyContent: "flex-end",
      borderBottomWidth: 0.75,
      borderBottomColor: colors.rule,
      borderRightWidth: 0.75,
      borderRightColor: colors.rule,
      backgroundColor: colors.sidebar,
    },
    avatar: {
      width: 86,
      height: 86,
      marginBottom: 9,
      borderRadius: 43,
      borderWidth: 0.75,
      borderColor: colors.avatarRing,
    },
    identity: {
      flex: 1,
      justifyContent: "flex-end",
      paddingLeft: MAIN_X,
      paddingBottom: 14,
    },
    name: {
      fontFamily: "Geist Pixel",
      fontSize: 25,
      lineHeight: 1.1,
      color: colors.text,
    },
    role: { marginTop: 3, fontSize: 10.5, color: colors.muted },
    body: { flex: 1, flexDirection: "row" },
    sidebar: {
      width: SIDEBAR_WIDTH,
      paddingHorizontal: SIDEBAR_X,
      paddingTop: 16,
      backgroundColor: colors.sidebar,
      borderRightWidth: 0.75,
      borderRightColor: colors.rule,
    },
    sidebarHeading: {
      marginBottom: 6,
      fontWeight: 600,
      fontSize: 10.5,
      color: colors.text,
    },
    sidebarBlock: { marginBottom: 20 },
    contactLine: {
      marginBottom: 4,
      fontFamily: "Geist Mono",
      fontSize: 7.5,
      color: colors.text,
      textDecoration: "none",
    },
    skillGroup: { marginBottom: 14 },
    skillCategory: {
      marginBottom: 4,
      fontFamily: "Geist Mono",
      fontSize: 7,
      color: colors.muted,
    },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 3.5 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      height: 15.5,
      paddingHorizontal: 5.5,
      borderWidth: 0.5,
      borderColor: colors.pill,
      borderRadius: 8,
    },
    pillIcon: { width: 8.5, height: 8.5 },
    pillText: {
      fontFamily: "Geist Mono",
      fontSize: 7,
      lineHeight: 1,
      color: colors.text,
    },
    main: { flex: 1, paddingHorizontal: MAIN_X, paddingTop: 13 },
    bio: { marginBottom: 10 },
    section: { marginBottom: 9 },
    sectionHeading: {
      marginBottom: 7,
      paddingBottom: 2,
      borderBottomWidth: 0.75,
      borderBottomColor: colors.rule,
      fontWeight: 600,
      fontSize: 11.5,
    },
    entry: { flexDirection: "row", marginBottom: 7 },
    logo: {
      width: 23,
      height: 23,
      marginRight: 9,
      borderWidth: 0.5,
      borderColor: colors.rule,
      borderRadius: 6,
    },
    entryBody: { flex: 1 },
    heading: { flexDirection: "row", justifyContent: "space-between" },
    company: { fontWeight: 600, fontSize: 10 },
    meta: {
      flexShrink: 0,
      marginLeft: 8,
      fontFamily: "Geist Mono",
      fontSize: 7,
      lineHeight: 2,
      color: colors.muted,
    },
    roleTitle: { color: colors.muted },
    extraRole: { marginTop: 3 },
    extraRoleTitle: { flexShrink: 1, fontWeight: 600 },
    bullet: { flexDirection: "row" },
    bulletMark: { width: 8, color: colors.muted },
    bulletText: { flex: 1 },
    entrySkills: {
      marginTop: 2,
      fontFamily: "Geist Mono",
      fontSize: 7,
      color: colors.muted,
    },
    projects: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    project: {
      width: "48.8%",
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderWidth: 0.75,
      borderColor: colors.rule,
      borderRadius: 8,
    },
    projectTitle: { fontWeight: 600 },
    projectText: { fontSize: 8, lineHeight: 1.35, color: colors.muted },
  });
}

type ResumeStyles = ReturnType<typeof createStyles>;

const stylesByTheme: Record<ResumeTheme, ResumeStyles> = {
  dark: createStyles(palettes.dark),
  light: createStyles(palettes.light),
};

function MainSection({
  title,
  styles,
  children,
}: {
  title: string;
  styles: ResumeStyles;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {children}
    </View>
  );
}

function ExperienceEntry({
  entry,
  styles,
}: {
  entry: Experience;
  styles: ResumeStyles;
}) {
  const logo = entry.logoSrc ? organizationLogo(entry.logoSrc) : null;
  const skillNames = [...new Set(entry.roles.flatMap((role) => role.skills))];

  return (
    <View style={styles.entry}>
      {logo ? <Image src={logo} style={styles.logo} /> : null}
      <View style={styles.entryBody}>
        {entry.roles.map((role, index) => (
          <View key={role.title} style={index > 0 ? styles.extraRole : {}}>
            <View style={styles.heading}>
              <Text
                style={index === 0 ? styles.company : styles.extraRoleTitle}
              >
                {index === 0 ? entry.company : role.title}
              </Text>
              <Text style={styles.meta}>{role.meta}</Text>
            </View>
            {index === 0 ? (
              <Text style={styles.roleTitle}>{role.title}</Text>
            ) : null}
            {role.description.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        ))}
        {skillNames.length > 0 ? (
          <Text style={styles.entrySkills}>{skillNames.join(" · ")}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Left out when empty, so the resume never shows a heading with nothing under it. */
function ExperienceSection({
  title,
  entries,
  styles,
}: {
  title: string;
  entries: readonly Experience[];
  styles: ResumeStyles;
}) {
  if (entries.length === 0) return null;

  return (
    <MainSection title={title} styles={styles}>
      {entries.map((entry) => (
        <ExperienceEntry key={entry.company} entry={entry} styles={styles} />
      ))}
    </MainSection>
  );
}

export function ResumeDocument({
  locale,
  theme = "dark",
}: {
  locale: Locale;
  theme?: ResumeTheme;
}) {
  const styles = stylesByTheme[theme];
  const profile = getProfile(locale);
  const labels = getMessages(locale).resume;
  const experience = getExperience(locale);
  const banner = loadImage(
    theme === "light" ? "banner-light.png" : "banner.png",
  );
  const avatar = loadImage("avatar.jpg");
  const bio = profile.bio
    .map((part) =>
      typeof part === "string" ? part : (part.label ?? part.skill),
    )
    .join("");
  const contact = [
    { label: profile.email, href: `mailto:${profile.email}` },
    { label: profile.phone.display, href: profile.phone.href },
    { label: profile.location, href: String(profile.mapsHref) },
    ...profile.socialLinks
      .filter(({ platform }) => ["GitHub", "LinkedIn"].includes(platform))
      .map(({ href }) => ({
        label: String(href)
          .replace(/^https:\/\/(www\.)?/, "")
          .replace(/\/$/, ""),
        href: String(href),
      })),
  ];

  return (
    <Document
      title={`${profile.name} - ${labels.title}`}
      author={profile.name}
      language={locale}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          {banner ? <Image src={banner} style={styles.banner} /> : null}
          <View style={styles.avatarCell}>
            {avatar ? <Image src={avatar} style={styles.avatar} /> : null}
          </View>
          <View style={styles.identity}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>{labels.contact}</Text>
              {contact.map(({ label, href }) => (
                <Link key={label} src={href} style={styles.contactLine}>
                  {label}
                </Link>
              ))}
            </View>
            <Text style={styles.sidebarHeading}>{labels.skills}</Text>
            {getSkillCategories(locale).map((category) => (
              <View key={category.id} style={styles.skillGroup}>
                <Text style={styles.skillCategory}>{category.title}</Text>
                <View style={styles.pills}>
                  {category.skills.map((skill) => {
                    const icon = skillIcon(skill.iconSrc, theme);

                    return (
                      <View key={skill.name} style={styles.pill}>
                        {icon ? (
                          <Image src={icon} style={styles.pillIcon} />
                        ) : null}
                        <Text style={styles.pillText}>{skill.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.main}>
            <Text style={styles.bio}>{bio}</Text>
            <ExperienceSection
              title={labels.work}
              styles={styles}
              entries={experience.filter((entry) => entry.kind === "work")}
            />
            <ExperienceSection
              title={labels.education}
              styles={styles}
              entries={experience.filter((entry) => entry.kind === "education")}
            />
            <ExperienceSection
              title={labels.contributions}
              styles={styles}
              entries={experience.filter(
                (entry) => entry.kind === "contribution",
              )}
            />
            <MainSection title={labels.projects} styles={styles}>
              <View style={styles.projects}>
                {getProjects(locale).map((project) => (
                  <View key={project.title} style={styles.project}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectText}>
                      {project.description}
                    </Text>
                  </View>
                ))}
              </View>
            </MainSection>
          </View>
        </View>
      </Page>
    </Document>
  );
}
