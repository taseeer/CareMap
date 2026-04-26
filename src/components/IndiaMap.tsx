import type { AnalyzedFacility } from "@/lib/types";

interface Props {
  facilities: AnalyzedFacility[];
}

export function IndiaMap({ facilities }: Props) {
  return (
    <div className="relative w-full">
      {/* Your heatmap embedded here */}
      <div
        className="w-full rounded-2xl border border-border overflow-hidden"
        style={{ height: "700px" }}
      >
        <iframe
          src="/india_heatmap_real.html"
          width="100%"
          height="100%"
          style={{ border: "none" }}
          title="India Healthcare Heatmap"
        />
      </div>

      {/* Legend matches Taseer's dark theme */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs space-y-1.5">
        <div className="font-semibold mb-1">Healthcare access</div>
        {[
          { c: "#800026", l: "Very High (1200+)" },
          { c: "#E31A1C", l: "High (600-1200)" },
          { c: "#FD8D3C", l: "Medium (100-600)" },
          { c: "#FFEDA0", l: "Low (50-100)" },
          { c: "#d3d3d3", l: "No Data" },
          { c: "#0000FF", l: "⚠️ Medical Desert" },
        ].map((r) => (
          <div key={r.l} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c }} />
            <span className="text-muted-foreground">{r.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}