'use client';

import { useState, useRef } from 'react';
import { usePlannerStore } from '@/store/planner';
import { ITEM_LIBRARY, ITEM_CATEGORIES } from '@/lib/items';
import { DRAWING_TYPE_META } from '@/lib/drawingTypes';
import { ItemDefinition, PlacedItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getVisibleCenter } from '@/lib/canvasRef';

// Categories shown for each drawing type
const TYPE_CATEGORIES: Record<string, string[]> = {
  architectural: ['structure', 'rooms', 'doors', 'windows', 'bathroom', 'kitchen', 'bedroom', 'living', 'dining', 'storage', 'outdoor', 'stairs', 'study', 'pathway'],
  structural:    ['structural-eng', 'structure'],
  electrical:    ['electrical'],
  plumbing:      ['plumbing', 'bathroom'],
  foundation:    ['foundation-eng', 'structural-eng'],
  'site-plan':   ['site', 'outdoor', 'pathway'],
  elevation:     ['elevation-view'],
};

export default function ItemPanel() {
  const store = usePlannerStore();
  const drawingType = store.drawingType;
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(['rooms', 'doors', 'bathroom', 'kitchen', 'electrical', 'plumbing', 'structural-eng', 'foundation-eng', 'site', 'elevation-view'])
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const allowedCats = TYPE_CATEGORIES[drawingType] ?? TYPE_CATEGORIES.architectural;
  const meta = DRAWING_TYPE_META[drawingType];

  const visibleItems = ITEM_LIBRARY.filter((it) => allowedCats.includes(it.category));

  const filtered = search.trim()
    ? visibleItems.filter(
        (it) =>
          it.name.toLowerCase().includes(search.toLowerCase()) ||
          it.description.toLowerCase().includes(search.toLowerCase()) ||
          it.category.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function addItem(def: ItemDefinition) {
    const { plot, panX, panY, scale } = store;
    const visCenter = getVisibleCenter(panX, panY, scale, plot.width, plot.height);
    const cx = Math.max(0, Math.min(plot.width  - def.defaultWidth,  visCenter.x - def.defaultWidth  / 2));
    const cy = Math.max(0, Math.min(plot.height - def.defaultHeight, visCenter.y - def.defaultHeight / 2));

    const zMap: Record<string, number> = {
      structure: 0, rooms: 1, bathroom: 1, kitchen: 1,
      doors: 5, windows: 5, stairs: 3,
      bedroom: 4, living: 4, dining: 4, storage: 4, outdoor: 2, study: 4,
      electrical: 6, plumbing: 6, 'structural-eng': 1, 'foundation-eng': 0,
      site: 1, 'elevation-view': 1,
    };

    const item: PlacedItem = {
      id: uuidv4(),
      type: def.type,
      name: def.name,
      label: def.name,
      x: cx,
      y: cy,
      width: def.defaultWidth,
      height: def.defaultHeight,
      rotation: 0,
      color: def.color,
      locked: false,
      zIndex: zMap[def.category] ?? 3,
    };
    store.addItem(item);
    store.setSelectedId(item.id);
  }

  function ItemCard({ def }: { def: ItemDefinition }) {
    return (
      <button
        onClick={() => addItem(def)}
        className="group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-700/60 transition-all text-left"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: def.color + '33', border: `1px solid ${def.color}55` }}
        >
          {def.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-200 truncate">{def.name}</div>
          <div className="text-xs text-slate-500 truncate">
            {def.defaultWidth}&apos; × {def.defaultHeight}&apos;
          </div>
        </div>
        <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs transition">+ Add</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-850 border-r border-slate-700">
      {/* Drawing type indicator */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: meta.color + '18', border: `1px solid ${meta.color}33` }}>
          <span className="text-base">{meta.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: meta.color }}>{meta.label}</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pb-2 pt-1 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Add Items</h3>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {filtered ? (
          filtered.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">No items found</div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((def) => <ItemCard key={def.type} def={def} />)}
            </div>
          )
        ) : (
          allowedCats.map((cat) => {
            const items = visibleItems.filter((it) => it.category === cat);
            if (!items.length) return null;
            const open = expandedCats.has(cat);
            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/40 transition text-left"
                >
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {ITEM_CATEGORIES[cat] || cat}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {open && (
                  <div className="ml-1 space-y-0.5">
                    {items.map((def) => <ItemCard key={def.type} def={def} />)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tip */}
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-600 leading-relaxed">
          Click to add · Drag to move · Arrow keys to nudge · ✕ to delete
        </p>
      </div>
    </div>
  );
}
