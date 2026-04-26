import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useFacilityStore } from "@/lib/store";
import { TrustBadge } from "@/components/TrustBadge";
import { Search, ArrowUpDown, ArrowRight } from "lucide-react";
import { facilitiesToCsv, downloadBlob } from "@/lib/exportCsv";

type SortKey = "trust" | "beds" | "name" | "district";
type LabelFilter = "all" | "Verified" | "Needs Review" | "Suspicious";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Facilities — CareMap" },
      { name: "description", content: "Search, filter, and sort analyzed Indian healthcare facilities." },
    ],
  }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const facilities = useFacilityStore((s) => s.facilities);
  const [q, setQ] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelFilter>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("trust");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const states = useMemo(
    () => Array.from(new Set(facilities.map((f) => f.state).filter(Boolean))).sort(),
    [facilities],
  );

  const filtered = useMemo(() => {
    let list = facilities;
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (f) =>
          f.facility_name.toLowerCase().includes(needle) ||
          f.city.toLowerCase().includes(needle) ||
          f.district.toLowerCase().includes(needle),
      );
    }
    if (labelFilter !== "all") list = list.filter((f) => f.trustLabel === labelFilter);
    if (stateFilter !== "all") list = list.filter((f) => f.state === stateFilter);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "trust") cmp = a.trustScore - b.trustScore;
      else if (sortKey === "beds") cmp = a.bed_count - b.bed_count;
      else if (sortKey === "name") cmp = a.facility_name.localeCompare(b.facility_name);
      else cmp = a.district.localeCompare(b.district);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [facilities, q, labelFilter, stateFilter, sortKey, sortDir]);

  const exportFiltered = () => {
    const csv = facilitiesToCsv(filtered);
    downloadBlob(csv, "facilities-filtered.csv", "text/csv");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {facilities.length} shown</p>
        </div>
        <button onClick={exportFiltered} className="text-sm px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
          Export filtered CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl border border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facility, city, district…"
            className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select label="Trust" value={labelFilter} onChange={(v) => setLabelFilter(v as LabelFilter)}
          options={[
            { value: "all", label: "All trust levels" },
            { value: "Verified", label: "Verified" },
            { value: "Needs Review", label: "Needs Review" },
            { value: "Suspicious", label: "Suspicious" },
          ]} />
        <Select label="State" value={stateFilter} onChange={setStateFilter}
          options={[{ value: "all", label: "All states" }, ...states.map((s) => ({ value: s, label: s }))]} />
        <div className="flex gap-2">
          <Select label="Sort by" value={sortKey} onChange={(v) => setSortKey(v as SortKey)}
            options={[
              { value: "trust", label: "Trust score" },
              { value: "beds", label: "Bed count" },
              { value: "name", label: "Name" },
              { value: "district", label: "District" },
            ]} />
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="px-3 rounded-lg border border-border bg-input hover:bg-accent transition-colors"
            aria-label="Toggle sort direction"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-border bg-card">
            <p className="text-muted-foreground">No facilities match your filters.</p>
          </div>
        )}
        {filtered.map((f) => (
          <Link
            key={f.id}
            to="/facility/$id"
            params={{ id: f.id }}
            className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold truncate">{f.facility_name}</h3>
                <TrustBadge label={f.trustLabel} score={f.trustScore} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {f.city}, {f.district}, {f.state} · {f.bed_count} beds
              </div>
              {f.extracted.contradictions.length > 0 && (
                <div className="mt-2 text-xs text-danger">
                  ⚠ {f.extracted.contradictions.length} contradiction{f.extracted.contradictions.length > 1 ? "s" : ""} detected
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {f.extracted.equipment.slice(0, 3).map((e) => (
                <span key={e} className="px-2 py-0.5 rounded-full bg-muted">{e}</span>
              ))}
              <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
