import { queryCareMap } from "./api";
import type { AnalyzedFacility } from "./types";

export type FacilitySearchResult = {
  facilities: AnalyzedFacility[];
  careguideMessage?: string;
  emergencyNote?: string;
  source: "api" | "demo-fallback";
};

export async function mockFacilitySearch(query: string): Promise<FacilitySearchResult> {
  const res = await queryCareMap(query);
  return {
    facilities: res.facilities,
    careguideMessage: res.careguideMessage,
    emergencyNote: res.emergencyNote,
    source: res.source,
  };
}

