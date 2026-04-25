import * as XLSX from "xlsx";
import type { RawFacility } from "./types";

export function parseExcelFile(buffer: ArrayBuffer): RawFacility[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return rows.map((r) => normalizeRow(r));
}

function pick(r: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const found = Object.keys(r).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
    if (found) return r[found];
  }
  return undefined;
}

function normalizeRow(r: Record<string, unknown>): RawFacility {
  return {
    facility_name: String(pick(r, ["facility_name", "facility", "name", "hospital_name"]) ?? ""),
    city: String(pick(r, ["city", "town"]) ?? ""),
    district: String(pick(r, ["district"]) ?? ""),
    state: String(pick(r, ["state", "province"]) ?? ""),
    bed_count: Number(pick(r, ["bed_count", "beds", "total_beds"]) ?? 0) || 0,
    icu_available: pick(r, ["icu_available", "icu"]) as boolean | string,
    oxygen_available: pick(r, ["oxygen_available", "oxygen"]) as boolean | string,
    ambulance_available: pick(r, ["ambulance_available", "ambulance"]) as boolean | string,
    emergency_24x7: pick(r, ["emergency_24x7", "emergency", "emergency_24_7"]) as boolean | string,
    specialist_available: String(pick(r, ["specialist_available", "specialists", "specialties"]) ?? ""),
    unstructured_notes: String(pick(r, ["unstructured_notes", "notes", "remarks", "comments"]) ?? ""),
    latitude: pick(r, ["latitude", "lat"]) ? Number(pick(r, ["latitude", "lat"])) : undefined,
    longitude: pick(r, ["longitude", "lng", "lon"]) ? Number(pick(r, ["longitude", "lng", "lon"])) : undefined,
  };
}

export function buildSampleWorkbook(rows: RawFacility[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Facilities");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
