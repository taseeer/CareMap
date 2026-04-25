import { create } from "zustand";
import type { AnalyzedFacility } from "./types";
import { SAMPLE_FACILITIES } from "./sampleData";
import { analyzeAll } from "./extraction";

interface FacilityStore {
  facilities: AnalyzedFacility[];
  source: "sample" | "uploaded";
  fileName: string | null;
  setFacilities: (f: AnalyzedFacility[], source: "sample" | "uploaded", fileName?: string) => void;
  resetToSample: () => void;
}

const initialFacilities = analyzeAll(SAMPLE_FACILITIES);

export const useFacilityStore = create<FacilityStore>((set) => ({
  facilities: initialFacilities,
  source: "sample",
  fileName: null,
  setFacilities: (facilities, source, fileName) =>
    set({ facilities, source, fileName: fileName ?? null }),
  resetToSample: () => set({ facilities: initialFacilities, source: "sample", fileName: null }),
}));
