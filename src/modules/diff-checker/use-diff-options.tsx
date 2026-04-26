import { useReducer } from "react";

export type DiffOptionsState = {
  diffStyle: "split" | "unified";
  diffIndicators: "classic" | "bars" | "none";
  lineDiffType: "word-alt" | "word" | "char" | "none";
  theme: string;
  disableBackground: boolean;
  wrapLines: boolean;
  disableLineNumbers: boolean;
}

export type DiffOptionsAction =
  | { type: "SET_DIFF_STYLE"; payload: DiffOptionsState["diffStyle"] }
  | { type: "SET_DIFF_INDICATORS"; payload: DiffOptionsState["diffIndicators"] }
  | { type: "SET_LINE_DIFF_TYPE"; payload: DiffOptionsState["lineDiffType"] }
  | { type: "SET_THEME"; payload: string }
  | { type: "TOGGLE_BACKGROUND" }
  | { type: "TOGGLE_WRAP_LINES" }
  | { type: "TOGGLE_LINE_NUMBERS" };

function diffOptionsReducer(state: DiffOptionsState, action: DiffOptionsAction): DiffOptionsState {
  switch (action.type) {
    case "SET_DIFF_STYLE":
      return { ...state, diffStyle: action.payload };
    case "SET_DIFF_INDICATORS":
      return { ...state, diffIndicators: action.payload };
    case "SET_LINE_DIFF_TYPE":
      return { ...state, lineDiffType: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "TOGGLE_BACKGROUND":
      return { ...state, disableBackground: !state.disableBackground };
    case "TOGGLE_WRAP_LINES":
      return { ...state, wrapLines: !state.wrapLines };
    case "TOGGLE_LINE_NUMBERS":
      return { ...state, disableLineNumbers: !state.disableLineNumbers };
    default:
      return state;
  }
}

const initialDiffOptions: DiffOptionsState = {
  diffStyle: "split",
  diffIndicators: "bars",
  lineDiffType: "word-alt",
  theme: "pierre-dark",
  disableBackground: false,
  wrapLines: false,
  disableLineNumbers: false,
};


export function useDiffOptions() {
  const [options, dispatch] = useReducer(diffOptionsReducer, initialDiffOptions);

  return { options, dispatch };
}