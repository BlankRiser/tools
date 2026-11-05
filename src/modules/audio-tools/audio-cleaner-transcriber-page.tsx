import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { FileArrowUpIcon, SparkleIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Output = {
  enhanced?: Blob;
  transcript?: string;
  language?: string;
  turns?: Array<{ speaker: number; start: number; end: number }>;
  words?: Array<{ text: string; start: number; end: number }>;
};
export default function AudioCleanerTranscriberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [output, setOutput] = useState<Output>({});
  const [audioUrl, setAudioUrl] = useState("");
  const models = useRef<{ clear?: any; ear?: any; voz?: any; who?: any; tongue?: any }>({});
  useEffect(
    () => () => {
      Object.values(models.current).forEach((model) => model?.dispose());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );
  async function process() {
    if (!file) {
      toast.error("Choose an audio file first");
      return;
    }
    setBusy(true);
    setOutput({});
    try {
      setStage("Loading speech models (first use downloads and caches them)…");
      const [{ Clear }, { Ear }, { Voz }, { Who }, { Tongue }] = await Promise.all([
        import("@desert-ant-labs/clear"),
        import("@desert-ant-labs/ear"),
        import("@desert-ant-labs/voz"),
        import("@desert-ant-labs/who"),
        import("@desert-ant-labs/tongue"),
      ]);
      models.current.clear ??= await Clear.load();
      models.current.ear ??= await Ear.load();
      models.current.voz ??= await Voz.load();
      models.current.who ??= await Who.load();
      models.current.tongue ??= await Tongue.load();
      setStage("Cleaning audio…");

      const samples = new Float32Array(await file.arrayBuffer());
      const enhanced = await models.current.clear.enhance(samples, 48_000);
      setStage("Detecting language and transcribing…");

      const detection = await models.current.ear.identify(file, 16_000);
      const transcript = await models.current.voz.transcribe(file);
      const textLanguage = await models.current.tongue.identify(transcript.text);
      setStage("Labeling speakers…");

      const speakers = await models.current.who.diarize(file);
      const wav = new Blob([new Uint8Array(enhanced)], { type: "audio/wav" });
      
      setAudioUrl(URL.createObjectURL(wav));
      setOutput({
        enhanced: wav,
        transcript: transcript.text,
        words: transcript.words,
        language: `${detection.language ?? "Unknown"}${detection.isReliable ? "" : " (uncertain)"} · text: ${textLanguage.language ?? "Unknown"}`,
        turns: speakers.turns,
      });
      setStage("");
    } catch (error) {
      console.error(error);
      setStage("");
      toast.error("Could not process this audio. Check the file format and connection, then try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Audio Cleaner &amp; Transcriber</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Clean speech, transcribe it, detect language, and label speakers locally in your browser.
          </p>
        </header>
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-5">
          <label className="flex items-center gap-2 text-sm">
            <FileArrowUpIcon />
            Audio file
            <input
              type="file"
              accept="audio/*"
              className="ml-2"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setOutput({});
              }}
            />
          </label>
          <Button onClick={() => void process()} disabled={!file || busy}>
            <SparkleIcon data-icon="inline-start" />
            {busy ? "Processing…" : "Clean and transcribe"}
          </Button>
          {stage && (
            <p role="status" className="w-full text-sm text-muted-foreground">
              {stage}
            </p>
          )}
        </section>
        {output.transcript && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="font-semibold">Enhanced audio</h2>
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} download="enhanced-audio.wav" className="text-sm text-primary underline">
                Download enhanced WAV
              </a>
              <p className="text-sm text-muted-foreground">Spoken language: {output.language}</p>
            </section>
            <section className="space-y-3">
              <h2 className="font-semibold">Transcript</h2>
              <p className="rounded-lg border bg-card p-4 text-sm whitespace-pre-wrap">{output.transcript}</p>
              <div className="max-h-48 overflow-auto text-sm">
                <h3 className="font-medium">Word timestamps</h3>
                {output.words?.map((word, i) => (
                  <span key={i} className="mr-2">
                    {word.text} <small className="text-muted-foreground">{word.start.toFixed(2)}s</small>
                  </span>
                ))}
              </div>
              <h3 className="font-medium">Speaker turns</h3>
              {output.turns?.map((turn, i) => (
                <p key={i} className="text-sm">
                  Speaker {turn.speaker + 1}: {turn.start.toFixed(1)}–{turn.end.toFixed(1)}s
                </p>
              ))}
            </section>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
}
