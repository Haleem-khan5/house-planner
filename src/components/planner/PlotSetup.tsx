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

export default function PlotSetup({ onClose }: { onClose: () => void }) {
  const store = usePlannerStore();
  const [width, setWidth] = useState(store.plot.width);
  const [height, setHeight] = useState(store.plot.height);
  const [origin, setOrigin] = useState<Side>(store.plot.origin);
  const [name, setName] = useState(store.planName);

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
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
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
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
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
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diagram */}
          <div className="bg-slate-700/20 rounded-xl p-4">
            <svg viewBox="-10 -10 120 90" className="w-full h-20">
              <rect x={0} y={0} width={100} height={70} fill="#1e293b" stroke="#334155" strokeWidth={2} />
              {[['A', -8, -8], ['B', 102, -8], ['C', 102, 72], ['D', -8, 72]].map(([l, x, y]) => (
                <g key={l as string}>
                  <circle cx={Number(x) + 6} cy={Number(y) + 6} r={7}
                    fill={l === origin ? '#2563eb' : '#334155'} />
                  <text x={Number(x) + 6} y={Number(y) + 6} textAnchor="middle" dominantBaseline="central"
                    fontSize={8} fontWeight="bold" fill="white">{l}</text>
                </g>
              ))}
              <text x={50} y={-3} textAnchor="middle" fontSize={7} fill="#94a3b8">{width} ft</text>
              <text x={108} y={35} textAnchor="middle" fontSize={7} fill="#94a3b8"
                transform="rotate(-90, 108, 35)">{height} ft</text>
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
