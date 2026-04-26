import type { AnalyzedFacility } from "@/lib/types";

interface Props {
  facilities: AnalyzedFacility[];
}

export function IndiaMap({ facilities }: Props) {
  return (
    <div className="relative w-full">
      <div
        className="relative w-full rounded-2xl border border-border overflow-hidden bg-white"
        style={{ height: "700px" }}
      >
        <iframe
          src="/india_heatmap_real.html"
          className="w-full h-full border-0"
          title="India Healthcare Map"
        />
      </div>

      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-border rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
        <div className="font-semibold mb-1 text-slate-900">Healthcare access</div>
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
            <span className="text-slate-600">{r.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}