import { ToolResolver } from "#/modules/tool-resolver";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { geoCodedLocationDetailsQueryOptions } from "#/lib/query-factory";
export const Route = createFileRoute("/tools/$toolID/")({
  params: {
    parse: (params) => ({
      toolID: z.string().parse(params.toolID),
    }),
    stringify: ({ toolID }) => ({ toolID: `${toolID}` }),
  },
  validateSearch: (search: Record<string, unknown>) => z.object({
    q: z.string().optional(),
    type: z.enum(["country", "state", "city"]).optional(),
    locId: z.string().optional(),
    cc: z.string().optional(),
  }).parse(search || {}),
  loaderDeps: ({ search: { q, type, locId, cc } }) => ({ q, type, locId, cc }),
  loader: async ({ params, deps, context }) => {
    if (
      params.toolID === "map-wallpaper" &&
      deps.q &&
      deps.type &&
      deps.locId
    ) {
      if (typeof window !== "undefined" && window.location.hash.includes("wallpaper-map")) {
        return {};
      }
      
      try {
        const details = await context.queryClient.ensureQueryData(
          geoCodedLocationDetailsQueryOptions({
            type: deps.type,
            locId: deps.locId,
            countryCode: deps.cc,
          })
        );
        
        if (details && details.latitude && details.longitude) {
          return {
            mapCenter: {
              lat: parseFloat(details.latitude),
              lng: parseFloat(details.longitude),
              zoom: deps.type === "country" ? 4 : deps.type === "state" ? 6 : 11,
            }
          };
        }
      } catch (e) {
        console.error("Failed to fetch map center:", e);
      }
    }
    return {};
  },
  component: ToolsIndexPage,
});

function ToolsIndexPage() {
  const { toolID } = Route.useParams();

  return <ToolResolver toolID={toolID as any} />;
}
