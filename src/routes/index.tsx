import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useFacilityStore } from "@/lib/store";
import { buildDashboardSummary } from "@/lib/aggregate";
import { facilitiesToCsv, downloadBlob } from "@/lib/exportCsv";
import {
  Activity, Building2, AlertOctagon, ShieldCheck, TrendingDown,
  Download, ArrowRight, MapPin,
} from "lucide-react";
import { TrustBadge } from "@/components/TrustBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedDesert AI" },
      { name: "description", content: "Healthcare intelligence dashboard with medical desert insights and trust scores." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { facilities, source, fileName } = useFacilityStore();
  const summary = useMemo(() => buildDashboardSummary(facilities), [facilities]);

  const handleExport = () => {
    const csv = facilitiesToCsv(facilities);
    downloadBlob(csv, "facilities-analysis.csv", "text/csv");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border p-8 sm:p-12"
        style={{ background: "var(--gradient-surface)" }}
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: "var(--gradient-glow)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-medium text-primary mb-4">
            <Activity className="h-3 w-3" />
            {source === "uploaded" ? `Analyzing: ${fileName}` : "Demo dataset loaded"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Find India's <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>medical deserts</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            AI extraction + trust scoring across {summary.totalFacilities.toLocaleString()} facilities in {summary.totalDistricts} districts.
            Verify what hospitals actually have — not just what they claim.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)" }}>
              Upload Excel <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/map" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-accent transition-colors">
              <MapPin className="h-4 w-4" /> Explore map
            </Link>
            <button onClick={handleExport} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-accent transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Facilities Analyzed" value={summary.totalFacilities.toLocaleString()} hint={`${summary.totalDistricts} districts`} tone="primary" />
        <StatCard icon={AlertOctagon} label="Medical Deserts" value={summary.medicalDeserts.length.toString()} hint="ICU rate < 20%" tone="danger" />
        <StatCard icon={ShieldCheck} label="Verified Facilities" value={summary.verifiedCount.toString()} hint={`${Math.round((summary.verifiedCount / Math.max(1, summary.totalFacilities)) * 100)}% of total`} tone="success" />
        <StatCard icon={TrendingDown} label="Avg Trust Score" value={summary.avgTrustScore.toFixed(1)} hint="0–100 scale" tone="warning" />
      </section>

      {/* Top attention + Trust breakdown */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Top 5 districts needing attention</h2>
              <p className="text-xs text-muted-foreground">Lowest ICU access combined with low average trust</p>
            </div>
          </div>
          <div className="space-y-2">
            {summary.topAttention.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            {summary.topAttention.map((d, i) => (
              <div key={`${d.district}-${d.state}`} className="flex items-center gap-4 p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: d.riskLevel === "high" ? "var(--color-danger)" : d.riskLevel === "moderate" ? "var(--color-warning)" : "var(--color-success)", color: "var(--color-primary-foreground)" }}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.district}</div>
                  <div className="text-xs text-muted-foreground">{d.state} · {d.facilityCount} facilit{d.facilityCount === 1 ? "y" : "ies"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{Math.round(d.icuRate * 100)}% ICU</div>
                  <div className="text-xs text-muted-foreground">Trust {d.avgTrustScore.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Trust distribution</h2>
          <p className="text-xs text-muted-foreground mb-5">Across all analyzed facilities</p>
          <TrustBar verified={summary.verifiedCount} review={summary.needsReviewCount} suspicious={summary.suspiciousCount} />
          <div className="mt-5 space-y-2">
            <Row label="Verified" value={summary.verifiedCount} total={summary.totalFacilities} colorVar="--color-success" />
            <Row label="Needs Review" value={summary.needsReviewCount} total={summary.totalFacilities} colorVar="--color-warning" />
            <Row label="Suspicious" value={summary.suspiciousCount} total={summary.totalFacilities} colorVar="--color-danger" />
          </div>
        </div>
      </section>

      {/* Best & deserts */}
      <section className="grid md:grid-cols-2 gap-6">
        <DistrictList title="Medical deserts" subtitle="ICU rate below 20%" items={summary.medicalDeserts} tone="danger" />
        <DistrictList title="Best healthcare access" subtitle="ICU rate above 60%" items={summary.bestAccess} tone="success" />
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string; tone: "primary" | "danger" | "success" | "warning" }) {
  const colors = {
    primary: "text-primary bg-primary/10 border-primary/20",
    danger: "text-danger bg-danger/10 border-danger/20",
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${colors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/80 mt-1">{hint}</div>}
    </div>
  );
}

function TrustBar({ verified, review, suspicious }: { verified: number; review: number; suspicious: number }) {
  const total = Math.max(1, verified + review + suspicious);
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
      <div style={{ width: `${(verified / total) * 100}%`, background: "var(--color-success)" }} />
      <div style={{ width: `${(review / total) * 100}%`, background: "var(--color-warning)" }} />
      <div style={{ width: `${(suspicious / total) * 100}%`, background: "var(--color-danger)" }} />
    </div>
  );
}

function Row({ label, value, total, colorVar }: { label: string; value: number; total: number; colorVar: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(${colorVar})` }} />
        <span>{label}</span>
      </div>
      <span className="text-muted-foreground"><span className="text-foreground font-medium">{value}</span> · {pct}%</span>
    </div>
  );
}

function DistrictList({ title, subtitle, items, tone }: { title: string; subtitle: string; items: { district: string; state: string; facilityCount: number; icuRate: number; avgTrustScore: number }[]; tone: "danger" | "success" }) {
  const accent = tone === "danger" ? "var(--color-danger)" : "var(--color-success)";
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None identified yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 6).map((d) => (
            <li key={`${d.district}-${d.state}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
              <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.district}</div>
                <div className="text-[11px] text-muted-foreground">{d.state}</div>
              </div>
              <div className="text-xs text-muted-foreground">{d.facilityCount} · {Math.round(d.icuRate * 100)}% ICU</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// helper: re-export TrustBadge usage typing
export { TrustBadge };
