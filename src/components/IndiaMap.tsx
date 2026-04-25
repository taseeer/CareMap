import { useMemo, useState } from "react";
import type { AnalyzedFacility } from "@/lib/types";
import { TrustBadge } from "./TrustBadge";
import { Link } from "@tanstack/react-router";

// India bounding box (approx)
const BOUNDS = { minLat: 6.5, maxLat: 36.5, minLng: 67.5, maxLng: 97.5 };

function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * w;
  const y = h - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * h;
  return { x, y };
}

function colorForTrust(score: number) {
  if (score >= 80) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

interface Props {
  facilities: AnalyzedFacility[];
}

export function IndiaMap({ facilities }: Props) {
  const [hovered, setHovered] = useState<AnalyzedFacility | null>(null);
  const [selected, setSelected] = useState<AnalyzedFacility | null>(null);

  const W = 800;
  const H = 800;

  const points = useMemo(
    () =>
      facilities
        .filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number")
        .map((f) => ({ f, ...project(f.latitude!, f.longitude!, W, H) })),
    [facilities],
  );

  return (
    <div className="relative w-full">
      <div className="aspect-square w-full rounded-2xl border border-border overflow-hidden"
        style={{ background: "var(--gradient-surface)" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="oklch(0.62 0.21 275 / 0.18)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.27 0.05 270)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />
          <rect width={W} height={H} fill="url(#bgGlow)" />

          {/* Stylized India outline – simplified silhouette */}
          <path
            d={INDIA_PATH}
            fill="oklch(0.21 0.05 270 / 0.7)"
            stroke="oklch(0.62 0.21 275 / 0.45)"
            strokeWidth="1.5"
          />

          {/* Markers */}
          {points.map(({ f, x, y }) => (
            <g
              key={f.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(f)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(f)}
            >
              <circle r="14" fill={colorForTrust(f.trustScore)} opacity="0.18">
                <animate attributeName="r" values="10;18;10" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle
                r="6"
                fill={colorForTrust(f.trustScore)}
                stroke="oklch(0.13 0.03 270)"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs space-y-1.5">
        <div className="font-semibold mb-1">Healthcare access</div>
        {[
          { c: "var(--color-success)", l: "Good (Verified)" },
          { c: "var(--color-warning)", l: "Moderate" },
          { c: "var(--color-danger)", l: "Medical Desert" },
        ].map((r) => (
          <div key={r.l} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c }} />
            <span className="text-muted-foreground">{r.l}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hovered && !selected && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-popover border border-border rounded-lg p-3 shadow-[var(--shadow-card)] pointer-events-none">
          <div className="font-semibold text-sm">{hovered.facility_name}</div>
          <div className="text-xs text-muted-foreground">
            {hovered.city}, {hovered.state}
          </div>
          <div className="mt-2">
            <TrustBadge label={hovered.trustLabel} score={hovered.trustScore} />
          </div>
        </div>
      )}

      {/* Selected popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-popover border border-border rounded-xl p-4 shadow-[var(--shadow-elegant)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{selected.facility_name}</div>
              <div className="text-xs text-muted-foreground">
                {selected.city}, {selected.district}, {selected.state}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-3">
            <TrustBadge label={selected.trustLabel} score={selected.trustScore} />
          </div>
          {selected.extracted.equipment.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Extracted equipment
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.extracted.equipment.slice(0, 6).map((e) => (
                  <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link
            to="/facility/$id"
            params={{ id: selected.id }}
            className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            View full report →
          </Link>
        </div>
      )}
    </div>
  );
}

// Heavily simplified India silhouette (decorative). Coordinates already scaled to 800x800.
const INDIA_PATH = `
M 380 110
L 430 130 L 470 120 L 510 145 L 540 180 L 560 210
L 600 235 L 625 275 L 615 310 L 595 340 L 615 370
L 640 400 L 655 445 L 640 490 L 600 530 L 555 575
L 510 615 L 470 660 L 430 700 L 400 720 L 370 700
L 345 660 L 320 615 L 295 580 L 270 540 L 250 500
L 230 460 L 215 415 L 210 370 L 215 325 L 235 285
L 260 250 L 280 215 L 305 185 L 335 155 L 360 130 Z
`;
