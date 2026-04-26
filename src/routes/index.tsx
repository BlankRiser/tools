import { Button } from "#/components/ui/button";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CalendarIcon,
  CodeIcon,
  CursorTextIcon,
  EyeIcon,
  FileCodeIcon,
  GlobeIcon,
  HashIcon,
  ImageIcon,
  LinkIcon,
  ListBulletsIcon,
  MapTrifoldIcon,
  PaletteIcon,
  QrCodeIcon,
  RocketLaunchIcon,
  RulerIcon,
  TableIcon,
  TextAaIcon
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const features = [
  {
    icon: MapTrifoldIcon,
    title: "Map Wallpaper",
    description: "Design high-res map wallpapers with custom themes and granular layer controls.",
  },
  {
    icon: QrCodeIcon,
    title: "QR Code Generator",
    description: "Generate QR codes from any text or URL with customizable size and styling options.",
  },
  {
    icon: CursorTextIcon,
    title: "Text Inspector",
    description: "Analyze characters, bytes, words, lines, ASCII/Unicode usage, and word frequency.",
  },
  {
    icon: PaletteIcon,
    title: "Color Generator",
    description: "Generate, convert, and explore color palettes across HEX, RGB, HSL, and more.",
  },
  {
    icon: CalendarIcon,
    title: "Date Converter",
    description: "Convert dates across timezones and UTC with flexible formatting options.",
  },
  {
    icon: RulerIcon,
    title: "Unit Converter",
    description: "Convert between SI units — length, mass, temperature, volume, and more.",
  },
  {
    icon: ArrowsClockwiseIcon,
    title: "Diff Checker",
    description: "Compare two texts side-by-side and highlight additions, deletions, and changes.",
  },
  {
    icon: ListBulletsIcon,
    title: "Sort Text",
    description: "Sort lines alphabetically with options to filter duplicates and strip numbers.",
  },
  {
    icon: EyeIcon,
    title: "Markdown Previewer",
    description: "Write Markdown and see a live-rendered preview side by side.",
  },
  {
    icon: LinkIcon,
    title: "URL Parser",
    description: "Break down URLs into protocol, host, path, query params, and fragment.",
  },
  {
    icon: HashIcon,
    title: "Regex Tester",
    description: "Test regular expressions with live matching, capture groups, and flag toggles.",
  },
  {
    icon: FileCodeIcon,
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting and error reporting.",
  },
  {
    icon: ImageIcon,
    title: "Base64 Image Codec",
    description: "Encode images to Base64 strings or decode Base64 back to viewable images.",
  },
  {
    icon: TableIcon,
    title: "JSON ↔ CSV",
    description: "Convert between JSON and CSV formats with automatic column detection.",
  },
  {
    icon: TextAaIcon,
    title: "String Case Converter",
    description: "Transform text between camelCase, snake_case, kebab-case, Title Case, and more.",
  },
  {
    icon: GlobeIcon,
    title: "More coming soon",
    description: "A growing toolkit of developer-focused utilities — built in the open.",
  },
];

function Home() {
  return (
    <div className="relative flex min-h-[calc(100dvh-2.8rem)] flex-col overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/10 blur-[120px]"
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <RocketLaunchIcon className="size-3.5 text-primary" weight="fill" />
          Open-source developer toolkit
        </span>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Build faster with{" "}
          <span className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            DevHaven Tools
          </span>
        </h1>

        <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          A curated collection of visual utilities, generators, and
          visualizers — designed for developers who care about craft.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link to="/tools">
            <Button size="lg" className="gap-2">
              Explore tools
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="gap-2">
              <CodeIcon className="size-4" />
              Source
            </Button>
          </a>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/80"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <f.icon className="size-5" weight="duotone" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer accent line */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
