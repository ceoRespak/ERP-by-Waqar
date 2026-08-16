"use client";

type Point = { reportDate: Date | string; plannedPercent: number; actualPercent: number };

/** Dependency-free SVG S-curve chart: planned % (dashed) vs actual % (solid). */
export function SCurveChart({ points }: { points: Point[] }) {
  const W = 700;
  const H = 260;
  const PAD = { top: 16, right: 24, bottom: 32, left: 44 };

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No progress data yet — record daily progress to build the S-curve.
      </div>
    );
  }

  const maxPercent = Math.max(100, ...points.map((p) => Math.max(p.plannedPercent, p.actualPercent)));
  const n = points.length;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxPercent) * innerH;

  const path = (key: "plannedPercent" | "actualPercent") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key])}`).join(" ");

  // X-axis labels (dates) — show a few evenly spaced
  const labelEvery = Math.max(1, Math.ceil(n / 6));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Project S-curve">
        {/* gridlines */}
        {[0, 25, 50, 75, 100].filter((v) => v <= maxPercent).map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={y(v)} x2={W - PAD.right} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {v}%
            </text>
          </g>
        ))}

        {/* planned (dashed) */}
        <path d={path("plannedPercent")} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" />
        {/* actual (solid) */}
        <path d={path("actualPercent")} fill="none" stroke="#0ea5e9" strokeWidth={2.5} />

        {/* date labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {new Date(p.reportDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </text>
          ) : null
        )}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-amber-500" /> Planned
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-sky-500" /> Actual
        </span>
      </div>
    </div>
  );
}
