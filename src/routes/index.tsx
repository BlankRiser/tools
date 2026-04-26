import { Button } from "#/components/ui/button";
import { toolsList } from "#/data/tools-list";
import { ArrowRightIcon, CodeIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });


function Home() {
  return (
    <div className="relative flex min-h-[calc(100dvh-2.8rem)] flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-20%] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <RocketLaunchIcon className="size-3.5 text-primary" weight="fill" />
          Open-source developer toolkit
        </span>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Build faster with <span className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-transparent">DevHaven Tools</span>
        </h1>

        <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          A curated collection of visual utilities, generators, and visualizers — designed for developers who care about craft.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link to="/tools">
            <Button size="lg" className="gap-2">
              Explore tools
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
          <a href="https://github.com/BlankRiser/tools" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2">
              <CodeIcon className="size-4" />
              Source
            </Button>
          </a>
        </div>
      </section>
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {toolsList.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/80"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="size-5" weight="duotone" />
                </div>
                {f.comingSoon && (
                  <span className="rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-linear-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
