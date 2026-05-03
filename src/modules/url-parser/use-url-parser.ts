import { useReducer, useMemo } from "react";
import { z } from "zod";
import { isTrackingParam } from "./tracking-params";

export interface ParamItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isTracking: boolean;
}

interface State {
  inputUrl: string;
  isValid: boolean;
  parsedUrl: URL | null;
  searchParams: ParamItem[];
  hashParams: ParamItem[];
  hashString: string;
}

type Scope = "search" | "hash";

type Action =
  | { type: "SET_URL"; payload: string }
  | { type: "TOGGLE_PARAM"; scope: Scope; id: string }
  | { type: "UPDATE_PARAM"; scope: Scope; id: string; value: string };

const urlSchema = z.url();

const createParam = (scope: Scope, key: string, value: string, index: number, isTracking = false, enabled = true): ParamItem => ({
  id: `${scope}:${key}:${index}`,
  key,
  value,
  enabled,
  isTracking,
});

function parseUrl(inputUrl: string): Partial<State> {
  if (!inputUrl) {
    return {
      parsedUrl: null,
      isValid: true,
      searchParams: [],
      hashParams: [],
      hashString: "",
    };
  }

  const result = urlSchema.safeParse(inputUrl);
  if (!result.success) {
    return { parsedUrl: null, isValid: false };
  }

  try {
    const url = new URL(inputUrl);

    const searchParams = Array.from(url.searchParams.entries()).map(([key, value], index) => {
      const tracking = isTrackingParam(key);
      return createParam("search", key, value, index, tracking, !tracking);
    });

    const hash = url.hash.replace(/^#/, "");

    const hashParams = hash.includes("=")
      ? Array.from(new URLSearchParams(hash).entries()).map(([k, v], index) => createParam("hash", k, v, index))
      : [];

    return {
      parsedUrl: url,
      isValid: true,
      searchParams,
      hashParams,
      hashString: hash,
    };
  } catch {
    return { parsedUrl: null, isValid: false };
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_URL": {
      return {
        ...state,
        inputUrl: action.payload,
        ...parseUrl(action.payload),
      };
    }

    case "TOGGLE_PARAM": {
      const key = action.scope === "search" ? "searchParams" : "hashParams";
      return {
        ...state,
        [key]: state[key].map((p) => (p.id === action.id ? { ...p, enabled: !p.enabled } : p)),
      };
    }

    case "UPDATE_PARAM": {
      const key = action.scope === "search" ? "searchParams" : "hashParams";
      return {
        ...state,
        [key]: state[key].map((p) => (p.id === action.id ? { ...p, value: action.value } : p)),
      };
    }

    default:
      return state;
  }
}

const initialState: State = {
  inputUrl: "",
  isValid: true,
  parsedUrl: null,
  searchParams: [],
  hashParams: [],
  hashString: "",
};

export function useUrlParser() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const finalUrl = useMemo(() => {
    if (!state.parsedUrl) return "";

    const url = new URL(state.parsedUrl.toString());

    const buildParams = (params: ParamItem[]) => {
      const sp = new URLSearchParams();
      params.forEach((p) => {
        if (p.enabled) sp.append(p.key, p.value);
      });
      return sp.toString();
    };

    url.search = buildParams(state.searchParams);

    if (state.hashParams.length > 0) {
      const hash = buildParams(state.hashParams);
      url.hash = hash ? `#${hash}` : "";
    } else {
      url.hash = state.hashString ? `#${state.hashString}` : "";
    }

    return url.toString();
  }, [state]);

  return {
    ...state,
    setInputUrl: (url: string) => dispatch({ type: "SET_URL", payload: url }),

    toggleSearchParam: (id: string) => dispatch({ type: "TOGGLE_PARAM", scope: "search", id }),

    updateSearchParam: (id: string, value: string) => dispatch({ type: "UPDATE_PARAM", scope: "search", id, value }),

    toggleHashParam: (id: string) => dispatch({ type: "TOGGLE_PARAM", scope: "hash", id }),

    updateHashParam: (id: string, value: string) => dispatch({ type: "UPDATE_PARAM", scope: "hash", id, value }),

    finalUrl,
  };
}
