import { useId } from 'react';
import type { SalesPoint } from '../types';
import { money, moneyShort } from '../lib/format';

const PALETTE = ['#C47F3B', '#6B8F71', '#638BA8', '#B4452F', '#9B5D7A', '#D9A441', '#8C6D46', '#7A8B4F'];

/** Vertical bar chart. */
export function BarChart({
  data,
  height = 200,
  format = (v) => money(v),
  color = '#C47F3B',
}: {
  data: SalesPoint[];
  height?: number;
  format?: (value: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={`${d.label}-${i}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-semibold text-roast opacity-0 transition-opacity group-hover:opacity-100">{format(d.value)}</span>
              <div
                className="w-full max-w-[38px] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(pct, d.value > 0 ? 3 : 0)}%`, background: `linear-gradient(${color}, #e8b04b)` }}
                role="img"
                aria-label={`${d.label}: ${format(d.value)}`}
              />
              <span className="truncate text-[10px] text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Smooth area line chart. */
export function LineChart({ data, height = 200, format = (v) => money(v) }: { data: SalesPoint[]; height?: number; format?: (v: number) => string }) {
  const gradientId = useId();
  const w = 600;
  const h = 200;
  const pad = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({ x: pad + i * stepX, y: h - pad - (d.value / max) * (h - pad * 3) }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points.at(-1)?.x ?? pad} ${h - pad} L ${points[0]?.x ?? pad} ${h - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label="Sales trend">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C47F3B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C47F3B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={h * g} y2={h * g} stroke="#eee3d9" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="#C47F3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#C47F3B" strokeWidth="2">
            <title>{`${data[i].label}: ${format(data[i].value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

/** Donut chart with a legend. */
export function DonutChart({ data, size = 180, format = (v) => money(v) }: { data: SalesPoint[]; size?: number; format?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label="Distribution">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f2e9df" strokeWidth="20" />
        {total > 0 &&
          data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              >
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        <text x="80" y="76" textAnchor="middle" className="fill-muted" fontSize="10">Total</text>
        <text x="80" y="94" textAnchor="middle" fontSize="17" fontWeight="700" className="fill-espresso">{moneyShort(total)}</text>
      </svg>
      <ul className="grid flex-1 gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.label}
            </span>
            <span className="font-semibold text-roast">{format(d.value)}</span>
          </li>
        ))}
        {!data.length && <li className="text-muted">No data yet</li>}
      </ul>
    </div>
  );
}

/** Horizontal ranked bars (best sellers). */
export function RankedBars({ data, format = (v) => money(v) }: { data: SalesPoint[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={`${d.label}-${i}`}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-roast">{d.label}</span>
            <span className="font-semibold text-muted">{format(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
          </div>
        </li>
      ))}
      {!data.length && <li className="text-sm text-muted">No data yet</li>}
    </ul>
  );
}
