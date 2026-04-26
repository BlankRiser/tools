import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/use-theme";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Link, linkOptions } from "@tanstack/react-router";

const navOptions = linkOptions([
  {
    to: "/tools",
    label: "Tools",
    activeOptions: { exact: true },
  },
]);

export function Navbar() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="w-full border-b border-b-neutral-100 dark:border-b-neutral-900 ">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-1 ">
        <Link to="/" viewTransition={{ types: ["slide-left"] }} className="px-2 text-center text-lg font-semibold text-blue-600 dark:text-blue-400 ">
          Tools
        </Link>
        <div className="flex items-center gap-2">
          {navOptions.map((option) => (
            <Link
              key={option.to}
              to={option.to}
              className="px-2 text-sm text-neutral-700 hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400"
              activeProps={{
                className: "underline underline-offset-4 data-[status=active]:text-blue-600 data-[status=active]:dark:text-blue-400",
              }}
              viewTransition={{ types: ["slide-right"] }}
            >
              {option.label}
            </Link>
          ))}

          <Button size="icon" variant={"ghost"} onClick={toggleTheme}>
            {theme === "light" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </nav>
  );
}
