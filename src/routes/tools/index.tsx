import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { toolsList } from "#/data/tools-list";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tools/")({
  component: ToolsRoute,
});

function ToolsRoute() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">A collection of utilities and generators to explore and visualize data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {toolsList.filter((tool) => !tool.comingSoon).map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.to} to={tool.to} params={tool.params} className="group outline-none">
              <Card className="h-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring hover:border-blue-500/50 hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <Icon className="size-5" weight="duotone" />
                    </div>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="mt-2 text-sm">{tool.title}</CardTitle>
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
