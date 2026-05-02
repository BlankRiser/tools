import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useQRCodeStore } from "./use-qr-code-store";

export function QRCodePreview() {
  const { text, errorCorrection, darkColor, lightColor, margin, mode } = useQRCodeStore();

  const { data: qrUrl } = useQuery({
    queryKey: ["qrcode", text, errorCorrection, darkColor, lightColor, margin, mode],
    queryFn: async () => {
      if (!text) {
        return "";
      }
      const input = mode === "auto" ? text : ([{ data: text, mode: mode as any }] as any);

      return await QRCode.toDataURL(input, {
        errorCorrectionLevel: errorCorrection === "low" ? "L" : errorCorrection === "medium" ? "M" : errorCorrection === "quartile" ? "Q" : "H",
        margin: parseInt(margin, 10) || 4,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
    },
  });

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-4">
      <Label className="text-lg font-semibold">Preview</Label>
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-8 shadow-sm">
        {qrUrl ? (
          <div className="flex w-full flex-col items-center gap-8">
            <div className="overflow-hidden rounded-xl border bg-white p-4 shadow-md transition-all">
              <img src={qrUrl} alt="Generated QR Code" className="h-[220px] w-[220px] object-contain" />
            </div>
            <Button size="lg" onClick={handleDownload} className="w-full gap-2 font-semibold">
              <DownloadSimpleIcon className="h-5 w-5" />
              Download QR Code
            </Button>
          </div>
        ) : (
          <div className="flex h-[240px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground">
            <span className="text-sm">No content provided</span>
          </div>
        )}
      </div>
    </div>
  );
}
