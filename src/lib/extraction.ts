import type { RawFacility, ExtractedInfo, AnalyzedFacility, TrustLabel } from "./types";

const EQUIPMENT_PATTERNS: Array<{ key: string; rx: RegExp }> = [
  { key: "Ventilators", rx: /\b(ventilator|venti|bipap|cpap)s?\b/i },
  { key: "Oxygen cylinders", rx: /\b(oxygen|o2)\s*(cylinder|tank|supply)?s?\b/i },
  { key: "Defibrillators", rx: /\b(defib|defibrillator|aed)s?\b/i },
  { key: "ECG machine", rx: /\b(ecg|ekg)\b/i },
  { key: "X-Ray", rx: /\b(x[- ]?ray|xray)\b/i },
  { key: "CT Scan", rx: /\bct[- ]?scan|computed tomography\b/i },
  { key: "MRI", rx: /\bmri\b/i },
  { key: "Ultrasound", rx: /\b(ultrasound|sonography|usg)\b/i },
  { key: "Dialysis machine", rx: /\bdialy(sis|zer)\b/i },
  { key: "Operating theater", rx: /\b(ot|operation theatre|operating theater|surgery room)\b/i },
  { key: "ICU beds", rx: /\bicu\s*beds?\b/i },
  { key: "Ambulance", rx: /\bambulance(s)?\b/i },
];

const STAFF_PATTERNS: Array<{ key: string; rx: RegExp }> = [
  { key: "Anesthesiologist", rx: /\b(anesthes(iologist|tist)|anaesth)\b/i },
  { key: "Surgeon", rx: /\bsurg(eon|ery doctor)s?\b/i },
  { key: "Cardiologist", rx: /\bcardiolog(ist|y)\b/i },
  { key: "Pediatrician", rx: /\bpaed?iatric(ian|s)?\b/i },
  { key: "Gynecologist", rx: /\bgyn(a?ecolog(ist|y)|ae)\b/i },
  { key: "Radiologist", rx: /\bradiolog(ist|y)\b/i },
  { key: "Nurses", rx: /\bnurs(e|ing|es)\b/i },
  { key: "General Physician", rx: /\b(general\s+physician|gp|mbbs doctor)\b/i },
  { key: "Orthopedic", rx: /\borthop(a?ed(ic|ist)|aedic)\b/i },
  { key: "Neurologist", rx: /\bneurolog(ist|y)\b/i },
];

const NEGATION_RX = /\b(no|not|without|absent|unavailable|lack(ing)?|missing|none|n\/a|broken|out of order|non[- ]?functional|under\s+repair)\b/i;

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return ["yes", "y", "true", "1", "available", "present"].includes(s);
  }
  return false;
}

/** Check whether a notes sentence near a match is negated. */
function isNegatedAround(notes: string, matchIndex: number, matchLen: number): boolean {
  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(notes.length, matchIndex + matchLen + 20);
  const window = notes.slice(start, end);
  return NEGATION_RX.test(window);
}

function extractMatches(notes: string, patterns: Array<{ key: string; rx: RegExp }>): string[] {
  const found = new Set<string>();
  for (const { key, rx } of patterns) {
    const m = notes.match(rx);
    if (m && m.index !== undefined) {
      if (!isNegatedAround(notes, m.index, m[0].length)) {
        found.add(key);
      }
    }
  }
  return Array.from(found);
}

export function extractFromNotes(raw: RawFacility): ExtractedInfo {
  const notes = (raw.unstructured_notes ?? "").toString();
  const equipment = extractMatches(notes, EQUIPMENT_PATTERNS);
  const staff = extractMatches(notes, STAFF_PATTERNS);

  // True 24/7 emergency: claim must be supported by notes (or at least not denied)
  const claimed247 = toBool(raw.emergency_24x7);
  const notesDeny247 = /(no|not|without|closed|day[- ]?only|day shift|night closed|no night)\s+(emergency|24x7|24\/7|night)/i.test(notes);
  const notesAffirm247 = /(24[\s/x*-]?7|round[- ]?the[- ]?clock|night emergency|24 hours?)/i.test(notes);
  const trueEmergency24x7 = claimed247 && !notesDeny247 ? true : notesAffirm247 && !notesDeny247;

  // Contradictions
  const contradictions: string[] = [];
  if (toBool(raw.icu_available) && !equipment.some((e) => /icu|ventilator/i.test(e))) {
    contradictions.push("ICU claimed but no ICU/ventilator equipment found in notes");
  }
  if (toBool(raw.oxygen_available) && !equipment.includes("Oxygen cylinders")) {
    contradictions.push("Oxygen claimed but no oxygen supply mentioned in notes");
  }
  if (toBool(raw.ambulance_available) && !equipment.includes("Ambulance")) {
    contradictions.push("Ambulance claimed but not mentioned in notes");
  }
  if (claimed247 && notesDeny247) {
    contradictions.push("24/7 emergency claimed but notes contradict it");
  }
  const specs = (raw.specialist_available ?? "").toString().toLowerCase();
  if (/advanced surgery|major surgery|cardiac surgery/.test(specs) && !staff.includes("Anesthesiologist")) {
    contradictions.push("Advanced surgery claimed but no anesthesiologist on staff");
  }
  if (/cardiology|heart/.test(specs) && !staff.includes("Cardiologist")) {
    contradictions.push("Cardiology claimed but no cardiologist mentioned");
  }

  return { equipment, staff, trueEmergency24x7, contradictions };
}

export function scoreFacility(raw: RawFacility, extracted: ExtractedInfo) {
  let score = 70;
  const breakdown: { reason: string; delta: number }[] = [{ reason: "Base score", delta: 70 }];

  for (const c of extracted.contradictions) {
    let d = -25;
    if (/24\/7/.test(c)) d = -40;
    else if (/anesthesiologist/i.test(c)) d = -30;
    else if (/ICU/.test(c)) d = -25;
    score += d;
    breakdown.push({ reason: c, delta: d });
  }

  // Reward consistent claims
  if (toBool(raw.icu_available) && extracted.equipment.some((e) => /icu|ventilator/i.test(e))) {
    score += 10;
    breakdown.push({ reason: "ICU claim consistent with equipment", delta: 10 });
  }
  if (toBool(raw.oxygen_available) && extracted.equipment.includes("Oxygen cylinders")) {
    score += 5;
    breakdown.push({ reason: "Oxygen claim consistent with notes", delta: 5 });
  }
  if (extracted.staff.length >= 3) {
    score += 5;
    breakdown.push({ reason: "Diverse staff mentioned", delta: 5 });
  }
  if (extracted.contradictions.length === 0) {
    score += 10;
    breakdown.push({ reason: "No contradictions found", delta: 10 });
  }

  score = Math.max(0, Math.min(100, score));
  let label: TrustLabel = "Suspicious";
  if (score >= 80) label = "Verified";
  else if (score >= 50) label = "Needs Review";

  return { score, label, breakdown };
}

export function analyzeFacility(raw: RawFacility, idx: number): AnalyzedFacility {
  const extracted = extractFromNotes(raw);
  const { score, label, breakdown } = scoreFacility(raw, extracted);
  return {
    ...raw,
    bed_count: Number(raw.bed_count) || 0,
    id: `${idx}-${(raw.facility_name || "facility").toString().replace(/\s+/g, "-").toLowerCase()}`,
    extracted,
    trustScore: score,
    trustLabel: label,
    scoreBreakdown: breakdown,
  };
}

export function analyzeAll(rows: RawFacility[]): AnalyzedFacility[] {
  return rows.map((r, i) => analyzeFacility(r, i));
}
