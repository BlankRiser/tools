export const REGEX_FLAGS = [
  { id: "g", label: "g", hint: "Global" },
  { id: "i", label: "i", hint: "Ignore case" },
  { id: "m", label: "m", hint: "Multiline" },
  { id: "s", label: "s", hint: "DotAll" },
  { id: "u", label: "u", hint: "Unicode" },
  { id: "v", label: "v", hint: "Unicode sets" },
  { id: "y", label: "y", hint: "Sticky" },
  { id: "d", label: "d", hint: "Indices" },
] as const;

export type RegexFlagId = (typeof REGEX_FLAGS)[number]["id"];

export type CaptureGroup = {
  name: string | null;
  value: string | undefined;
  start: number | null;
  end: number | null;
};

export type RegexMatch = {
  match: string;
  index: number;
  end: number;
  groups: CaptureGroup[];
};

export type RegexRun =
  | { ok: true; matches: RegexMatch[]; source: string }
  | { ok: false; error: string };

const MAX_MATCHES = 500;

export function flagsToString(flags: readonly RegexFlagId[]): string {
  return REGEX_FLAGS.map((flag) => flag.id)
    .filter((id) => flags.includes(id))
    .join("");
}

export function runRegex(pattern: string, flags: readonly RegexFlagId[], text: string): RegexRun {
  if (!pattern) {
    return { ok: true, matches: [], source: "" };
  }

  const flagString = flagsToString(flags);
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flagString);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid regular expression.",
    };
  }

  const matches: RegexMatch[] = [];
  const global = regex.global || regex.sticky;
  regex.lastIndex = 0;

  for (let i = 0; i < MAX_MATCHES; i++) {
    const result = regex.exec(text);
    if (!result || result.index == null) break;

    matches.push(toMatch(result));

    if (!global) break;

    if (result[0].length === 0) {
      regex.lastIndex = result.index + 1;
      if (regex.lastIndex > text.length) break;
    }
  }

  return { ok: true, matches, source: `/${pattern}/${flagString}` };
}

type ExecIndices = Array<[number, number] | undefined> & {
  groups?: Record<string, [number, number] | undefined>;
};

function toMatch(result: RegExpExecArray): RegexMatch {
  const indices = (result as RegExpExecArray & { indices?: ExecIndices }).indices;
  const nameBySpan = new Map<string, string>();
  if (indices?.groups) {
    for (const [name, span] of Object.entries(indices.groups)) {
      if (span) nameBySpan.set(`${span[0]}:${span[1]}`, name);
    }
  }

  const usedNames = new Set<string>();
  const groups: CaptureGroup[] = [];
  for (let i = 1; i < result.length; i++) {
    const span = indices?.[i];
    let name = span ? (nameBySpan.get(`${span[0]}:${span[1]}`) ?? null) : null;
    if (!name && result.groups && result[i] !== undefined) {
      for (const [groupName, groupValue] of Object.entries(result.groups)) {
        if (groupValue === result[i] && !usedNames.has(groupName)) {
          name = groupName;
          usedNames.add(groupName);
          break;
        }
      }
    } else if (name) {
      usedNames.add(name);
    }

    groups.push({
      name,
      value: result[i],
      start: span ? span[0] : null,
      end: span ? span[1] : null,
    });
  }

  return {
    match: result[0],
    index: result.index,
    end: result.index + result[0].length,
    groups,
  };
}
