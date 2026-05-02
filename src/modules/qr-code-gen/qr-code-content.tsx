import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useQRCodeStore } from "./use-qr-code-store";

export function QRCodeContent() {
  const { text, setText, errorCorrection, setErrorCorrection, darkColor, setDarkColor, lightColor, setLightColor, margin, setMargin, mode, setMode } = useQRCodeStore();

  return (
    <div className="col-span-1 flex flex-col gap-4 lg:col-span-2">
      <div className="flex flex-col gap-2">
        <Label className="text-lg font-semibold">Content</Label>
        <Textarea
          className="h-[200px] resize-none font-mono"
          placeholder="Enter text or URL here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Encoding Mode</Label>
          <Select value={mode} onValueChange={(v: any) => setMode(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Default)</SelectItem>
              <SelectItem value="numeric">Numeric</SelectItem>
              <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
              <SelectItem value="byte">Byte</SelectItem>
              <SelectItem value="kanji">Kanji</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Error Correction Level</Label>
          <Select value={errorCorrection} onValueChange={(v: any) => setErrorCorrection(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (7%)</SelectItem>
              <SelectItem value="medium">Medium (15%)</SelectItem>
              <SelectItem value="quartile">Quartile (25%)</SelectItem>
              <SelectItem value="high">High (30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Margin (px)</Label>
          <Input type="number" min="0" max="20" value={margin} onChange={(e) => setMargin(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Foreground Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
