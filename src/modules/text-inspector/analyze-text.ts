export type FrequencyItem = {
  token: string;
  count: number;
  share: number;
};

export type TextAnalysis = {
  isEmpty: boolean;
  characters: number;
  codePoints: number;
  graphemes: number;
  bytes: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  letters: number;
  digits: number;
  punctuation: number;
  whitespace: number;
  other: number;
  ascii: number;
  nonAscii: number;
  avgWordLength: number;
  avgSentenceWords: number;
  longestWord: string;
  readingSeconds: number;
  speakingSeconds: number;
  wordFrequency: FrequencyItem[];
  letterFrequency: FrequencyItem[];
};

const EMPTY: TextAnalysis = {
  isEmpty: true,
  characters: 0,
  codePoints: 0,
  graphemes: 0,
  bytes: 0,
  words: 0,
  uniqueWords: 0,
  sentences: 0,
  paragraphs: 0,
  lines: 0,
  letters: 0,
  digits: 0,
  punctuation: 0,
  whitespace: 0,
  other: 0,
  ascii: 0,
  nonAscii: 0,
  avgWordLength: 0,
  avgSentenceWords: 0,
  longestWord: "",
  readingSeconds: 0,
  speakingSeconds: 0,
  wordFrequency: [],
  letterFrequency: [],
};

const MAX_FREQUENCY_ITEMS = 200;
const utf8Encoder = new TextEncoder();
const LETTER_RE = /\p{L}/u;
const DIGIT_RE = /\p{N}/u;
const PUNCT_RE = /\p{P}/u;
const WHITESPACE_RE = /\s/u;
const WORD_FALLBACK_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

const wordSegmenter = hasSegmenter() ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;
const sentenceSegmenter = hasSegmenter() ? new Intl.Segmenter(undefined, { granularity: "sentence" }) : null;
const graphemeSegmenter = hasSegmenter() ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

function hasSegmenter(): boolean {
  return typeof Intl !== "undefined" && "Segmenter" in Intl;
}

function toFrequency(map: Map<string, number>, total: number): FrequencyItem[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FREQUENCY_ITEMS)
    .map(([token, count]) => ({
      token,
      count,
      share: total === 0 ? 0 : count / total,
    }));
}

function forEachWord(text: string, visit: (word: string) => void): void {
  if (wordSegmenter) {
    for (const part of wordSegmenter.segment(text)) {
      if (part.isWordLike) visit(part.segment);
    }
    return;
  }
  const matches = text.match(WORD_FALLBACK_RE);
  if (!matches) return;
  for (const word of matches) visit(word);
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (sentenceSegmenter) {
    let count = 0;
    for (const part of sentenceSegmenter.segment(trimmed)) {
      if (part.segment.trim()) count += 1;
    }
    return count;
  }
  return trimmed.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0).length;
}

function countGraphemes(text: string, codePoints: number): number {
  if (!graphemeSegmenter) return codePoints;
  let count = 0;
  for (const _part of graphemeSegmenter.segment(text)) {
    count += 1;
  }
  return count;
}

export function analyzeText(text: string): TextAnalysis {
  if (!text) return EMPTY;

  let letters = 0;
  let digits = 0;
  let punctuation = 0;
  let whitespace = 0;
  let other = 0;
  let ascii = 0;
  let nonAscii = 0;
  let codePoints = 0;
  const letterCounts = new Map<string, number>();

  for (const char of text) {
    codePoints += 1;
    const code = char.codePointAt(0) ?? 0;
    if (code < 128) ascii += 1;
    else nonAscii += 1;

    if (WHITESPACE_RE.test(char)) {
      whitespace += 1;
    } else if (LETTER_RE.test(char)) {
      letters += 1;
      const key = char.toLocaleLowerCase();
      letterCounts.set(key, (letterCounts.get(key) ?? 0) + 1);
    } else if (DIGIT_RE.test(char)) {
      digits += 1;
    } else if (PUNCT_RE.test(char)) {
      punctuation += 1;
    } else {
      other += 1;
    }
  }

  const wordCounts = new Map<string, number>();
  let longestWord = "";
  let wordCharTotal = 0;
  let wordCount = 0;

  forEachWord(text, (word) => {
    wordCount += 1;
    wordCharTotal += word.length;
    if (word.length > longestWord.length) longestWord = word;
    const key = word.toLocaleLowerCase();
    wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
  });
  const sentenceCount = countSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length;
  const lines = text.split(/\r\n|\n|\r/).length;

  return {
    isEmpty: false,
    characters: text.length,
    codePoints,
    graphemes: countGraphemes(text, codePoints),
    bytes: utf8Encoder.encode(text).length,
    words: wordCount,
    uniqueWords: wordCounts.size,
    sentences: sentenceCount,
    paragraphs,
    lines,
    letters,
    digits,
    punctuation,
    whitespace,
    other,
    ascii,
    nonAscii,
    avgWordLength: wordCount === 0 ? 0 : wordCharTotal / wordCount,
    avgSentenceWords: sentenceCount === 0 ? 0 : wordCount / sentenceCount,
    longestWord,
    readingSeconds: wordCount === 0 ? 0 : Math.round((wordCount / 220) * 60),
    speakingSeconds: wordCount === 0 ? 0 : Math.round((wordCount / 150) * 60),
    wordFrequency: toFrequency(wordCounts, wordCount),
    letterFrequency: toFrequency(letterCounts, letters),
  };
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}

export function formatShare(share: number): string {
  if (share === 0) return "0%";
  if (share > 0 && share < 0.001) return "<0.1%";
  return `${(share * 100).toFixed(1)}%`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 sec";
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds} sec`);
  return parts.join(" ") || "0 sec";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
