export type CaseId =
  | "camel"
  | "pascal"
  | "snake"
  | "constant"
  | "kebab"
  | "cobol"
  | "train"
  | "dot"
  | "path"
  | "title"
  | "sentence"
  | "lower"
  | "upper"
  | "swap";

export type CaseConversion = {
  id: CaseId;
  label: string;
  example: string;
  convert: (input: string) => string;
};

const WORD_SPLIT = /[^\p{L}\p{N}]+/u;
const CAMEL_SPLIT = /(?<=\p{Ll}|\p{N})(?=\p{Lu})|(?<=\p{Lu})(?=\p{Lu}\p{Ll})/u;

export function splitWords(input: string): string[] {
  const withoutApos = input.replace(/['’]/g, "");
  const chunks = withoutApos.split(WORD_SPLIT);
  const words: string[] = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    for (const piece of chunk.split(CAMEL_SPLIT)) {
      if (piece) words.push(piece);
    }
  }
  return words;
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}

function mapLines(input: string, convertLine: (line: string) => string): string {
  return input
    .split(/\r\n|\n|\r/)
    .map(convertLine)
    .join("\n");
}

function fromWords(input: string, join: (words: string[]) => string): string {
  return mapLines(input, (line) => {
    if (!line.trim()) return line;
    const leading = line.match(/^\s*/)?.[0] ?? "";
    const trailing = line.match(/\s*$/)?.[0] ?? "";
    const words = splitWords(line);
    if (words.length === 0) return line;
    return `${leading}${join(words)}${trailing}`;
  });
}

export function toCamelCase(input: string): string {
  return fromWords(input, (words) => words.map((word, index) => (index === 0 ? word.toLocaleLowerCase() : capitalize(word))).join(""));
}

export function toPascalCase(input: string): string {
  return fromWords(input, (words) => words.map(capitalize).join(""));
}

export function toSnakeCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleLowerCase()).join("_"));
}

export function toConstantCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleUpperCase()).join("_"));
}

export function toKebabCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleLowerCase()).join("-"));
}

export function toCobolCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleUpperCase()).join("-"));
}

export function toTrainCase(input: string): string {
  return fromWords(input, (words) => words.map(capitalize).join("-"));
}

export function toDotCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleLowerCase()).join("."));
}

export function toPathCase(input: string): string {
  return fromWords(input, (words) => words.map((word) => word.toLocaleLowerCase()).join("/"));
}

export function toTitleCase(input: string): string {
  return fromWords(input, (words) => words.map(capitalize).join(" "));
}

export function toSentenceCase(input: string): string {
  return fromWords(input, (words) => words.map((word, index) => (index === 0 ? capitalize(word) : word.toLocaleLowerCase())).join(" "));
}

export function toLowerCase(input: string): string {
  return input.toLocaleLowerCase();
}

export function toUpperCase(input: string): string {
  return input.toLocaleUpperCase();
}

export function toSwapCase(input: string): string {
  let result = "";
  for (const char of input) {
    const lower = char.toLocaleLowerCase();
    const upper = char.toLocaleUpperCase();
    if (char !== lower && char === upper) result += lower;
    else if (char !== upper && char === lower) result += upper;
    else result += char;
  }
  return result;
}

export const CASE_CONVERSIONS: CaseConversion[] = [
  { id: "camel", label: "camelCase", example: "helloWorld", convert: toCamelCase },
  { id: "pascal", label: "PascalCase", example: "HelloWorld", convert: toPascalCase },
  { id: "snake", label: "snake_case", example: "hello_world", convert: toSnakeCase },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD", convert: toConstantCase },
  { id: "kebab", label: "kebab-case", example: "hello-world", convert: toKebabCase },
  { id: "cobol", label: "COBOL-CASE", example: "HELLO-WORLD", convert: toCobolCase },
  { id: "train", label: "Train-Case", example: "Hello-World", convert: toTrainCase },
  { id: "dot", label: "dot.case", example: "hello.world", convert: toDotCase },
  { id: "path", label: "path/case", example: "hello/world", convert: toPathCase },
  { id: "title", label: "Title Case", example: "Hello World", convert: toTitleCase },
  { id: "sentence", label: "Sentence case", example: "Hello world", convert: toSentenceCase },
  { id: "lower", label: "lowercase", example: "hello world", convert: toLowerCase },
  { id: "upper", label: "UPPERCASE", example: "HELLO WORLD", convert: toUpperCase },
  { id: "swap", label: "Swap Case", example: "hELLO wORLD", convert: toSwapCase },
];
