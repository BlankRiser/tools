import { ArrowUpRightIcon, CpuIcon, GithubLogoIcon, GlobeSimpleIcon, KeyboardIcon, ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button } from "../ui/button";

const ARCHITECTURAL_PRINCIPLES = [
  {
    index: "01",
    icon: ShieldCheckIcon,
    title: "Zero Surveillance, Zero Paywalls",
    description:
      "No account creation, no advertising cookies, no tracking pixels, and no artificial usage tiers. Every utility runs freely with no network telemetry or data retention.",
  },
  {
    index: "02",
    icon: CpuIcon,
    title: "Production Engineering Depth",
    description:
      "Engineered for demanding workloads rather than toy demos: recursive JSON5 parsing, 10-space bidirectional color science, multi-page PDF reorganization, and MapLibre vector layers.",
  },
  {
    index: "03",
    icon: KeyboardIcon,
    title: "Keyboard-First Ergonomics",
    description:
      "Optimized for uninterrupted developer flow. Trigger tools with global shortcuts (⌘K or /), toggle formatters instantly, and copy sanitized outputs in a single keystroke.",
  },
];

export const Principles = () => {
  return (
    <section className="border-b border-border/80 bg-card/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            Engineering Principles
          </p>
          <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for developers who value privacy and craft
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Most online utilities wrap trivial scripts with intrusive ad banners or secretly upload your payloads to remote servers.
            DevHaven Tools was built from scratch as an honest, air-gapped developer workbench.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ARCHITECTURAL_PRINCIPLES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.index}
                className="tech-crosshair-wrap flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs"
              >
                <span className="tech-crosshair-tl">+</span>
                <span className="tech-crosshair-tr">+</span>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">
                      [ {item.index} ]
                    </span>
                    <Icon className="size-5 text-primary" weight="duotone" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      {/* Creator Attribution Banner */}
      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SparkleIcon className="size-4 text-primary" weight="fill" />
            <h3 className="text-sm font-semibold text-foreground">
              Designed & Developed by Ram
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Built as an open-source developer toolkit. Check out more projects, articles, and
            experiments on{" "}
            <a
              href="https://ram.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
            >
              ram.codes
            </a>{" "}
            or follow{" "}
            <a
              href="https://github.com/BlankRiser"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
            >
              @BlankRiser
            </a>{" "}
            on GitHub.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://ram.codes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="default" size="sm" className="gap-1.5 text-xs">
              <GlobeSimpleIcon className="size-3.5" />
              Visit ram.codes
              <ArrowUpRightIcon className="size-3" />
            </Button>
          </a>
          <a
            href="https://github.com/BlankRiser"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <GithubLogoIcon className="size-3.5" />
              GitHub (@BlankRiser)
              <ArrowUpRightIcon className="size-3" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  </section>
  );
};