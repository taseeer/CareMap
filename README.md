# MedDesert AI — Healthcare Intelligence

AI-powered analysis of Indian hospital records to identify medical deserts and verify facility claims. Built for **Hack-Nation Challenge #3 — Agentic Healthcare Maps**.

## Features

- **Excel upload** (drag & drop, .xlsx / .xls)
- **Rule-based AI extraction** of equipment, staff, and true 24/7 status from messy free-text notes (with negation handling)
- **Trust scorer** (0–100) that flags contradictions like "Advanced Surgery claimed but no anesthesiologist"
- **Dashboard** with medical-desert detection, top-attention districts, and trust distribution
- **Interactive India map** color-coded by trust score (Verified / Needs Review / Suspicious)
- **Search, filter, sort** and per-facility detail view with score breakdown
- **CSV export** of full or filtered results
- **Sample dataset** preloaded + downloadable `sample-hospitals.xlsx`

## Tech stack

- **Frontend**: React 19 + TanStack Start + Tailwind v4
- **Server**: TanStack server functions running on Cloudflare Workers (the platform doesn't host Python/FastAPI; same architecture, edge-deployed)
- **Excel parsing**: `xlsx` (SheetJS) — runs client-side
- **State**: Zustand
- **Map**: Custom SVG with lat/lng projection (lightweight, no tile dependency)

## Run locally

```bash
bun install
bun run dev
```

Open http://localhost:8080.

## Dataset schema

| column | type | notes |
| --- | --- | --- |
| `facility_name` | string | required |
| `city`, `district`, `state` | string | required |
| `bed_count` | integer | |
| `icu_available`, `oxygen_available`, `ambulance_available`, `emergency_24x7` | bool / "yes"/"no" | both accepted |
| `specialist_available` | string | comma-separated |
| `unstructured_notes` | string | messy free text — this is what the extractor reads |
| `latitude`, `longitude` | float | optional, needed for map |

Use the **Upload page → "Download sample.xlsx"** button to grab a starter file.

## Trust scoring rules

Starts at 70, then:

| condition | delta |
| --- | --- |
| Advanced surgery claimed, no anesthesiologist in notes | −30 |
| ICU claimed, no ICU/ventilator in notes | −25 |
| 24/7 emergency claimed but contradicted by notes | −40 |
| Oxygen / ambulance claimed but missing from notes | −25 |
| ICU + matching equipment | +10 |
| Oxygen + matching equipment | +5 |
| 3+ distinct staff types mentioned | +5 |
| Zero contradictions | +10 |

Final label: **Verified** ≥ 80, **Needs Review** 50–79, **Suspicious** < 50.

## Adding a real LLM later

The extractor lives in `src/lib/extraction.ts`. To swap in OpenAI:

1. Move `extractFromNotes` into a TanStack server function (`createServerFn`) so the API key stays on the server.
2. Replace the regex pipeline with an LLM call, returning the same `ExtractedInfo` shape.
3. Keep `scoreFacility` unchanged — it already consumes `ExtractedInfo`.
