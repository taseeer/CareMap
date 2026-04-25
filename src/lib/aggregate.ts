import type { AnalyzedFacility, DistrictStat } from "./types";

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["yes", "y", "true", "1"].includes(v.trim().toLowerCase());
  return false;
}

export function computeDistrictStats(facilities: AnalyzedFacility[]): DistrictStat[] {
  const groups = new Map<string, AnalyzedFacility[]>();
  for (const f of facilities) {
    const key = `${f.district}__${f.state}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  const stats: DistrictStat[] = [];
  for (const [key, list] of groups) {
    const [district, state] = key.split("__");
    const icuCount = list.filter((f) => toBool(f.icu_available)).length;
    const icuRate = list.length ? icuCount / list.length : 0;
    const avgTrust = list.reduce((s, f) => s + f.trustScore, 0) / list.length;
    const lat = avg(list.map((f) => f.latitude).filter((v): v is number => typeof v === "number"));
    const lng = avg(list.map((f) => f.longitude).filter((v): v is number => typeof v === "number"));
    const riskLevel: DistrictStat["riskLevel"] =
      icuRate < 0.2 ? "high" : icuRate >= 0.6 ? "low" : "moderate";
    stats.push({
      district,
      state,
      facilityCount: list.length,
      icuRate,
      avgTrustScore: avgTrust,
      riskLevel,
      lat: lat ?? 0,
      lng: lng ?? 0,
    });
  }
  return stats;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface DashboardSummary {
  totalFacilities: number;
  totalDistricts: number;
  medicalDeserts: DistrictStat[];
  bestAccess: DistrictStat[];
  topAttention: DistrictStat[];
  avgTrustScore: number;
  verifiedCount: number;
  needsReviewCount: number;
  suspiciousCount: number;
}

export function buildDashboardSummary(facilities: AnalyzedFacility[]): DashboardSummary {
  const districts = computeDistrictStats(facilities);
  const medicalDeserts = districts.filter((d) => d.riskLevel === "high");
  const bestAccess = districts.filter((d) => d.riskLevel === "low");
  const topAttention = [...districts]
    .sort((a, b) => a.icuRate - b.icuRate || a.avgTrustScore - b.avgTrustScore)
    .slice(0, 5);
  const avgTrust = facilities.length
    ? facilities.reduce((s, f) => s + f.trustScore, 0) / facilities.length
    : 0;
  return {
    totalFacilities: facilities.length,
    totalDistricts: districts.length,
    medicalDeserts,
    bestAccess,
    topAttention,
    avgTrustScore: avgTrust,
    verifiedCount: facilities.filter((f) => f.trustLabel === "Verified").length,
    needsReviewCount: facilities.filter((f) => f.trustLabel === "Needs Review").length,
    suspiciousCount: facilities.filter((f) => f.trustLabel === "Suspicious").length,
  };
}
