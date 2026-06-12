'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner';
import { PlacedItem } from '@/types';
import { getItemByType } from '@/lib/items';

const SIDE_LABELS = ['A', 'B', 'C', 'D'];

function snap(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

function ItemShape({ item, scale, selected, onSelect, onDragStart }: {
  item: PlacedItem;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const def = getItemByType(item.type);
  const w = item.width * scale;
  const h = item.height * scale;
  const cx = w / 2;
  const cy = h / 2;

  const isDoor = item.type.includes('door') || item.type === 'main-gate';
  const isWindow = item.type.includes('window');
  const isRoom = ['room', 'master-bedroom', 'bedroom', 'kids-room', 'guest-room',
    'living-room', 'drawing-room', 'study', 'prayer-room', 'store-room',
    'washroom', 'bathroom', 'toilet', 'kitchen', 'garage', 'balcony',
    'garden', 'patio', 'car-parking', 'landing'].includes(item.type);

  return (
    <g
      transform={`translate(${item.x * scale}, ${item.y * scale}) rotate(${item.rotation}, ${cx}, ${cy})`}
      style={{ cursor: 'grab' }}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(); onDragStart(e); }}
    >
      {/* Main shape */}
      {isRoom ? (
        <>
          <rect
            x={0} y={0} width={w} height={h}
            fill={item.color}
            fillOpacity={0.7}
            stroke={selected ? '#3b82f6' : '#334155'}
            strokeWidth={selected ? 2 / scale * 20 : 1.5 / scale * 20}
            rx={2}
          />
          <text
            x={cx} y={cy - 6}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, Math.min(14, scale * 0.6))}
            fill="#1e293b"
            fontWeight="600"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {item.label}
          </text>
          <text
            x={cx} y={cy + 10}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(6, Math.min(10, scale * 0.45))}
            fill="#334155"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {item.width}&apos; × {item.height}&apos;
          </text>
        </>
      ) : isDoor ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill={item.color} stroke={selected ? '#3b82f6' : '#92400e'} strokeWidth={1.5} rx={1} />
          {/* Door arc */}
          <path d={`M 0 ${h} Q ${w * 0.7} ${h} ${w * 0.7} ${h - w * 0.7}`} fill="none" stroke={selected ? '#3b82f6' : '#78350f'} strokeWidth={1} strokeDasharray="3,2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(5, scale * 0.35)} fill="white" fontWeight="600"
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {item.label || 'D'}
          </text>
        </>
      ) : isWindow ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill={item.color} fillOpacity={0.5} stroke={selected ? '#3b82f6' : '#38bdf8'} strokeWidth={1.5} />
          <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={selected ? '#3b82f6' : '#0ea5e9'} strokeWidth={1} />
          <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke={selected ? '#3b82f6' : '#0ea5e9'} strokeWidth={1} />
        </>
      ) : (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.85}
            stroke={selected ? '#3b82f6' : '#475569'}
            strokeWidth={selected ? 2 / scale * 20 : 1 / scale * 20}
            rx={2}
          />
          <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, scale * 0.5)} style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {def?.icon || '📦'}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(5, Math.min(9, scale * 0.38))} fill="#1e293b"
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {item.label}
          </text>
        </>
      )}

      {/* Selection handles */}
      {selected && (
        <>
          {[
            [0, 0], [w / 2, 0], [w, 0],
            [0, h / 2], [w, h / 2],
            [0, h], [w / 2, h], [w, h],
          ].map(([hx, hy], i) => (
            <rect key={i} x={hx - 4} y={hy - 4} width={8} height={8}
              fill="white" stroke="#3b82f6" strokeWidth={1.5} rx={1}
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </>
      )}
    </g>
  );
}

export default function PlannerCanvas() {
  const store = usePlannerStore();
  const { plot, items, selectedId, scale, panX, panY, showGrid, snapToGrid, gridSize } = store;
  const svgRef = useRef<SVGSVGElement>(null);

  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const plotW = plot.width * scale;
  const plotH = plot.height * scale;

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    store.setScale(store.scale + delta);
  }, [store]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          store.removeItem(selectedId);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, store]);

  // ── Drag item ─────────────────────────────────────────────────────────────
  function onItemDragStart(e: React.PointerEvent, item: PlacedItem) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({ id: item.id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      let newX = dragging.origX + dx;
      let newY = dragging.origY + dy;
      newX = snap(newX, gridSize, snapToGrid);
      newY = snap(newY, gridSize, snapToGrid);
      // Clamp within plot
      const item = items.find((it) => it.id === dragging.id);
      if (item) {
        newX = Math.max(0, Math.min(plot.width - item.width, newX));
        newY = Math.max(0, Math.min(plot.height - item.height, newY));
      }
      store.updateItem(dragging.id, { x: newX, y: newY });
    }
    if (isPanning) {
      store.setPan(panStart.panX + e.clientX - panStart.x, panStart.panY + e.clientY - panStart.y);
    }
  }

  function onPointerUp() {
    if (dragging) {
      store.pushHistory();
      setDragging(null);
    }
    setIsPanning(false);
  }

  function onSvgPointerDown(e: React.PointerEvent) {
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, panX, panY });
    } else if (e.target === e.currentTarget || (e.target as SVGElement).dataset.bg) {
      store.setSelectedId(null);
    }
  }

  // ── Grid dots ─────────────────────────────────────────────────────────────
  const gridDots = [];
  if (showGrid) {
    const step = gridSize * scale;
    for (let x = 0; x <= plot.width; x += gridSize) {
      for (let y = 0; y <= plot.height; y += gridSize) {
        gridDots.push(<circle key={`${x}-${y}`} cx={x * scale} cy={y * scale} r={0.8} fill="#475569" opacity={0.4} />);
      }
    }
  }

  // ── Origin corner labels ──────────────────────────────────────────────────
  const originCorners: Record<string, { x: number; y: number }> = {
    A: { x: -18, y: -18 },
    B: { x: plotW + 6, y: -18 },
    C: { x: plotW + 6, y: plotH + 6 },
    D: { x: -18, y: plotH + 6 },
  };

  // Side midpoint labels
  const sideMids = [
    { label: 'Side A', x: plotW / 2, y: -24 },
    { label: 'Side B', x: plotW + 30, y: plotH / 2 },
    { label: 'Side C', x: plotW / 2, y: plotH + 30 },
    { label: 'Side D', x: -36, y: plotH / 2 },
  ];

  return (
    <div className="w-full h-full overflow-hidden bg-slate-900 relative select-none" style={{ cursor: isPanning ? 'grabbing' : 'default' }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerDown={onSvgPointerDown}
      >
        <g transform={`translate(${panX}, ${panY})`}>
          {/* Shadow */}
          <rect x={4} y={4} width={plotW} height={plotH} fill="rgba(0,0,0,0.3)" rx={2} style={{ pointerEvents: 'none' }} />

          {/* Plot background */}
          <rect x={0} y={0} width={plotW} height={plotH} fill="#f8fafc" rx={2} data-bg="true" />

          {/* Grid */}
          {gridDots}

          {/* 5-ft major grid lines */}
          {showGrid && Array.from({ length: Math.floor(plot.width / 5) + 1 }, (_, i) => i * 5).map((x) => (
            <line key={`vl${x}`} x1={x * scale} y1={0} x2={x * scale} y2={plotH}
              stroke="#94a3b8" strokeWidth={0.5} opacity={0.4} style={{ pointerEvents: 'none' }} />
          ))}
          {showGrid && Array.from({ length: Math.floor(plot.height / 5) + 1 }, (_, i) => i * 5).map((y) => (
            <line key={`hl${y}`} x1={0} y1={y * scale} x2={plotW} y2={y * scale}
              stroke="#94a3b8" strokeWidth={0.5} opacity={0.4} style={{ pointerEvents: 'none' }} />
          ))}

          {/* Scale ruler — bottom */}
          {[0, 5, 10, 15, 20, 25, 30, 35, 40].filter(v => v <= plot.width).map((ft) => (
            <g key={`ruler-h-${ft}`} style={{ pointerEvents: 'none' }}>
              <line x1={ft * scale} y1={plotH} x2={ft * scale} y2={plotH + 8} stroke="#64748b" strokeWidth={1} />
              <text x={ft * scale} y={plotH + 18} textAnchor="middle" fontSize={9} fill="#94a3b8">{ft}&apos;</text>
            </g>
          ))}
          {[0, 5, 10, 15, 20, 25, 30].filter(v => v <= plot.height).map((ft) => (
            <g key={`ruler-v-${ft}`} style={{ pointerEvents: 'none' }}>
              <line x1={0} y1={ft * scale} x2={-8} y2={ft * scale} stroke="#64748b" strokeWidth={1} />
              <text x={-12} y={ft * scale + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{ft}&apos;</text>
            </g>
          ))}

          {/* Plot border */}
          <rect x={0} y={0} width={plotW} height={plotH}
            fill="none" stroke="#1e293b" strokeWidth={3} rx={2} style={{ pointerEvents: 'none' }} />

          {/* Corner labels A, B, C, D */}
          {SIDE_LABELS.map((label, i) => {
            const corners = [
              { x: -18, y: -18 },
              { x: plotW + 6, y: -18 },
              { x: plotW + 6, y: plotH + 6 },
              { x: -18, y: plotH + 6 },
            ];
            const isOrigin = label === plot.origin;
            return (
              <g key={label} style={{ pointerEvents: 'none' }}>
                <circle cx={corners[i].x + 7} cy={corners[i].y + 7} r={10}
                  fill={isOrigin ? '#2563eb' : '#334155'} />
                <text x={corners[i].x + 7} y={corners[i].y + 7}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontWeight="bold" fill="white">
                  {label}
                </text>
              </g>
            );
          })}

          {/* Side dimension labels */}
          <text x={plotW / 2} y={-28} textAnchor="middle" fontSize={11} fill="#94a3b8" style={{ pointerEvents: 'none' }}>
            {plot.width} ft
          </text>
          <text x={plotW + 36} y={plotH / 2} textAnchor="middle" fontSize={11} fill="#94a3b8"
            transform={`rotate(-90, ${plotW + 36}, ${plotH / 2})`} style={{ pointerEvents: 'none' }}>
            {plot.height} ft
          </text>

          {/* Items — sorted by zIndex */}
          {[...items]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item) => (
              <ItemShape
                key={item.id}
                item={item}
                scale={scale}
                selected={item.id === selectedId}
                onSelect={() => store.setSelectedId(item.id)}
                onDragStart={(e) => onItemDragStart(e, item)}
              />
            ))}

          {/* Compass */}
          <g transform={`translate(${plotW - 30}, 12)`} style={{ pointerEvents: 'none' }}>
            <circle cx={0} cy={0} r={16} fill="rgba(15,23,42,0.7)" stroke="#334155" />
            <text x={0} y={-4} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight="bold">N</text>
            <line x1={0} y1={-12} x2={0} y2={0} stroke="#ef4444" strokeWidth={2} />
            <line x1={0} y1={0} x2={0} y2={12} stroke="#94a3b8" strokeWidth={2} />
          </g>
        </g>
      </svg>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs text-slate-400">
        <span>Scale: 1ft = {scale}px</span>
        <span className="text-slate-600">|</span>
        <span>Plot: {plot.width}ft × {plot.height}ft</span>
        <span className="text-slate-600">|</span>
        <span>Origin: {plot.origin}</span>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => store.setScale(scale + 2)}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-lg flex items-center justify-center transition">+</button>
        <button onClick={() => store.setScale(20)}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-xs flex items-center justify-center transition">⌂</button>
        <button onClick={() => store.setScale(scale - 2)}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-lg flex items-center justify-center transition">−</button>
      </div>
    </div>
  );
}
