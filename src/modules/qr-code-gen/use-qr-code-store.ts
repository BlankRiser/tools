import { create } from "zustand";

interface QRCodeState {
  text: string;
  errorCorrection: "low" | "medium" | "quartile" | "high";
  darkColor: string;
  lightColor: string;
  margin: string;
  mode: "auto" | "numeric" | "alphanumeric" | "byte" | "kanji";

  setText: (text: string) => void;
  setErrorCorrection: (level: "low" | "medium" | "quartile" | "high") => void;
  setDarkColor: (color: string) => void;
  setLightColor: (color: string) => void;
  setMargin: (margin: string) => void;
  setMode: (mode: "auto" | "numeric" | "alphanumeric" | "byte" | "kanji") => void;
}

export const useQRCodeStore = create<QRCodeState>((set) => ({
  text: "https://example.com",
  errorCorrection: "medium",
  darkColor: "#000000",
  lightColor: "#ffffff",
  margin: "4",
  mode: "auto",

  setText: (text) => set({ text }),
  setErrorCorrection: (errorCorrection) => set({ errorCorrection }),
  setDarkColor: (darkColor) => set({ darkColor }),
  setLightColor: (lightColor) => set({ lightColor }),
  setMargin: (margin) => set({ margin }),
  setMode: (mode) => set({ mode }),
}));
