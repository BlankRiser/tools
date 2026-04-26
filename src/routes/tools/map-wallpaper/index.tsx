import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tools/map-wallpaper/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/tools/map-wallpaper/"!</div>;
}
