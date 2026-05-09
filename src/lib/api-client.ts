import ky, { type Options } from "ky";
import { toast } from "sonner";

export const apiClient = () => {
  const kyOptions: Options = {
    hooks: {
      beforeRequest: [() => {}],
      afterResponse: [
        async ({ response }) => {
          if (!response.ok) {
            const errorResponse = await response.json();
            toast.error(`API Error: ${errorResponse}`);
          }
        },
      ],
    },
  };

  const fetcher = ky.create(kyOptions);

  return {
    geocoded: () => {
      const updatedFetcher = fetcher.extend({
        prefix: "https://api.geocoded.me",
      });
      return {
        search: async ({ type = "country", query, limit = 25, offset = 0 }: GeoCodedSearchAPI) => {
          return updatedFetcher
            .get("search", {
              searchParams: {
                q: query,
                type,
                limit,
                offset,
              },
            })
            .json<{ data: Array<GeoCodedSearchResult>; meta: any }>();
        },
        getLocationDetails: async ({ type, locId, countryCode }: GeoCodedDetailsAPI) => {
          const paths = {
            country: `countries/${locId}`,
            state: `states/${countryCode}/${locId}`,
            city: `cities/${locId}`,
          };

          const path = paths[type];

          return updatedFetcher.get(path).json<GeoCodedLocationDetails>();
        },
      };
    },
  };
};

export type GeoCodedSearchAPI = {
  query: string;
  type: "country" | "state" | "city";
  limit?: number;
  offset?: number;
};

export type GeoCodedSearchResult = {
  type: "country" | "state" | "city";
  name: string;
  countryCode: string;
  countryName: string;
  geonameId: number | null;
  stateCode: string;
  stateName: string | null;
};

export type GeoCodedDetailsAPI = {
  type: "country" | "state" | "city";
  locId: string;
  countryCode?: string;
};

export type GeoCodedLocationDetails = {
  latitude: string;
  longitude: string;
  name: string;
  [key: string]: any;
};
