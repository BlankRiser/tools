import { ToolResolver } from "#/modules/tool-resolver";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
export const Route = createFileRoute("/tools/$toolID/")({
  params: {
    parse: (params) => ({
      toolID: z.string().parse(params.toolID),
    }),
    stringify: ({ toolID }) => ({ toolID: `${toolID}` }),
  },
  component: ToolsIndexPage,
});

function ToolsIndexPage() {
  const { toolID } = Route.useParams();

  return <ToolResolver toolID={toolID as any} />;
}
