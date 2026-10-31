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
import { certificates } from "@/content/certificates";
import { type Experience, getExperience } from "@/content/experience";
import { getProfile } from "@/content/profile";
import { getProjects } from "@/content/projects";
import { getResumeSkillCategories } from "@/content/skills";
import type { Href, ImageSrc } from "@/content/types";
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

export const contactIcons = [
  "mail",
  "phone",
  "location",
  "website",
  "github",
  "linkedin",
] as const;

type ContactIcon = (typeof contactIcons)[number];

export const contactIcon = (icon: ContactIcon, theme: ResumeTheme) =>
  loadImage(`contact/${icon}-${theme}.png`);

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

/** The site's neutral palette. */
const palettes = {
  dark: {
    page: "#000000",
    sidebar: "#000000",
    surface: "#0a0a0a",
    heading: "#ffffff",
    text: "#e5e5e5",
    muted: "#a1a1a1",
    rule: "#2a2a2a",
    pill: "#333333",
  },
  light: {
    page: "#ffffff",
    sidebar: "#fafafa",
    surface: "#fafafa",
    heading: "#0a0a0a",
    text: "#262626",
    muted: "#525252",
    rule: "#e5e5e5",
    pill: "#d4d4d4",
  },
};

type Palette = (typeof palettes)[ResumeTheme];

const SIDEBAR_WIDTH = 180;
const SIDEBAR_X = 18;
const MAIN_X = 24;
const HAIRLINE = 0.5;

const TYPE = { micro: 7.25, small: 8.25, body: 9, title: 10, heading: 11 };

/** Every gap is one of these, so the page keeps one rhythm. */
const SPACE = { xs: 2, sm: 4, md: 8, lg: 12, xl: 16, xxl: 20 };

const RADIUS = { logo: 5, card: 6, pill: 7 };

function createStyles(colors: Palette) {
  const heading = {
    marginBottom: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: colors.rule,
    fontWeight: 600,
    fontSize: TYPE.heading,
    color: colors.heading,
  };
  const mono = { fontFamily: "Geist Mono", fontSize: TYPE.micro };

  // `lineHeight` always sits next to a `fontSize`: without one, react-pdf
  // applies the inherited line height twice.
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      fontFamily: "Geist",
      fontSize: TYPE.body,
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
      justifyContent: "center",
      backgroundColor: colors.sidebar,
      borderRightWidth: HAIRLINE,
      borderRightColor: colors.rule,
    },
    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: HAIRLINE,
      borderColor: colors.pill,
    },
    identity: { flex: 1, justifyContent: "center", paddingLeft: MAIN_X },
    name: {
      fontFamily: "Geist Pixel",
      fontSize: 26,
      lineHeight: 1.1,
      color: colors.heading,
    },
    role: {
      marginTop: SPACE.sm,
      fontSize: TYPE.title,
      lineHeight: 1.3,
      color: colors.muted,
    },
    body: {
      flex: 1,
      flexDirection: "row-reverse",
      borderTopWidth: HAIRLINE,
      borderTopColor: colors.rule,
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      paddingHorizontal: SIDEBAR_X,
      paddingVertical: SPACE.xl,
      backgroundColor: colors.sidebar,
      borderRightWidth: HAIRLINE,
      borderRightColor: colors.rule,
    },
    sidebarHeading: heading,
    sidebarBlock: { marginBottom: SPACE.xxl },
    contactRow: {
      flexDirection: "row",
      gap: SPACE.sm + 1,
      marginBottom: SPACE.sm,
    },
    contactIcon: { width: 8, height: 8, marginTop: 1 },
    contactLine: {
      ...mono,
      fontSize: 7.25,
      color: colors.text,
      textDecoration: "none",
    },
    skillGroup: { marginBottom: SPACE.lg },
    skillCategory: { ...mono, marginBottom: SPACE.sm, color: colors.muted },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm - 1 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      height: 14,
      paddingHorizontal: 5,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.pill,
      borderRadius: RADIUS.pill,
    },
    pillIcon: { width: 8, height: 8 },
    pillText: {
      fontFamily: "Geist Mono",
      fontSize: 7,
      lineHeight: 1,
      color: colors.text,
    },
    main: {
      flex: 1,
      gap: SPACE.xl,
      paddingHorizontal: MAIN_X,
      paddingTop: SPACE.xl,
    },
    bio: { fontSize: TYPE.body, lineHeight: 1.5 },
    sectionHeading: heading,
    entries: { gap: SPACE.md + 2 },
    certificates: { gap: SPACE.xs },
    certificateIssuer: { fontWeight: 400, color: colors.muted },
    entry: { flexDirection: "row" },
    logo: {
      width: 24,
      height: 24,
      marginRight: 10,
      borderWidth: HAIRLINE,
      borderColor: colors.rule,
      borderRadius: RADIUS.logo,
    },
    entryBody: { flex: 1 },
    heading: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    company: {
      fontWeight: 600,
      fontSize: TYPE.title,
      lineHeight: 1.35,
      color: colors.heading,
    },
    meta: { ...mono, flexShrink: 0, marginLeft: SPACE.md, color: colors.muted },
    roleTitle: {
      marginBottom: SPACE.xs,
      fontSize: TYPE.body,
      lineHeight: 1.35,
      color: colors.muted,
    },
    extraRole: { marginTop: SPACE.sm },
    extraRoleTitle: { flexShrink: 1, fontWeight: 600, color: colors.heading },
    bullet: { flexDirection: "row" },
    bulletMark: { width: 8, color: colors.muted },
    bulletText: { flex: 1 },
    projects: { gap: SPACE.sm + 2 },
    project: {
      paddingHorizontal: SPACE.md + 2,
      paddingVertical: SPACE.md - 1,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.pill,
      borderRadius: RADIUS.card,
    },
    projectHeading: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: SPACE.xs,
    },
    projectTitle: {
      fontWeight: 600,
      fontSize: TYPE.body,
      lineHeight: 1.3,
      color: colors.heading,
    },
    projectLink: { ...mono, color: colors.muted, textDecoration: "none" },
    projectText: { fontSize: TYPE.small, lineHeight: 1.4, color: colors.muted },
    references: {
      marginTop: SPACE.sm,
      fontSize: TYPE.small,
      lineHeight: 1.4,
      color: colors.muted,
    },
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
    <View>
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
      <View style={styles.entries}>
        {entries.map((entry) => (
          <ExperienceEntry key={entry.company} entry={entry} styles={styles} />
        ))}
      </View>
    </MainSection>
  );
}

