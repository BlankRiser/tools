import { Button } from "#/components/ui/button";
import { toolsList } from "#/data/tools-list";
import { useTheme } from "#/hooks/use-theme";
import {
  ArrowUpRightIcon,
  GithubLogoIcon,
  MoonStarsIcon,
  SunDimIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { DevHavenLogo } from "./devhaven-logo";
import { NavSearchCombobox } from "./nav-search-combobox";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  const activeToolsCount = React.useMemo(() => {
    return toolsList.filter((tool) => !tool.comingSoon).length;
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="site-nav sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150 transition-colors">
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8"
      >
        {/* Brand & Client-Side Privacy Indicator */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/"
            viewTransition={{ types: ["slide-left"] }}
            className="group flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-105 group-hover:bg-primary/15">
              <DevHavenLogo className="size-4.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-base font-bold tracking-tight">
                DevHaven
              </span>
              <span className="nav-route-slug font-mono text-[11px] font-normal text-muted-foreground/75">
                /tools
              </span>
            </div>
          </Link>

          <div
            className="hidden items-center gap-1.5 rounded-full border border-border/75 bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground/85 transition-colors hover:bg-muted/70 hover:text-foreground xl:inline-flex"
            title="All computation runs locally in your browser sandbox. Zero bytes sent to any remote server."
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 duration-1000" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>100% Client-Side</span>
          </div>
        </div>

        {/* Center: Command Search Combobox */}
        <div className="flex flex-1 items-center justify-center px-1 sm:px-4">
          <NavSearchCombobox />
        </div>

        {/* Right Navigation & External Links */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground active:scale-95"
            activeProps={{
              className: "bg-secondary text-foreground font-semibold border border-border/70 shadow-2xs",
            }}
            activeOptions={{
              exact: true,
            }}
            viewTransition={{ types: ["slide-right"] }}
          >
            <span className="hidden sm:inline">All Tools</span>
            <span className="sm:hidden">Tools</span>
            <span className="nav-tool-count rounded-full bg-muted border border-border/60 px-1.5 py-0.2 font-mono text-[10px] font-medium text-foreground/80">
              {activeToolsCount}
            </span>
          </Link>

          <div className="mx-0.5 h-4 w-px bg-border/60 sm:mx-1" />

          <a
            href="https://ram.codes"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground lg:inline-flex"
            title="Developed by Ram (ram.codes)"
          >
            <span>ram.codes</span>
            <ArrowUpRightIcon className="size-3 opacity-60" />
          </a>

          <a
            href="https://github.com/BlankRiser"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ram on GitHub (@BlankRiser)"
            title="GitHub (@BlankRiser)"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95"
          >
            <GithubLogoIcon className="size-4" />
          </a>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            className="size-8 rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95"
          >
            {theme === "light" ? (
              <SunDimIcon className="size-4" weight="bold" />
            ) : (
              <MoonStarsIcon className="size-4" weight="bold" />
            )}
          </Button>
        </div>
      </nav>
    </header>
  );
}
