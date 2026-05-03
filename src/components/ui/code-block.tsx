import { cn } from "#/lib/utils";
import { useEffect, useState } from "react";
import { codeToHtml, type BundledTheme } from "shiki/bundle/web";

type CodeBlockProps = {
  code: string;
  isHidden?: boolean;
  language?: string;
  lightTheme?: BundledTheme;
  darkTheme?: BundledTheme;
};

export const CodeBlock = ({ code, isHidden, language = "plain", lightTheme = "github-light", darkTheme = "github-dark" }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    codeToHtml(code, {
      lang: language,
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
    }).then((value) => {
      setHtml(value);
    });
  }, [code, language, lightTheme, darkTheme]);

  return <div className={cn([isHidden ? "hidden" : "overflow-auto rounded-md p-2"])} dangerouslySetInnerHTML={{ __html: html }} />;
};