const displayUrl = (href: Href) =>
  String(href)
    .replace(/^https:\/\/(www\.)?/, "")
    .replace(/\/$/, "");

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
  const contact = [
    { icon: "mail", label: profile.email, href: `mailto:${profile.email}` },
    { icon: "phone", label: profile.phone.display, href: profile.phone.href },
    {
      icon: "location",
      label: profile.location,
      href: String(profile.mapsHref),
    },
    { icon: "website", label: "sparras.dev", href: "https://www.sparras.dev" },
    ...(["GitHub", "LinkedIn"] as const).flatMap((platform) =>
      profile.socialLinks
        .filter((link) => link.platform === platform)
        .map(({ href }) => ({
          icon: platform.toLowerCase() as ContactIcon,
          label: displayUrl(href),
          href: String(href),
        })),
    ),
  ] satisfies { icon: ContactIcon; label: string; href: string }[];

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
          <View style={styles.main}>
            <Text style={styles.bio}>{profile.resumeSummary}</Text>
            <MainSection title={labels.projects} styles={styles}>
              <View style={styles.projects}>
                {getProjects(locale).map((project) => (
                  <View key={project.title} style={styles.project}>
                    <View style={styles.projectHeading}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <Link
                        src={String(project.href)}
                        style={styles.projectLink}
                      >
                        {displayUrl(project.href)}
                      </Link>
                    </View>
                    <Text style={styles.projectText}>
                      {project.description}
                    </Text>
                  </View>
                ))}
              </View>
            </MainSection>
            <ExperienceSection
              title={labels.education}
              styles={styles}
              entries={experience.filter((entry) => entry.kind === "education")}
            />
            <ExperienceSection
              title={labels.work}
              styles={styles}
              entries={experience.filter((entry) => entry.kind === "work")}
            />
            <MainSection title={labels.certificates} styles={styles}>
              <View style={styles.certificates}>
                {certificates.map((certificate) => (
                  <View key={certificate.title} style={styles.heading}>
                    <Text style={styles.extraRoleTitle}>
                      {certificate.title}
                      <Text style={styles.certificateIssuer}>
                        {`  ${certificate.issuer}`}
                      </Text>
                    </Text>
                    <Text style={styles.meta}>{certificate.issued}</Text>
                  </View>
                ))}
              </View>
            </MainSection>
            <ExperienceSection
              title={labels.contributions}
              styles={styles}
              entries={experience.filter(
                (entry) => entry.kind === "contribution",
              )}
            />
          </View>

          <View style={styles.sidebar}>
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>{labels.contact}</Text>
              {contact.map(({ icon, label, href }) => {
                const image = contactIcon(icon, theme);

                return (
                  <View key={label} style={styles.contactRow}>
                    {image ? (
                      <Image src={image} style={styles.contactIcon} />
                    ) : null}
                    <Link src={href} style={styles.contactLine}>
                      {label}
                    </Link>
                  </View>
                );
              })}
            </View>
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>{labels.languages}</Text>
              <Text style={styles.contactLine}>
                {profile.languages.join(", ")}
              </Text>
            </View>
            <Text style={styles.sidebarHeading}>{labels.skills}</Text>
            {getResumeSkillCategories(locale).map((category) => (
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
            <Text style={styles.references}>{labels.references}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
