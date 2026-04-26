import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useFacilityStore } from "@/lib/store";
import { TrustBadge } from "@/components/TrustBadge";
import { ArrowLeft, ChevronDown, MapPin, Bed, Stethoscope, Wrench, AlertTriangle, FileText } from "lucide-react";

export const Route = createFileRoute("/facility/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Facility ${params.id} — CareMap` },
      { name: "description", content: "Detailed trust analysis, extracted equipment, and contradictions for this healthcare facility." },
    ],
  }),
  component: FacilityDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Facility not found</h1>
      <p className="text-muted-foreground mt-2">It may have been removed or the ID is invalid.</p>
      <Link to="/facilities" className="mt-6 inline-block text-primary hover:underline">← Back to facilities</Link>
    </div>
  ),
});

function FacilityDetail() {
  const { id } = Route.useParams();
  const facilities = useFacilityStore((s) => s.facilities);
  const facility = useMemo(() => facilities.find((f) => f.id === id), [facilities, id]);
  const [showNotes, setShowNotes] = useState(false);

  if (!facility) throw notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/facilities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to facilities
      </Link>

      <header className="rounded-3xl border border-border p-6 sm:p-8" style={{ background: "var(--gradient-surface)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{facility.facility_name}</h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {facility.city}, {facility.district}, {facility.state}
            </div>
          </div>
          <TrustBadge label={facility.trustLabel} score={facility.trustScore} className="text-sm" />
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Mini icon={Bed} label="Beds" value={facility.bed_count.toString()} />
          <Mini icon={Stethoscope} label="ICU" value={truthy(facility.icu_available) ? "Yes" : "No"} />
          <Mini icon={Wrench} label="Oxygen" value={truthy(facility.oxygen_available) ? "Yes" : "No"} />
          <Mini icon={AlertTriangle} label="24/7 Emergency" value={truthy(facility.emergency_24x7) ? "Claimed" : "No"} />
        </div>
      </header>

      {/* Trust score breakdown */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Trust score breakdown</h2>
        <p className="text-xs text-muted-foreground mt-1">How we computed {facility.trustScore}/100</p>
        <ul className="mt-4 space-y-2">
          {facility.scoreBreakdown.map((b, i) => (
            <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-elevated border border-border">
              <span className="text-sm">{b.reason}</span>
              <span className={`text-sm font-semibold ${b.delta > 0 ? "text-success" : b.delta < 0 ? "text-danger" : "text-muted-foreground"}`}>
                {b.delta > 0 ? "+" : ""}{b.delta}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Extracted */}
      <section className="grid md:grid-cols-2 gap-4">
        <ChipBlock title="Extracted equipment" items={facility.extracted.equipment} empty="No equipment extracted from notes." />
        <ChipBlock title="Extracted staff" items={facility.extracted.staff} empty="No staff extracted from notes." />
      </section>

      {/* Contradictions */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" /> Contradictions found
        </h2>
        {facility.extracted.contradictions.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">No contradictions detected. ✅</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {facility.extracted.contradictions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Original data */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Original record</h2>
        <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field k="Specialists claimed" v={facility.specialist_available || "—"} />
          <Field k="Ambulance" v={truthy(facility.ambulance_available) ? "Yes" : "No"} />
          <Field k="Latitude" v={facility.latitude?.toString() ?? "—"} />
          <Field k="Longitude" v={facility.longitude?.toString() ?? "—"} />
          <Field k="True 24/7 (verified)" v={facility.extracted.trueEmergency24x7 ? "Yes" : "No"} />
        </dl>

        <button
          onClick={() => setShowNotes((s) => !s)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <FileText className="h-4 w-4" />
          {showNotes ? "Hide" : "Show"} raw unstructured notes
          <ChevronDown className={`h-4 w-4 transition-transform ${showNotes ? "rotate-180" : ""}`} />
        </button>
        {showNotes && (
          <pre className="mt-3 p-4 rounded-lg bg-muted text-muted-foreground text-xs whitespace-pre-wrap font-mono">
            {facility.unstructured_notes || "(no notes)"}
          </pre>
        )}
      </section>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-1.5 text-lg font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ChipBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3">{empty}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
              {it}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </>
  );
}

function truthy(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["yes", "y", "true", "1"].includes(v.trim().toLowerCase());
  return false;
}
