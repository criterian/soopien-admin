'use client';

import { useId } from 'react';

/** Dependency-free area+line chart of daily clicks. Scales to its container. */
export function TimeseriesChart({ points }: { points: { date: string; clicks: number }[] }) {
  const gid = useId().replace(/:/g, '');
  const W = 720;
  const H = 200;
  const P = { l: 32, r: 12, t: 12, b: 22 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const max = Math.max(1, ...points.map((p) => p.clicks));
  const n = points.length;

  const x = (i: number) => P.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => P.t + ih - (v / max) * ih;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.clicks).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)},${(P.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(P.t + ih).toFixed(1)} Z`;

  // ~6 evenly spaced date ticks.
  const step = Math.max(1, Math.round(n / 6));
  const ticks = points.map((p, i) => ({ i, p })).filter(({ i }) => i % step === 0 || i === n - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Daily buy-link clicks" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--terracotta)" stopOpacity="0.30" />
          <stop offset="100%" stopColor="var(--terracotta)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y gridlines at 0, max/2, max */}
      {[0, 0.5, 1].map((f) => {
        const gy = P.t + ih - f * ih;
        return (
          <g key={f}>
            <line x1={P.l} y1={gy} x2={W - P.r} y2={gy} stroke="var(--divider)" strokeWidth="1" />
            <text x={P.l - 6} y={gy + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
              {Math.round(f * max)}
            </text>
          </g>
        );
      })}

      <path d={area} fill={`url(#g${gid})`} />
      <path d={line} fill="none" stroke="var(--terracotta)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {ticks.map(({ i, p }) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}
