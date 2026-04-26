import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 150,
  sortPackageJson: false,
  sortTailwindcss: {
    stylesheet: "./src/styles.css",
    functions: ["clsx", "cn"],
    preserveWhitespace: true,
  },
  sortImports: {
    newlinesBetween: false,
    groups: [
      ["value-builtin", "value-external"],
      ["value-internal", "value-parent", "value-sibling", "value-index"],
      { newlinesBetween: true },
      "type-import",
      "unknown",
    ],
  },
});
