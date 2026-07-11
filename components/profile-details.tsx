import type { LucideIcon } from "lucide-react";
import { GraduationCap, Link2, Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONTACT } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";

export type ProfileDetailsProps = {
  details: Dictionary["home"]["details"];
};

function MetaRow({
  icon: Icon,
  glyph,
  children,
}: {
  icon?: LucideIcon;
  glyph?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      {Icon ? (
        <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
      ) : (
        <span
          className="flex size-4 shrink-0 items-center justify-center text-[0.95rem] leading-none opacity-80"
          aria-hidden
        >
          {glyph}
        </span>
      )}
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

/** Bio + contact facts under the home hero (not part of the hero chrome). */
export function ProfileDetails({ details }: ProfileDetailsProps) {
  return (
    <section className="w-full" aria-label={details.location}>
      <div className="grid sm:grid-cols-2">
        <ul className="flex flex-col gap-3 border-b border-border px-4 py-5 sm:border-r sm:border-b-0 sm:px-5 sm:py-6">
          <MetaRow icon={GraduationCap}>{details.student}</MetaRow>
          <MetaRow icon={MapPin}>{details.location}</MetaRow>
          <MetaRow icon={Mail}>
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="hover:text-foreground transition-colors"
            >
              {SITE_CONTACT.email}
            </a>
          </MetaRow>
          <MetaRow icon={Link2}>
            <a
              href={SITE_CONTACT.websiteHref}
              className="hover:text-foreground transition-colors"
              rel="noopener noreferrer"
            >
              {SITE_CONTACT.websiteDisplay}
            </a>
          </MetaRow>
        </ul>

        <ul className="flex flex-col gap-3 px-4 py-5 sm:px-5 sm:py-6">
          <MetaRow glyph="♂">{details.pronouns}</MetaRow>
          <MetaRow icon={Phone}>
            <a
              href={SITE_CONTACT.phoneHref}
              className="hover:text-foreground transition-colors"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
          </MetaRow>
        </ul>
      </div>
    </section>
  );
}
