import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SocialIconLink {
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
}

export function SocialIconsLinks({
  data,
  className,
}: {
  data: SocialIconLink[];
  className?: string;
}) {
  return (
    <ul className={cn("flex w-full flex-row justify-center", className)}>
      {data.map((link) => (
        <li
          key={link.href.toString()}
          className="flex size-10 items-center justify-center"
        >
          <Link href={link.href}>{link.icon}</Link>
        </li>
      ))}
    </ul>
  );
}
