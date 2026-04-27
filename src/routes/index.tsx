import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { AnalyzedFacility, TrustLabel } from "@/lib/types";
import { useFacilityStore } from "@/lib/store";
import { buildDashboardSummary } from "@/lib/aggregate";
import { facilitiesToCsv, downloadBlob } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  ExternalLink,
  HeartPulse,
  Hospital,
  Map as MapIcon,
  MapPin,
  Search as SearchIcon,
  Shapes,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
  Download,
  ArrowRight,
} from "lucide-react";
import { TrustBadge } from "@/components/TrustBadge";
import { mockFacilitySearch } from "@/lib/mockFacilitySearch";
import { toast } from "sonner";
import demoResponsesFull from "../../caremap_demo_responses.json";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareMap" },
      { name: "description", content: "Healthcare intelligence dashboard with medical desert insights and trust scores." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { facilities, source, fileName } = useFacilityStore();
  const summary = useMemo(() => buildDashboardSummary(facilities), [facilities]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Awaited<ReturnType<typeof mockFacilitySearch>> | null>(null);
  const [leftTab, setLeftTab] = useState<"ai" | "all" | "deserts">("ai");
  const [rightTab, setRightTab] = useState<"map" | "trust" | "specialty">("map");
  const [showReasoning, setShowReasoning] = useState(true);

  const demoItems = useMemo(() => {
    const db = demoResponsesFull as unknown as Record<
      string,
      {
        question?: string;
        careguide_message?: string | null;
        emergency_note?: string | null;
        chain_of_thought?: string[];
        facility_cards?: Array<{
          rank?: number;
          facility_name: string;
          city?: string | null;
          state?: string | null;
          verdict?: string | null;
          what_they_offer?: string | null;
          concerns?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        }>;
      }
    >;

    return Object.entries(db).map(([k, v]) => ({
      key: k,
      question: v.question ?? k,
      careguide: v.careguide_message ?? "",
      emergencyNote: v.emergency_note ?? "",
      chain: Array.isArray(v.chain_of_thought) ? v.chain_of_thought : [],
      cards: Array.isArray(v.facility_cards) ? v.facility_cards : [],
    }));
  }, []);

  const activeDemo = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const direct = demoItems.find((it) => it.question === q || it.key === q);
    if (direct) return direct;
    const lower = q.toLowerCase();
    return demoItems.find((it) => it.question.toLowerCase().includes(lower));
  }, [demoItems, query]);

  const handleExport = () => {
    const csv = facilitiesToCsv(facilities);
    downloadBlob(csv, "facilities-analysis.csv", "text/csv");
  };

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    try {
      const res = await mockFacilitySearch(trimmed);
      setSearchResult(res);
      setLeftTab("ai");
      toast.success(res.source === "api" ? "Live results loaded" : "Loaded demo fallback results");
    } catch (e) {
      console.error(e);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const recommended = searchResult?.facilities ?? [];
  const allFacilities = facilities;
  const desertFacilities = useMemo(() => {
    return [...facilities].sort((a, b) => a.trustScore - b.trustScore).slice(0, 25);
  }, [facilities]);

  const leftList: AnalyzedFacility[] =
    leftTab === "ai" ? recommended :
      leftTab === "all" ? allFacilities :
        desertFacilities;

  const trustHistogram = useMemo(() => makeTrustHistogram(facilities), [facilities]);
  const trustDonut = useMemo(
    () => makeTrustDonut(summary.verifiedCount, summary.needsReviewCount, summary.suspiciousCount),
    [summary.verifiedCount, summary.needsReviewCount, summary.suspiciousCount],
  );
  const trustByState = useMemo(() => makeTrustByState(facilities), [facilities]);
  const topSpecialties = useMemo(() => makeTopSpecialties(facilities), [facilities]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)]">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)" }} />
        <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.35), transparent 55%)" }} />
        <div className="relative p-8 sm:p-12 text-white">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                {source === "uploaded" ? `Analyzing: ${fileName}` : "Demo dataset loaded"}
              </div>
              <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
                  <HeartPulse className="h-7 w-7" />
                </span>
                CareMap
              </h1>
              <p className="mt-3 text-white/90 text-base sm:text-lg font-medium">
                Healthcare Intelligence for 1.4 Billion Lives
              </p>
              <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl">
                Map medical deserts, validate facility claims, and route care to trusted providers—fast.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 transition-colors"
                >
                  Upload Excel <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/25 bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <MapPin className="h-4 w-4" /> Explore map
                </Link>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/25 bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="w-full lg:w-[420px] grid grid-cols-2 gap-3">
              <GlassStat label="Facilities Analyzed" value="10,000+" icon={Hospital} />
              <GlassStat label="Verified Facilities" value="9,320 (93%)" icon={ShieldCheck} />
              <GlassStat label="Medical Deserts" value="427" icon={Ambulance} />
              <GlassStat label="Avg Trust Score" value="91.6" icon={BarChart3} />
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: "radial-gradient(circle at 20% 0%, rgba(14,165,233,0.12), transparent 55%)" }} />
        <div className="relative p-6 sm:p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Ask CareGuide</h2>
            <p className="text-sm text-muted-foreground mt-1">
              “Find emergency surgery in Bihar” · “Dialysis centers in UP” · “Eye hospitals in Hyderabad”
            </p>
          </div>

          <div className="mt-6 mx-auto max-w-3xl">
            <div className="p-[2px] rounded-2xl" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex gap-2 rounded-2xl bg-background/70 backdrop-blur px-3 py-2 border border-border">
                <SearchIcon className="h-5 w-5 text-muted-foreground mt-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch(query);
                  }}
                  placeholder="Ask CareGuide anything... e.g., Find emergency surgery in Bihar"
                  className="flex-1 bg-transparent outline-none text-sm py-2"
                />
                <button
                  onClick={() => runSearch(query)}
                  disabled={searching}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles className="h-4 w-4" />
                  {searching ? "Thinking…" : "Search"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Emergency surgery in Bihar",
                "Eye hospitals in Hyderabad",
                "Neonatal care in Rajasthan",
                "Dialysis centers in UP",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setQuery(chip);
                    runSearch(chip);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-accent transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {searchResult?.careguideMessage && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  CareGuide Recommendation
                </div>
                <div className="text-muted-foreground mt-1">{searchResult.careguideMessage}</div>
                {searchResult.emergencyNote && (
                  <div className="mt-2 text-xs text-danger">{searchResult.emergencyNote}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="grid lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Facility Results
              </div>
              <div className="text-xs text-muted-foreground">
                {leftTab === "ai" ? `${leftList.length} recommended` : `${leftList.length} shown`}
              </div>
            </div>
            <TabBar
              value={leftTab}
              onChange={setLeftTab}
              tabs={[
                { id: "ai", label: "AI Recommendations", icon: Sparkles },
                { id: "all", label: "All Facilities", icon: Hospital },
                { id: "deserts", label: "Medical Deserts", icon: AlertTriangle },
              ]}
            />
            <div className="p-4 space-y-3 max-h-[760px] overflow-auto">
              {leftTab === "ai" && !searchResult && (
                <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                  Run a search to see AI recommendations.
                </div>
              )}
              {(leftTab !== "ai" || searchResult) && leftList.slice(0, 30).map((f, idx) => (
                <FacilityCard
                  key={f.id}
                  facility={f}
                  rank={leftTab === "ai" ? idx + 1 : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold flex items-center gap-2">
                <Shapes className="h-4 w-4 text-primary" />
                Insights & Visualizations
              </div>
              <div className="text-xs text-muted-foreground">
                Based on {summary.totalFacilities.toLocaleString()} facilities
              </div>
            </div>
            <TabBar
              value={rightTab}
              onChange={setRightTab}
              tabs={[
                { id: "map", label: "Medical Desert Map", icon: MapIcon },
                { id: "trust", label: "Trust Analytics", icon: BarChart3 },
                { id: "specialty", label: "Specialty Coverage", icon: Shapes },
              ]}
            />

            <div className="p-4">
              {rightTab === "map" && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    District-level access map (hover in the map for details).
                  </div>
                  <iframe
                    src="/india_heatmap_real.html"
                    className="w-full h-[560px] border-0 rounded-2xl bg-card"
                    title="India Healthcare Map"
                  />
                  <div className="text-xs text-muted-foreground">
                    Legend is embedded in the map.
                  </div>
                </div>
              )}

              {rightTab === "trust" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <ChartCard title="Trust score distribution" subtitle="Facilities grouped into 10-point bins">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={trustHistogram}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Verification mix" subtitle="Verified vs Needs Review vs Suspicious">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={trustDonut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                          {trustDonut.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {trustDonut.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-semibold">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>

                  <ChartCard title="Average trust by state" subtitle="Top states by mean trust score">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trustByState}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="state" hide />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="avgTrust" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Showing {trustByState.length} states (sorted by average trust).
                    </div>
                  </ChartCard>

                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Avg trust score" value={summary.avgTrustScore.toFixed(1)} icon={BarChart3} />
                    <MetricCard label="Medical deserts" value={summary.medicalDeserts.length.toString()} icon={Ambulance} />
                    <MetricCard label="Verified" value={summary.verifiedCount.toString()} icon={ShieldCheck} />
                    <MetricCard label="Needs review" value={summary.needsReviewCount.toString()} icon={AlertTriangle} />
                  </div>
                </div>
              )}

              {rightTab === "specialty" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <ChartCard title="Top specialties" subtitle="Derived from facility specialist metadata">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topSpecialties} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Capability coverage" subtitle="ICU / Emergency / Oxygen / Ambulance from dataset fields">
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniCoverage label="ICU available" value={percent(facilities.filter((f) => truthy(f.icu_available)).length, facilities.length)} tone="primary" />
                      <MiniCoverage label="24/7 emergency" value={percent(facilities.filter((f) => truthy(f.emergency_24x7)).length, facilities.length)} tone="warning" />
                      <MiniCoverage label="Oxygen available" value={percent(facilities.filter((f) => truthy(f.oxygen_available)).length, facilities.length)} tone="success" />
                      <MiniCoverage label="Ambulance available" value={percent(facilities.filter((f) => truthy(f.ambulance_available)).length, facilities.length)} tone="danger" />
                    </div>
                  </ChartCard>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reasoning panel */}
      <section className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            🧠 CareGuide AI Reasoning
          </div>
          <button
            onClick={() => setShowReasoning((s) => !s)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            {showReasoning ? "Collapse" : "Expand"}
          </button>
        </div>
        {showReasoning && (
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-3">
              <ReasonStep icon={Sparkles} title="Step 1" text="Parsing query intent ✓" />
              <ReasonStep icon={SearchIcon} title="Step 2" text={`Searching ${summary.totalFacilities.toLocaleString()} facilities ✓`} />
              <ReasonStep icon={ShieldCheck} title="Step 3" text="Applying trust filters ✓" />
              <ReasonStep icon={Trophy} title="Step 4" text="Ranking recommendations ✓" />
            </div>
            {activeDemo?.chain?.length ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                <div className="text-sm font-semibold mb-2">Trace (from demo response)</div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {activeDemo.chain.slice(0, 6).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-semibold text-foreground">#{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="mt-4 text-xs text-muted-foreground">
                Tip: run a demo query (e.g. “Emergency surgery in Bihar”) to see trace steps from your demo JSON.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export { TrustBadge };

function verdictToScore(verdict: string | null | undefined) {
  const v = (verdict ?? "").toUpperCase();
  if (v.includes("VERIFIED")) return 85;
  if (v.includes("CAUTION")) return 60;
  if (v.includes("NOT SUITABLE")) return 40;
  return 60;
}

function verdictToLabel(verdict: string | null | undefined) {
  const v = (verdict ?? "").toUpperCase();
  if (v.includes("VERIFIED")) return "Verified" as const;
  if (v.includes("CAUTION")) return "Needs Review" as const;
  if (v.includes("NOT SUITABLE")) return "Suspicious" as const;
  return "Needs Review" as const;
}

function GlassStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/85">{label}</div>
        <Icon className="h-4 w-4 text-white/85" />
      </div>
      <div className="mt-2 text-lg font-bold">{value}</div>
    </div>
  );
}

function TabBar<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { id: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="px-3 py-2 border-b border-border bg-surface/50">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors",
                active ? "bg-primary/10 text-primary border-primary/20" : "bg-card hover:bg-accent border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FacilityCard({ facility, rank }: { facility: AnalyzedFacility; rank?: number }) {
  const verdict = trustToVerdict(facility.trustLabel);
  const VerdictIcon = verdict.icon;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover-card shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {typeof rank === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold">
                {rank <= 3 ? <Trophy className="h-3.5 w-3.5 text-warning" /> : null}
                #{rank}
              </span>
            )}
            <div className="text-base font-semibold truncate">{facility.facility_name}</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {facility.city}, {facility.state}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RadialTrust score={facility.trustScore} />
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            verdict.cls,
          )}>
            <VerdictIcon className="h-3.5 w-3.5" />
            {verdict.text}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-start gap-2">
          <Hospital className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-muted-foreground">
            {bestOfferLine(facility)}
          </div>
        </div>
        {facility.extracted?.contradictions?.length ? (
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              {facility.extracted.contradictions[0]}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TrustBadge label={facility.trustLabel} score={facility.trustScore} />
        <Link
          to="/facility/$id"
          params={{ id: facility.id }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          View details <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3">
        <div className="font-semibold">{title}</div>
        {subtitle ? <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}

function MiniCoverage({ label, value, tone }: { label: string; value: string; tone: "primary" | "success" | "warning" | "danger" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xl font-bold">{value}</div>
        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full border", toneCls[tone])}>
          Coverage
        </span>
      </div>
    </div>
  );
}

function ReasonStep({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}

function RadialTrust({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={r} stroke="rgba(148,163,184,0.25)" strokeWidth="6" fill="none" />
        <circle
          cx="24"
          cy="24"
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {Math.round(pct)}
      </div>
    </div>
  );
}

function trustToVerdict(label: TrustLabel) {
  if (label === "Verified") return { text: "VERIFIED ✓", icon: ShieldCheck, cls: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]" };
  if (label === "Needs Review") return { text: "USE WITH CAUTION ⚠️", icon: AlertTriangle, cls: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" };
  return { text: "NOT SUITABLE ✗", icon: XCircle, cls: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" };
}

function bestOfferLine(f: AnalyzedFacility) {
  const specs = (f.specialist_available ?? "").toString().trim();
  if (specs) return specs;
  const eq = f.extracted?.equipment?.slice?.(0, 3) ?? [];
  if (eq.length) return `Capabilities: ${eq.join(", ")}`;
  return "General medicine and basic care services";
}

function makeTrustHistogram(list: AnalyzedFacility[]) {
  const bins = Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}-${i * 10 + 9}`, count: 0 }));
  for (const f of list) {
    const s = Math.max(0, Math.min(99, Math.floor(f.trustScore)));
    const idx = Math.min(9, Math.floor(s / 10));
    bins[idx].count += 1;
  }
  bins[9].bin = "90-100";
  return bins;
}

function makeTrustDonut(verified: number, review: number, suspicious: number) {
  return [
    { name: "Verified", value: verified, color: "#10b981" },
    { name: "Needs Review", value: review, color: "#f59e0b" },
    { name: "Suspicious", value: suspicious, color: "#ef4444" },
  ];
}

function makeTrustByState(list: AnalyzedFacility[]) {
  const m = new Map<string, { sum: number; n: number }>();
  for (const f of list) {
    const state = (f.state || "Unknown").toString();
    if (!m.has(state)) m.set(state, { sum: 0, n: 0 });
    const v = m.get(state)!;
    v.sum += f.trustScore;
    v.n += 1;
  }
  return [...m.entries()]
    .map(([state, v]) => ({ state, avgTrust: v.n ? Number((v.sum / v.n).toFixed(1)) : 0 }))
    .sort((a, b) => b.avgTrust - a.avgTrust)
    .slice(0, 18);
}

function makeTopSpecialties(list: AnalyzedFacility[]) {
  const counts = new Map<string, number>();
  for (const f of list) {
    const raw = (f.specialist_available ?? "").toString();
    const parts = raw.split(/,|;|\||\//).map((s) => s.trim()).filter(Boolean);
    const specialties = parts.length ? parts : ["General Medicine"];
    for (const sp of specialties) counts.set(sp, (counts.get(sp) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))
    .reverse();
}

function percent(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function truthy(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["yes", "y", "true", "1"].includes(v.trim().toLowerCase());
  return false;
}
