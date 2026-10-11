import { ArrowUpRightIcon, CodeIcon, CpuIcon, GithubLogoIcon, GlobeSimpleIcon, KeyboardIcon, ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button } from "../ui/button";

const ARCHITECTURAL_PRINCIPLES = [
    {
      index: "01",
      icon: ShieldCheckIcon,
      title: "Zero Backend. 100% In-Browser.",
      description:
        "Every parser, cryptographic signer, PDF processor, and canvas renderer executes inside your local browser tab. Your production JSON logs, JWT secrets, and private documents never touch a network socket.",
    },
    {
      index: "02",
      icon: CpuIcon,
      title: "Engineered for Real Depth",
      description:
        "Built to handle complex engineering workflows rather than toy examples: multi-depth array key extraction, 10-space color math (OKLCH, LAB, CMYK), SVG-to-TSX AST conversion, and Shiki tokenization.",
    },
    {
      index: "03",
      icon: KeyboardIcon,
      title: "Zero Friction & Offline-Ready",
      description:
        "No sign-ups, no paywalls, no rate limits, no cookie banners, and no analytics trackers. Press Command+K or / from anywhere to filter tools and jump straight into your workflow.",
    },
    {
      index: "04",
      icon: CodeIcon,
      title: "Open-Source Craft by Ram",
      description:
        "Designed and developed by Ram (ram.codes / @BlankRiser) with React 19, TanStack Router, Shiki, MapLibre GL, and WebCrypto. Inspect the source code or contribute directly on GitHub.",
    },
  ];

export const Principles = ()=>{
    return  <section className="border-b border-border/80 bg-card/30 py-14 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          Architecture & Privacy Guarantee
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Why engineers bookmark DevHaven Tools
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Most online developer utilities wrap simple scripts in ad-heavy pages or upload your
          data to remote servers. DevHaven Tools is architected as a local-first desktop-grade
          workbench inside your browser.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-4">
        {ARCHITECTURAL_PRINCIPLES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.index}
              className="flex flex-col justify-between bg-card p-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.index}
                  </span>
                  <Icon className="size-5 text-muted-foreground" weight="duotone" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
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
}