import type { AnalyzedFacility } from "./types";

export function facilitiesToCsv(rows: AnalyzedFacility[]): string {
  const headers = [
    "facility_name", "city", "district", "state", "bed_count",
    "icu_available", "oxygen_available", "ambulance_available", "emergency_24x7",
    "specialist_available", "trust_score", "trust_label",
    "extracted_equipment", "extracted_staff", "true_emergency_24x7",
    "contradictions", "latitude", "longitude",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.facility_name, r.city, r.district, r.state, r.bed_count,
      r.icu_available, r.oxygen_available, r.ambulance_available, r.emergency_24x7,
      r.specialist_available, r.trustScore, r.trustLabel,
      r.extracted.equipment.join("; "),
      r.extracted.staff.join("; "),
      r.extracted.trueEmergency24x7,
      r.extracted.contradictions.join(" | "),
      r.latitude ?? "", r.longitude ?? "",
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadBlob(data: BlobPart, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
