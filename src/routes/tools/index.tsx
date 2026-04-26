import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { ArrowUpRightIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, linkOptions } from "@tanstack/react-router";

export const Route = createFileRoute("/tools/")({
  component: ToolsRoute,
});

const toolOptions = linkOptions([
  {
    to: "/tools/map-wallpaper",
    label: "Map Wallpaper",
    description: "Design & export high-resolution map wallpapers with custom themes and granular layer controls.",
    icon: MapTrifoldIcon,
  },
]);

function ToolsRoute() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">A collection of utilities and generators to explore and visualize data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {toolOptions.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.to} to={tool.to} className="group outline-none">
              <Card className="h-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring hover:border-blue-500/50 hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="mt-2 text-sm">{tool.label}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
