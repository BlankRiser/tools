import { useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Label } from "#/components/ui/label";
import { MAP_PRESETS, type MapThemePreset } from "../../data/map-theme-presets";

interface ThemePresetSelectorProps {
  applyPreset: (preset: MapThemePreset, preserveLayers?: boolean) => void;
  isReady: boolean;
}

function PresetColorSwatches({ colors }: { colors: NonNullable<MapThemePreset["colors"]> }) {
  return (
    <div className="flex items-center -space-x-1">
      <div
        className="z-4 h-3.5 w-3.5 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: colors.background }}
        title="Background"
      />
      <div
        className="z-3 h-3.5 w-3.5 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: colors.water }}
        title="Water"
      />
      <div
        className="z-2 h-3.5 w-3.5 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: colors.roads }}
        title="Roads"
      />
      <div
        className="z-1 h-3.5 w-3.5 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: colors.highways }}
        title="Highways"
      />
    </div>
  );
}

export function ThemePresetSelector({ applyPreset, isReady }: ThemePresetSelectorProps) {
  const defaultPreset = MAP_PRESETS.find((p) => p.id === "default")!;
  const [selectedPreset, setSelectedPreset] = useState<MapThemePreset>(defaultPreset);
  const [preserveLayers, setPreserveLayers] = useState(false);

  const renderPresetItem = (preset: MapThemePreset) => {
    return (
      <SelectItem key={preset.id} value={preset.id}>
        <div className="flex w-full items-center justify-between">
          <span>{preset.name}</span>
          {preset.colors && <PresetColorSwatches colors={preset.colors} />}
        </div>
      </SelectItem>
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Theme Preset</h2>
        <Select
          defaultValue="default"
          onValueChange={(val) => {
            const preset = MAP_PRESETS.find((p) => p.id === val);
            if (preset) {
              setSelectedPreset(preset);
              applyPreset(preset, preserveLayers);
            }
          }}
        >
          <SelectTrigger disabled={!isReady} className="w-full">
            <span className="flex flex-1 items-center justify-between gap-2 text-left">
              <span className="truncate">{selectedPreset.name}</span>
              {selectedPreset.colors && <PresetColorSwatches colors={selectedPreset.colors} />}
            </span>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              <SelectLabel>System</SelectLabel>
              {MAP_PRESETS.filter((p) => p.theme === "system").map(renderPresetItem)}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Light</SelectLabel>
              {MAP_PRESETS.filter((p) => p.theme === "light").map(renderPresetItem)}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Dark</SelectLabel>
              {MAP_PRESETS.filter((p) => p.theme === "dark").map(renderPresetItem)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="preserve-layers" 
          checked={preserveLayers}
          onCheckedChange={setPreserveLayers}
          disabled={!isReady}
        />
        <Label htmlFor="preserve-layers" className="text-xs text-muted-foreground font-normal leading-tight cursor-pointer select-none">
          Preserve custom layer visibility
        </Label>
      </div>
    </div>
  );
}
