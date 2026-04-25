export interface RawFacility {
  facility_name: string;
  city: string;
  district: string;
  state: string;
  bed_count: number;
  icu_available: boolean | string;
  oxygen_available: boolean | string;
  ambulance_available: boolean | string;
  emergency_24x7: boolean | string;
  specialist_available: string;
  unstructured_notes: string;
  latitude?: number;
  longitude?: number;
}

export interface ExtractedInfo {
  equipment: string[];
  staff: string[];
  trueEmergency24x7: boolean;
  contradictions: string[];
}

export type TrustLabel = "Verified" | "Needs Review" | "Suspicious";

export interface AnalyzedFacility extends RawFacility {
  id: string;
  extracted: ExtractedInfo;
  trustScore: number;
  trustLabel: TrustLabel;
  scoreBreakdown: { reason: string; delta: number }[];
}

export interface DistrictStat {
  district: string;
  state: string;
  facilityCount: number;
  icuRate: number;
  avgTrustScore: number;
  riskLevel: "high" | "moderate" | "low";
  lat: number;
  lng: number;
}
