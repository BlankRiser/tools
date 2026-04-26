import { useTheme } from "#/hooks/use-theme";
import { Map, type MapProps } from "@vis.gl/react-maplibre";
import { forwardRef } from "react";

export const MAP_STYLES = {
  // Free tile service: https://openfreemap.org/quick_start/
  "openfreemap-liberty": "https://tiles.openfreemap.org/styles/liberty",

  "OSM Bright":
    "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json",
  Positron: "https://openmaptiles.github.io/positron-gl-style/style-cdn.json",
  "Dark Matter":
    "https://openmaptiles.github.io/dark-matter-gl-style/style-cdn.json",
  "MapTiler Basic":
    "https://openmaptiles.github.io/maptiler-basic-gl-style/style-cdn.json",
};

export const MapWrapper = forwardRef<any, MapProps>(
  ({ children, ...mapProps }, ref) => {
    const { theme } = useTheme();

    const mapStyle =
      theme === "dark"
        ? "/assets/dark-map.json"
        : MAP_STYLES["openfreemap-liberty"];

    return (
      <Map
        ref={ref}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        {...mapProps}
      >
        {children}
      </Map>
    );
  },
);

MapWrapper.displayName = "MapWrapper";
