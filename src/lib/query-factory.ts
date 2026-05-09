import { queryOptions } from "@tanstack/react-query";
import { apiClient, type GeoCodedSearchAPI, type GeoCodedDetailsAPI } from "./api-client";

export const geoCodedQueryOptions = (apiParams: GeoCodedSearchAPI) =>
  queryOptions({
    queryKey: ["geocoded", apiParams],
    queryFn: async () => {
      return await apiClient().geocoded().search({
        ...apiParams,
        limit: apiParams.limit ?? 25,
        offset: apiParams.offset ?? 0,
        query: apiParams.query,
        type: apiParams.type,
      });
    },
  });

export const geoCodedLocationDetailsQueryOptions = (apiParams: GeoCodedDetailsAPI) =>
  queryOptions({
    queryKey: ["geocoded", "details", apiParams],
    queryFn: async () => {
      return await apiClient().geocoded().getLocationDetails(apiParams);
    },
  });