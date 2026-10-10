import { useTheme } from "#/hooks/use-theme";
import { Map, type MapProps } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef } from "react";

export const MAP_STYLES = {
  // Free tile service: https://openfreemap.org/quick_start/
  "openfreemap-liberty": "https://tiles.openfreemap.org/styles/liberty",
  "openfreemap-dark": "https://tiles.openfreemap.org/styles/dark",

  "OSM Bright": "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json",
  Positron: "https://openmaptiles.github.io/positron-gl-style/style-cdn.json",
  "Dark Matter": "https://openmaptiles.github.io/dark-matter-gl-style/style-cdn.json",
  "MapTiler Basic": "https://openmaptiles.github.io/maptiler-basic-gl-style/style-cdn.json",
};

function resolveDark(theme: string): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const MapWrapper = forwardRef<any, MapProps>(({ children, mapStyle, ...mapProps }, ref) => {
  const { theme } = useTheme();

  const resolvedStyle = mapStyle ?? (resolveDark(theme) ? MAP_STYLES["openfreemap-dark"] : MAP_STYLES["openfreemap-liberty"]);

  return (
    <Map ref={ref} style={{ width: "100%", height: "100%" }} mapStyle={resolvedStyle} {...mapProps}>
      {children}
    </Map>
  );
});

MapWrapper.displayName = "MapWrapper";
