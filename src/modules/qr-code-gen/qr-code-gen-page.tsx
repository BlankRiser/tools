import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { QRCodeContent } from "./qr-code-content";
import { QRCodePreview } from "./qr-code-preview";

export default function QRCodeGenPage() {
  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="mt-2 text-muted-foreground">Generate a QR code for any text or URL.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <QRCodeContent />
          <QRCodePreview />
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}