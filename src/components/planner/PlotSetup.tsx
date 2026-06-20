'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Side } from '@/types';

const ORIGIN_OPTIONS: { value: Side; label: string; desc: string }[] = [
  { value: 'A', label: 'Corner A', desc: 'Top-left' },
  { value: 'B', label: 'Corner B', desc: 'Top-right' },
  { value: 'C', label: 'Corner C', desc: 'Bottom-right' },
  { value: 'D', label: 'Corner D', desc: 'Bottom-left' },
];

function parseDim(raw: string, fallback: number, min = 10, max = 200): number {
  const n = parseFloat(raw);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default function PlotSetup({ onClose }: { onClose: () => void }) {
  const store = usePlannerStore();
  const [widthStr, setWidthStr] = useState(String(store.plot.width));
  const [heightStr, setHeightStr] = useState(String(store.plot.height));
  const [origin, setOrigin] = useState<Side>(store.plot.origin);
  const [name, setName] = useState(store.planName);

  // Parsed numbers (used only for area preview and Apply)
  const width = parseDim(widthStr, store.plot.width);
  const height = parseDim(heightStr, store.plot.height);

  function handleApply() {
    store.setPlot({ width, height, origin });
    store.setPlanMeta(store.planId, name, store.planDescription);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Plot Setup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Plan name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My House Plan"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Width (feet)
              </label>
              <input
                type="number"
                min={10} max={200}
                value={widthStr}
                onChange={(e) => setWidthStr(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => setWidthStr(String(parseDim(e.target.value, width)))}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Height / Depth (feet)
              </label>
              <input
                type="number"
                min={10} max={200}
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => setHeightStr(String(parseDim(e.target.value, height)))}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Area preview */}
          <div className="bg-slate-700/30 rounded-xl p-3 text-sm text-slate-400 flex justify-between">
            <span>Plot area</span>
            <span className="font-semibold text-slate-200">{width * height} sq.ft &nbsp;|&nbsp; {(width * height / 9).toFixed(1)} sq.yards</span>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Origin Corner (coordinate reference)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ORIGIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOrigin(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-left ${
                    origin === opt.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                    origin === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {opt.value}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                    <div className="text-xs text-slate-500">{opt.desc}</div>
                    {origin === opt.value && (
                      <div className="text-xs font-mono font-semibold text-blue-400 mt-0.5">(X,Y) = (0,0)</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diagram */}
          <div className="bg-slate-700/20 rounded-xl p-4">
            <svg viewBox="-20 -20 150 110" className="w-full h-24">
              <rect x={0} y={0} width={100} height={70} fill="#1e293b" stroke="#334155" strokeWidth={2} />
              {([
                ['A', -8, -8, 'middle', 'auto'],
                ['B', 102, -8, 'start', 'auto'],
                ['C', 102, 72, 'start', 'hanging'],
                ['D', -8, 72, 'middle', 'hanging'],
              ] as const).map(([l, x, y, anchor, baseline]) => {
                const isOrigin = l === origin;
                const cx = Number(x) + 6;
                const cy = Number(y) + 6;
                // position the (0,0) label away from the plot edge
                const labelOffsets: Record<string, [number, number]> = {
                  A: [-2, -10], B: [2, -10], C: [2, 10], D: [-2, 10],
                };
                const [lox, loy] = labelOffsets[l];
                return (
                  <g key={l}>
                    <circle cx={cx} cy={cy} r={8} fill={isOrigin ? '#2563eb' : '#334155'} />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                      fontSize={8} fontWeight="bold" fill="white">{l}</text>
                    {isOrigin && (
                      <text x={cx + lox} y={cy + loy} textAnchor="middle" dominantBaseline="central"
                        fontSize={6} fill="#60a5fa" fontFamily="monospace">(0,0)</text>
                    )}
                  </g>
                );
              })}
              <text x={50} y={-8} textAnchor="middle" fontSize={7} fill="#94a3b8">{width} ft</text>
              <text x={114} y={35} textAnchor="middle" fontSize={7} fill="#94a3b8"
                transform="rotate(-90, 114, 35)">{height} ft</text>
            </svg>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/20">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
