export interface MapThemePreset {
  id: string;
  name: string;
  theme: "light" | "dark" | "system";
  colors?: {
    background: string;
    water: string;
    roads: string;
    highways: string;
    buildings: string;
    text: string;
    admin: string;
  };
  hiddenGroups?: string[];
  isReset?: boolean;
}

export const MAP_PRESETS: MapThemePreset[] = [
  {
    id: "default",
    name: "Default (Original)",
    theme: "system",
    isReset: true,
  },
  // DARK THEMES
  {
    id: "dracula",
    name: "Dracula",
    theme: "dark",
    colors: {
      background: "#282a36",
      water: "#6272a4",
      roads: "#44475a",
      highways: "#ff79c6",
      buildings: "#282a36",
      text: "#f8f8f2",
      admin: "#6272a4",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "one-atom-dark",
    name: "One Atom Dark",
    theme: "dark",
    colors: {
      background: "#282c34",
      water: "#61afef",
      roads: "#3e4451",
      highways: "#c678dd",
      buildings: "#282c34",
      text: "#abb2bf",
      admin: "#5c6370",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "catppuccin",
    name: "Catppuccin Mocha",
    theme: "dark",
    colors: {
      background: "#1e1e2e",
      water: "#89b4fa",
      roads: "#313244",
      highways: "#cba6f7",
      buildings: "#181825",
      text: "#cdd6f4",
      admin: "#585b70",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "flexoki",
    name: "Flexoki Dark",
    theme: "dark",
    colors: {
      background: "#100F0F",
      water: "#24837B",
      roads: "#1C1B1A",
      highways: "#D14D41",
      buildings: "#1C1B1A",
      text: "#CECDC3",
      admin: "#878580",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "nightowl",
    name: "Night Owl",
    theme: "dark",
    colors: {
      background: "#011627",
      water: "#82aaff",
      roads: "#0b2942",
      highways: "#c792ea",
      buildings: "#01111d",
      text: "#d6deeb",
      admin: "#5f7e97",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "nord",
    name: "Nord",
    theme: "dark",
    colors: {
      background: "#2e3440",
      water: "#81a1c1",
      roads: "#3b4252",
      highways: "#b48ead",
      buildings: "#2e3440",
      text: "#eceff4",
      admin: "#4c566a",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "gruvbox",
    name: "Gruvbox Dark",
    theme: "dark",
    colors: {
      background: "#282828",
      water: "#83a598",
      roads: "#3c3836",
      highways: "#d3869b",
      buildings: "#282828",
      text: "#ebdbb2",
      admin: "#928374",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  // LIGHT THEMES
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    theme: "light",
    colors: {
      background: "#eff1f5",
      water: "#7287fd",
      roads: "#ccd0da",
      highways: "#8839ef",
      buildings: "#e6e9ef",
      text: "#4c4f69",
      admin: "#bcc0cc",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "github-light",
    name: "GitHub Light",
    theme: "light",
    colors: {
      background: "#ffffff",
      water: "#0550ae",
      roads: "#d0d7de",
      highways: "#cf222e",
      buildings: "#f6f8fa",
      text: "#24292f",
      admin: "#afb8c1",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    theme: "light",
    colors: {
      background: "#fdf6e3",
      water: "#268bd2",
      roads: "#eee8d5",
      highways: "#dc322f",
      buildings: "#fdf6e3",
      text: "#657b83",
      admin: "#93a1a1",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "rose-pine-dawn",
    name: "Rosé Pine Dawn",
    theme: "light",
    colors: {
      background: "#faf4ed",
      water: "#286983",
      roads: "#dfdad9",
      highways: "#b4637a",
      buildings: "#f2e9e1",
      text: "#575279",
      admin: "#9893a5",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
  {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    theme: "light",
    colors: {
      background: "#fbf1c7",
      water: "#458588",
      roads: "#ebdbb2",
      highways: "#cc241d",
      buildings: "#fbf1c7",
      text: "#3c3836",
      admin: "#a89984",
    },
    hiddenGroups: ["poi", "housenumber", "aeroway", "landcover", "landuse", "park", "building"],
  },
];
