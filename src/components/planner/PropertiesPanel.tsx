'use client';

import { usePlannerStore } from '@/store/planner';
import { getItemByType } from '@/lib/items';

const COLORS = [
  '#dbeafe','#ede9fe','#fce7f3','#dcfce7','#fef9c3','#fde68a',
  '#bfdbfe','#c4b5fd','#fca5a5','#a3e635','#67e8f9','#fbbf24',
  '#94a3b8','#374151','#92400e','#065f46',
];

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
          <label className="block text-xs font-medium text-slate-400 mb-1">Position (feet from origin)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-slate-500">X</span>
              <input type="number" step={0.5} value={item.x.toFixed(1)}
                onChange={(e) => update({ x: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Y</span>
              <input type="number" step={0.5} value={item.y.toFixed(1)}
                onChange={(e) => update({ y: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Size (feet)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-slate-500">Width</span>
              <input type="number" step={0.5} min={0.5} value={item.width.toFixed(1)}
                onChange={(e) => update({ width: Math.max(0.5, Number(e.target.value)) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Height</span>
              <input type="number" step={0.5} min={0.5} value={item.height.toFixed(1)}
                onChange={(e) => update({ height: Math.max(0.5, Number(e.target.value)) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5" />
            </div>
          </div>
          {/* Area */}
          <div className="mt-1.5 bg-slate-700/20 rounded-lg px-3 py-1.5 text-xs text-slate-400 flex justify-between">
            <span>Area</span>
            <span className="font-semibold text-slate-300">{(item.width * item.height).toFixed(1)} sq.ft</span>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Rotation: {item.rotation}°
          </label>
          <input type="range" min={0} max={359} step={15} value={item.rotation}
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
          <input type="number" min={0} max={10} value={item.zIndex}
            onChange={(e) => update({ zIndex: Number(e.target.value) })}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>

        {/* Coordinates summary */}
        <div className="bg-slate-700/20 rounded-xl p-3">
          <div className="text-xs font-medium text-slate-400 mb-2">Coordinates Summary</div>
          <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-400">
            <span>Top-left</span>
            <span className="font-mono text-slate-300">({item.x.toFixed(1)}, {item.y.toFixed(1)})</span>
            <span>Top-right</span>
            <span className="font-mono text-slate-300">({(item.x + item.width).toFixed(1)}, {item.y.toFixed(1)})</span>
            <span>Bottom-left</span>
            <span className="font-mono text-slate-300">({item.x.toFixed(1)}, {(item.y + item.height).toFixed(1)})</span>
            <span>Bottom-right</span>
            <span className="font-mono text-slate-300">({(item.x + item.width).toFixed(1)}, {(item.y + item.height).toFixed(1)})</span>
          </div>
        </div>

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
