const FAQ_ITEMS = [
    {
      question: "Is any of my data ever sent to a backend server?",
      answer:
        "Never. DevHaven Tools is a static, client-side web application. All transformations, including JSON/CSV querying, JWT signature verification, PDF encryption/decryption, Base64 encoding, and Shapefile parsing, run locally in your browser's JavaScript and WebAssembly runtime.",
    },
    {
      question: "Can I safely paste sensitive production JSON, JWTs, or private PDFs?",
      answer:
        "Yes. Because zero network requests are made with your input payloads, you can safely inspect production API responses, decode internal JWT tokens, and merge or unlock confidential PDF documents without data-leakage risk.",
    },
    {
      question: "What developer tools are included in DevHaven Tools?",
      answer:
        "DevHaven Tools includes 24+ utilities across four categories: Converters & Formatters (JSON & JSONL Formatter, Data Explorer, Data Format Converter, HTML to JSX/TSX Converter, Gradient & Texture Studio, Color Converter, Date Converter, Cron Expression Builder, PDF Organizer), Text & Regex (Diff Checker, Regex Tester, Sort Text, Markdown to Rich Text, Markdown Stripper, Markdown TOC, String Case Converter, Text Inspector), Encoding & Web (JWT Encoder/Decoder, URL Parser, Base64 Image Codec, QR Code Generator), and Geospatial & Maps (Map Wallpaper, GeoJSON & Shapefile Viewer, Bounding Box Picker, Distance Calculator).",
    },
    {
      question: "Who created DevHaven Tools?",
      answer:
        "DevHaven Tools was created and is maintained by Ram. You can explore more of Ram's work at ram.codes or view the open-source repositories on GitHub at github.com/BlankRiser.",
    },
  ];
  
export const Faq = ()=>{
    return <section className="py-14 sm:py-16">
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          Frequently Asked Questions
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          Privacy, security, and technical details
        </h2>
      </div>
  
      <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card">
        {FAQ_ITEMS.map((faq) => (
          <details
            key={faq.question}
            className="group p-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-foreground select-none">
              <span>{faq.question}</span>
              <span className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
  }