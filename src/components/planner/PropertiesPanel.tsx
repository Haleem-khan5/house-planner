'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '@/store/planner';
import { getItemByType } from '@/lib/items';
import { svgToDisplay, displayToSvg, maxDisplay } from '@/lib/coordinates';
import DividePanel from './DividePanel';

const COLORS = [
  '#dbeafe','#ede9fe','#fce7f3','#dcfce7','#fef9c3','#fde68a',
  '#bfdbfe','#c4b5fd','#fca5a5','#a3e635','#67e8f9','#fbbf24',
  '#94a3b8','#374151','#92400e','#065f46',
];

// ── NumberInput ─────────────────────────────────────────────────────────────
// Buffers keyboard input locally; only commits to the store on blur or Enter.
// This way you can freely type any number without the field fighting you.
function NumberInput({
  value,
  min,
  max,
  step = 0.5,
  onChange,
  className = '',
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);
  const prevId = useRef<string | null>(null);

  // When the store value changes and we're NOT focused, sync the display.
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit(raw: string) {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      setDraft(String(value)); // revert to last valid
      return;
    }
    let clamped = parsed;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    onChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        setFocused(false);
        commit(e.currentTarget.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}

const inputCls =
  'w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5';

export default function PropertiesPanel() {
  const store = usePlannerStore();
  const { selectedId, items } = store;
  const item = items.find((it) => it.id === selectedId);

  if (!item) {
    return (
      <div className="flex flex-col h-full bg-slate-850 border-l border-slate-700">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Select an item on the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const def = getItemByType(item.type);
  const update = (patch: Partial<typeof item>) => store.updateItem(item.id, patch);

  return (
    <div className="flex flex-col h-full bg-slate-850 border-l border-slate-700">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</h3>
        <button
          onClick={() => store.removeItem(item.id)}
          className="text-red-400 hover:text-red-300 transition p-1 rounded hover:bg-red-500/10"
          title="Delete item"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{def?.icon || '📦'}</span>
          <div>
            <div className="text-sm font-semibold text-slate-200">{item.name}</div>
            <div className="text-xs text-slate-500">{def?.description}</div>
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Label</label>
          <input
            type="text"
            value={item.label}
            onChange={(e) => update({ label: e.target.value })}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Position from origin <span className="text-blue-400 font-mono">{store.plot.origin}</span> (feet)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const disp = svgToDisplay(item.x, item.y, item.width, item.height, store.plot);
              const maxD = maxDisplay(item.width, item.height, store.plot);
              return (
                <>
                  <div>
                    <span className="text-xs text-slate-500">X (width-wise)</span>
                    <NumberInput
                      value={parseFloat(disp.x.toFixed(2))}
                      min={0}
                      max={parseFloat(maxD.x.toFixed(2))}
                      step={0.5}
                      onChange={(v) => {
                        const svg = displayToSvg(v, disp.y, item.width, item.height, store.plot);
                        update({ x: Math.max(0, Math.min(store.plot.width - item.width, svg.x)) });
                      }}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Y (height-wise)</span>
                    <NumberInput
                      value={parseFloat(disp.y.toFixed(2))}
                      min={0}
                      max={parseFloat(maxD.y.toFixed(2))}
                      step={0.5}
                      onChange={(v) => {
                        const svg = displayToSvg(disp.x, v, item.width, item.height, store.plot);
                        update({ y: Math.max(0, Math.min(store.plot.height - item.height, svg.y)) });
                      }}
                      className={inputCls}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Size (feet)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-slate-500">Width</span>
              <NumberInput
                value={item.width}
                min={0.5}
                step={0.5}
                onChange={(v) => update({ width: v })}
                className={inputCls}
              />
            </div>
            <div>
              <span className="text-xs text-slate-500">Height</span>
              <NumberInput
                value={item.height}
                min={0.5}
                step={0.5}
                onChange={(v) => update({ height: v })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-1.5 bg-slate-700/20 rounded-lg px-3 py-1.5 text-xs text-slate-400 flex justify-between">
            <span>Area</span>
            <span className="font-semibold text-slate-300">{(item.width * item.height).toFixed(1)} sq.ft</span>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">Rotation</label>
            <div className="flex items-center gap-1.5">
              <NumberInput
                value={item.rotation}
                min={0}
                max={359}
                step={1}
                onChange={(v) => update({ rotation: Math.round(v) % 360 })}
                className="w-16 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500">°</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={item.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex gap-1 mt-1">
            {[0, 90, 180, 270].map((deg) => (
              <button key={deg} onClick={() => update({ rotation: deg })}
                className={`flex-1 py-1 rounded text-xs transition ${item.rotation === deg ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button key={c} onClick={() => update({ color: c })}
                className={`w-6 h-6 rounded transition ${item.color === c ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="color" value={item.color}
              onChange={(e) => update({ color: e.target.value })}
              className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
            <input type="text" value={item.color}
              onChange={(e) => update({ color: e.target.value })}
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" />
          </div>
        </div>

        {/* Z-Index */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Layer (z-index)</label>
          <NumberInput
            value={item.zIndex}
            min={0}
            max={10}
            step={1}
            onChange={(v) => update({ zIndex: Math.round(v) })}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Coordinates summary */}
        <div className="bg-slate-700/20 rounded-xl p-3">
          <div className="text-xs font-medium text-slate-400 mb-2">
            Corner Coordinates&nbsp;
            <span className="text-blue-400 font-mono text-[10px]">(from origin {store.plot.origin})</span>
          </div>
          {(() => {
            // Compute all 4 SVG corners then convert each to display coords
            const corners = [
              { label: 'Top-left',     sx: item.x,              sy: item.y,               iw: 0, ih: 0 },
              { label: 'Top-right',    sx: item.x + item.width, sy: item.y,               iw: item.width, ih: 0 },
              { label: 'Bottom-left',  sx: item.x,              sy: item.y + item.height, iw: 0, ih: item.height },
              { label: 'Bottom-right', sx: item.x + item.width, sy: item.y + item.height, iw: item.width, ih: item.height },
            ].map(({ label, sx, sy, iw, ih }) => ({
              label,
              disp: svgToDisplay(sx - iw, sy - ih, iw || item.width, ih || item.height, store.plot),
            }));
            // Simpler: just convert each raw corner point directly
            const pt = (svgPtX: number, svgPtY: number) => {
              // For a point (not an area), treat itemW/itemH as 0 and add the point directly
              // Use origin A as base: display = transformed point
              const { origin, width: W, height: H } = store.plot;
              switch (origin) {
                case 'A': return { x: svgPtX,     y: svgPtY };
                case 'B': return { x: W - svgPtX, y: svgPtY };
                case 'C': return { x: W - svgPtX, y: H - svgPtY };
                case 'D': return { x: svgPtX,     y: H - svgPtY };
              }
            };
            const tl = pt(item.x,              item.y);
            const tr = pt(item.x + item.width, item.y);
            const bl = pt(item.x,              item.y + item.height);
            const br = pt(item.x + item.width, item.y + item.height);
            return (
              <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-400">
                <span>Top-left</span>
                <span className="font-mono text-slate-300">({tl.x.toFixed(1)}, {tl.y.toFixed(1)})</span>
                <span>Top-right</span>
                <span className="font-mono text-slate-300">({tr.x.toFixed(1)}, {tr.y.toFixed(1)})</span>
                <span>Bottom-left</span>
                <span className="font-mono text-slate-300">({bl.x.toFixed(1)}, {bl.y.toFixed(1)})</span>
                <span>Bottom-right</span>
                <span className="font-mono text-slate-300">({br.x.toFixed(1)}, {br.y.toFixed(1)})</span>
              </div>
            );
          })()}
        </div>

        {/* Divide */}
        <DividePanel item={item} />

        {/* Delete */}
        <button
          onClick={() => store.removeItem(item.id)}
          className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition"
        >
          Delete Item
        </button>
      </div>
    </div>
  );
}
