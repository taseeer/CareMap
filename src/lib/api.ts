import type { AnalyzedFacility, RawFacility, TrustLabel } from "./types";
import demoResponses from "./caremap_demo_responses.json";

const DEFAULT_API_URL =
  "https://dbc-90e1d16e-465c.cloud.databricks.com/serving-endpoints/caremap-api/invocations";

type FacilityCard = {
  rank?: number;
  facility_name: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  verdict?: string | null;
  what_they_offer?: string | null;
  concerns?: string | null;
};

type CareMapResponse = {
  facility_cards?: FacilityCard[];
  careguide_message?: string | null;
  emergency_note?: string | null;
};

function coerceNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function verdictToTrust(verdict: string | null | undefined): { score: number; label: TrustLabel } {
  const v = (verdict ?? "").toUpperCase();
  if (v.includes("VERIFIED")) return { score: 90, label: "Verified" };
  if (v.includes("CAUTION") || v.includes("REVIEW")) return { score: 65, label: "Needs Review" };
  if (v.includes("NOT SUITABLE")) return { score: 25, label: "Suspicious" };
  return { score: 55, label: "Needs Review" };
}

function cardToRawFacility(card: FacilityCard): RawFacility {
  const notes = [
    card.what_they_offer ? `Offers: ${card.what_they_offer}` : null,
    card.concerns ? `Concerns: ${card.concerns}` : null,
    card.verdict ? `Verdict: ${card.verdict}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    facility_name: card.facility_name,
    city: (card.city ?? "").toString(),
    district: (card.city ?? "").toString(), // best-effort: demo cards don't provide district
    state: (card.state ?? "").toString(),
    bed_count: 0,
    icu_available: false,
    oxygen_available: false,
    ambulance_available: false,
    emergency_24x7: false,
    specialist_available: "",
    unstructured_notes: notes,
    latitude: coerceNumber(card.latitude),
    longitude: coerceNumber(card.longitude),
  };
}

function cardsToAnalyzed(cards: FacilityCard[]): AnalyzedFacility[] {
  return cards.map((c, i) => {
    const raw = cardToRawFacility(c);
    const trust = verdictToTrust(c.verdict);
    return {
      ...raw,
      id: `${i}-${(raw.facility_name || "facility").toString().replace(/\s+/g, "-").toLowerCase()}`,
      extracted: {
        equipment: [],
        staff: [],
        trueEmergency24x7: false,
        contradictions: c.concerns ? [c.concerns] : [],
      },
      trustScore: trust.score,
      trustLabel: trust.label,
      scoreBreakdown: [
        { reason: "API verdict mapping", delta: trust.score },
      ],
    };
  });
}

function unwrapDatabricks(json: unknown): CareMapResponse {
  if (!json || typeof json !== "object") return {};
  const anyJson = json as any;
  // Databricks commonly returns { predictions: [ ... ] }
  const firstPred = Array.isArray(anyJson.predictions) ? anyJson.predictions[0] : null;
  if (firstPred && typeof firstPred === "object") return firstPred as CareMapResponse;
  return anyJson as CareMapResponse;
}

function pickDemoResponse(query: string): CareMapResponse | null {
  const db = demoResponses as unknown as Record<string, any>;
  if (db[query]) return db[query] as CareMapResponse;
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const key = Object.keys(db).find((k) => k.toLowerCase().includes(needle));
  return key ? (db[key] as CareMapResponse) : null;
}

export type CareMapQueryResult = {
  facilities: AnalyzedFacility[];
  careguideMessage?: string;
  emergencyNote?: string;
  source: "api" | "demo-fallback";
};

/**
 * Query the CareMap Databricks endpoint.
 *
 * - Sends `{ inputs: { question: [query] } }`
 * - Adds `Authorization: Bearer <token>`
 * - Falls back to `caremap_demo_responses.json` on failure
 *
 * Token is read from `import.meta.env.VITE_CAREMAP_API_TOKEN` by default.
 */
export async function queryCareMap(
  query: string,
  opts?: { apiUrl?: string; token?: string; timeoutMs?: number },
): Promise<CareMapQueryResult> {
  const apiUrl = opts?.apiUrl ?? import.meta.env.VITE_CAREMAP_API_URL ?? DEFAULT_API_URL;
  const token = opts?.token ?? import.meta.env.VITE_CAREMAP_API_TOKEN ?? "";
  const timeoutMs = opts?.timeoutMs ?? 15_000;

  try {
    if (!token) throw new Error("Missing API token");

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inputs: { question: [query] } }),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }

    const json = (await res.json()) as unknown;
    const payload = unwrapDatabricks(json);
    const cards = Array.isArray(payload.facility_cards) ? payload.facility_cards : [];
    if (!cards.length) throw new Error("No facility_cards in API response");

    return {
      facilities: cardsToAnalyzed(cards),
      careguideMessage: payload.careguide_message ?? undefined,
      emergencyNote: payload.emergency_note ?? undefined,
      source: "api",
    };
  } catch (err) {
    const demo = pickDemoResponse(query);
    const cards = demo?.facility_cards ?? [];
    return {
      facilities: cardsToAnalyzed(cards),
      careguideMessage: demo?.careguide_message ?? undefined,
      emergencyNote: demo?.emergency_note ?? undefined,
      source: "demo-fallback",
    };
  }
}

