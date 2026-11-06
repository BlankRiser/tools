const FAQ_ITEMS = [
  {
    question: "Is any of my data ever sent to a backend server?",
    answer:
      "Never. DevHaven Tools is a 100% static, client-side web application. Every parser, cryptographic signature validator, PDF processor, and canvas renderer runs in your browser's local JavaScript and WebAssembly runtime. You can inspect DevTools Network tab or disconnect Wi-Fi to verify: zero outbound packets are sent.",
  },
  {
    question: "Can I safely paste confidential production payloads, customer records, and JWT secrets?",
    answer:
      "Yes. Because zero network requests are made with your payloads, you can safely inspect production API responses, verify internal JWT signing keys, and merge or unlock confidential PDF documents without data-leakage risk.",
  },
  {
    question: "What are the file size limits for PDFs, datasets, and images?",
    answer:
      "There are no artificial cloud upload limits, subscription paywalls, or bandwidth quotas. File processing is bounded solely by your device's available browser memory. You can comfortably manipulate multi-megabyte JSON trees, large Shapefile archives, and multi-page PDFs locally.",
  },
  {
    question: "Does DevHaven Tools work offline?",
    answer:
      "Yes. All application bundles, WebAssembly modules, and static assets are cached in your browser. Once loaded, every utility continues to work without an active internet connection.",
  },
  {
    question: "Is DevHaven Tools open source?",
    answer:
      "Yes. DevHaven Tools is created and maintained by Ram as an open-source project. You can inspect the complete source code, review algorithms, and contribute improvements directly on GitHub at github.com/BlankRiser/tools.",
  },
];

export const Faq = () => {
  return (
    <section className="border-t border-border/80 bg-background/50 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            Technical Specifications
          </p>
          <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Details on the client-side sandbox, cryptographic boundaries, and runtime execution.
          </p>
        </div>

        <div className="tech-crosshair-wrap divide-y divide-border/80 rounded-xl border border-border/80 bg-card shadow-xs">
          <span className="tech-crosshair-tl">+</span>
          <span className="tech-crosshair-tr">+</span>
          <span className="tech-crosshair-bl">+</span>
          <span className="tech-crosshair-br">+</span>

          {FAQ_ITEMS.map((faq) => (
            <details
              key={faq.question}
              className="group p-5.5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-base font-semibold text-foreground select-none transition-colors hover:text-primary">
                <span>{faq.question}</span>
                <span className="font-mono text-sm text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 font-sans text-xs leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};