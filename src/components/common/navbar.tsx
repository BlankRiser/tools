import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/use-theme";
import { CommandIcon, MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";
import { Link, linkOptions } from "@tanstack/react-router";

const navOptions = linkOptions([
  {
    to: "/tools",
    label: "Explore",
    activeOptions: { exact: true },
  },
]);

export function Navbar() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <Link
          to="/"
          viewTransition={{ types: ["slide-left"] }}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CommandIcon className="size-3.5" weight="bold" />
          </span>
          DevHaven
        </Link>

        <div className="flex items-center gap-1">
          {navOptions.map((option) => (
            <Link
              key={option.to}
              to={option.to}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{
                className: "data-[status=active]:bg-accent data-[status=active]:text-foreground",
              }}
              activeOptions={{
                exact: true
              }}
              viewTransition={{ types: ["slide-right"] }}
            >
              {option.label}
            </Link>
          ))}

          <div className="mx-1.5 h-4 w-px bg-border/60" />

          <Button size="icon-sm" variant="ghost" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === "light" ? <SunDimIcon weight="bold" /> : <MoonStarsIcon weight="bold" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}
