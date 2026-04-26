import { createFileRoute } from "@tanstack/react-router";
import { useFacilityStore } from "@/lib/store";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Healthcare Facility Map — CareMap" },
      { name: "description", content: "Interactive map of Indian medical facilities color-coded by trust score and access level." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const facilities = useFacilityStore((s) => s.facilities);
  const withCoords = facilities.filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Healthcare Facility Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Color-coded by trust score (Green = Verified, Yellow = Needs Review, Red = Medical Desert)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {withCoords.length} of {facilities.length} facilities mapped · click a marker for details
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <iframe
            src="/india_heatmap_real.html"
            className="w-full h-[calc(100vh-200px)] border-0 rounded-lg bg-card"
            title="India Healthcare Map"
          />
        </div>
        <aside className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-semibold">How to read this map</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Each marker is a facility. Color reflects its trust score from AI extraction:
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "var(--color-success)" }} />
              <span><b>Verified (80–100)</b> — claims align with extracted equipment and staff.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "var(--color-warning)" }} />
              <span><b>Needs Review (50–79)</b> — partial match; investigate.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "var(--color-danger)" }} />
              <span><b>Suspicious (0–49)</b> — strong contradictions in notes.</span>
            </li>
          </ul>
          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            {withCoords.length} of {facilities.length} facilities currently have coordinates.
            Tip: add lat/long to plot more facilities.
          </div>
        </aside>
      </div>
    </div>
  );
}
