import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty, ComboboxGroup, ComboboxLabel } from "#/components/ui/combobox";
import { InputGroupAddon } from "#/components/ui/input-group";
import { useDebounce } from "#/hooks/use-debounce";
import { geoCodedQueryOptions, geoCodedLocationDetailsQueryOptions } from "#/lib/query-factory";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMap } from "@vis.gl/react-maplibre";
import { useState } from "react";
import { toast } from "sonner";

import type { GeoCodedSearchResult } from "#/lib/api-client";

export function LocationSearch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { "wallpaper-map": mapInfo } = useMap();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const debouncedQuery = useDebounce(inputValue, 300);

  const map = mapInfo?.getMap();

  const enabled = debouncedQuery.length > 1;

  const cityQuery = useQuery({
    ...geoCodedQueryOptions({ query: debouncedQuery, type: "city", limit: 5 }),
    enabled,
  });

  const isLoading = cityQuery.isLoading;

  const handleSelect = async (value: string | null) => {
    if (!value) return;

    const [type, locId, countryCode] = value.split(":");

    setOpen(false);

    try {
      const details = await queryClient.fetchQuery(
        geoCodedLocationDetailsQueryOptions({
          type: type as any,
          locId,
          countryCode: countryCode || undefined,
        }),
      );

      if (details?.latitude && details?.longitude) {
        const lat = parseFloat(details.latitude);
        const lng = parseFloat(details.longitude);
        const zoom = type === "country" ? 4 : type === "state" ? 6 : 11;

        if (map) {
          map.flyTo({ center: [lng, lat], zoom, duration: 1500 });
        }

        navigate({
          from: "/tools/$toolID/",
          search: (prev: any) => ({
            ...prev,
            q: details.name,
            type: type as any,
            locId: locId,
            cc: countryCode || undefined,
          }),
        });
      }
    } catch {
      toast.error("Failed to load location details");
    }
  };

  const renderResults = (title: string, data: GeoCodedSearchResult[] | undefined) => {
    if (!data || data.length === 0) return null;
    return (
      <ComboboxGroup>
        <ComboboxLabel>{title}</ComboboxLabel>
        {data.map((item) => {
          const locId = item.type === "city" ? item.geonameId : item.type === "state" ? item.stateCode : item.countryCode;
          const value = `${item.type}:${locId}:${item.countryCode}`;
          const subtitle = [item.stateName, item.countryName].filter(Boolean).join(", ");

          return (
            <ComboboxItem key={value} value={value} className="flex flex-col items-start py-1.5">
              <span className="font-medium">{item.name}</span>
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </ComboboxItem>
          );
        })}
      </ComboboxGroup>
    );
  };

  const hasResults = (cityQuery.data?.data?.length ?? 0) > 0;

  return (
    <Combobox open={open} onOpenChange={setOpen} inputValue={inputValue} onInputValueChange={setInputValue} onValueChange={handleSelect} value={null}>
      <div className="relative">
        <ComboboxInput placeholder="Search cities..." showTrigger={false} showClear={inputValue.length > 0} className="w-full">
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
        </ComboboxInput>
      </div>
      <ComboboxContent alignOffset={-20} align="start">
        <ComboboxList>
          {!enabled ? (
            <ComboboxEmpty>Type to search...</ComboboxEmpty>
          ) : isLoading ? (
            <ComboboxEmpty>Searching...</ComboboxEmpty>
          ) : !hasResults ? (
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          ) : (
            <>{renderResults("Cities", cityQuery.data?.data)}</>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
