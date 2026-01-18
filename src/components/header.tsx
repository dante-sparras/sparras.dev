import { Nav } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { Separator } from "./ui/separator";

export function Header() {
  return (
    <header className="sticky top-0 flex h-12 items-center justify-end gap-4 border-b bg-background px-4">
      <Nav />
      <Separator
        orientation="vertical"
        className="my-auto hidden h-4 w-px md:flex"
      />
      <ThemeToggle />
    </header>
  );
}
