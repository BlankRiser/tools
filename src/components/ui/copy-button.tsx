import { Button } from "#/components/ui/button";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState, useCallback } from "react";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "icon" | "icon-sm" | "icon-xs";
  variant?: "ghost" | "outline" | "default";
}

export function CopyButton({ value, className, size = "icon-sm", variant = "ghost" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <Button variant={variant} size={size} className={className} onClick={handleCopy} title="Copy to clipboard">
      {copied ? <CheckIcon weight="bold" className="text-primary" /> : <CopyIcon weight="bold" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
}
