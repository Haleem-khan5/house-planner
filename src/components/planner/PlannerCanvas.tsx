'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner';
import { PlacedItem } from '@/types';
import { getItemByType } from '@/lib/items';
import { DRAWING_TYPE_META } from '@/lib/drawingTypes';
import { svgToDisplay } from '@/lib/coordinates';
import { canvasElRef } from '@/lib/canvasRef';

const SIDE_LABELS = ['A', 'B', 'C', 'D'];

function snap(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

function ItemShape({ item, scale, selected, onSelect, onDragStart, onDelete, drawingType }: {
  item: PlacedItem;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onDelete: () => void;
  drawingType: string;
}) {
  const def = getItemByType(item.type);
  const w = item.width * scale;
  const h = item.height * scale;
  const cx = w / 2;
  const cy = h / 2;

  const isSlidingDoor = item.type === 'sliding-door';
  const isDoor = !isSlidingDoor && (item.type.includes('door') || item.type === 'main-gate');
  const isWindow = item.type.includes('window');
  const isWall = item.type.startsWith('wall') || item.type.startsWith('exterior-wall');
  const isPathway = ['pathway', 'road', 'driveway', 'footpath', 'lane', 'garden-path', 'bridge', 'site-road'].includes(item.type);
  const isRoom = ['room', 'master-bedroom', 'bedroom', 'kids-room', 'guest-room',
    'living-room', 'drawing-room', 'study', 'prayer-room', 'store-room',
    'washroom', 'bathroom', 'toilet', 'kitchen', 'garage', 'balcony',
    'garden', 'patio', 'car-parking', 'landing', 'stairs'].includes(item.type);
  const isElectrical = item.type.startsWith('ceiling-') || item.type === 'switch-single' || item.type === 'switch-double' || item.type === 'socket' || item.type === 'ac-unit' || item.type === 'db-board' || item.type === 'exhaust-fan' || item.type.startsWith('wiring-');
  const isPlumbing = ['overhead-tank','underground-tank','water-pump','geyser','supply-pipe-h','supply-pipe-v','drain-pipe-h','drain-pipe-v','stopcock','floor-drain'].includes(item.type);
  const isColumn = ['rcc-column','col-footing','pad-footing'].includes(item.type);
  const isBeam = ['beam-h','beam-v','lb-wall-h','lb-wall-v','steel-lintel','plinth-beam','strip-footing-h','strip-footing-v','dpc-layer'].includes(item.type);
  const isSlab = item.type === 'rcc-slab';
  const isTree = ['tree','shrub'].includes(item.type);
  const isElevation = item.type.startsWith('elev-');

  const selColor = '#3b82f6';
  const selWidth = selected ? 2.5 : 0;

  return (
    <g
      transform={`translate(${item.x * scale}, ${item.y * scale}) rotate(${item.rotation}, ${cx}, ${cy})`}
      style={{ cursor: 'grab' }}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(); onDragStart(e); }}
    >
      {isWall ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill="#1c1c1c" stroke={selected ? selColor : '#000'} strokeWidth={selected ? 2 : 1} />
          {/* Cross-hatch for architectural wall section */}
          {Array.from({ length: Math.ceil((w + h) / (scale * 0.5)) }).map((_, i) => {
            const s = scale * 0.5;
            const o = i * s - h;
            return (
              <line key={i}
                x1={Math.max(0, o)} y1={Math.min(h, -o)}
                x2={Math.min(w, o + h)} y2={Math.max(0, h - (Math.min(w, o + h) - Math.max(0, o)))}
                stroke="rgba(255,255,255,0.15)" strokeWidth={0.6}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </>
      ) : isRoom ? (
        <>
          {/* Architectural room — white fill, thick black border */}
          <rect x={0} y={0} width={w} height={h}
            fill="white"
            stroke={selected ? selColor : '#1a1a1a'}
            strokeWidth={selected ? 2.5 : 2}
          />
          {/* Tinted color wash inside to hint at room type */}
          <rect x={1} y={1} width={w - 2} height={h - 2}
            fill={item.color} fillOpacity={0.08}
            style={{ pointerEvents: 'none' }}
          />
          {w > scale * 2 && h > scale * 1.5 && (
            <>
              <text x={cx} y={cy - 7}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(8, Math.min(13, scale * 0.55))}
                fill="#1a1a1a" fontWeight="700"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {item.label}
              </text>
              <text x={cx} y={cy + 9}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(6, Math.min(9, scale * 0.4))}
                fill="#4b5563"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {item.width}&apos; × {item.height}&apos;
              </text>
            </>
          )}
        </>
      ) : isSlidingDoor ? (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill="white" stroke={selected ? selColor : '#1d4ed8'} strokeWidth={selected ? 2 : 1.5} />
          <rect x={0} y={0} width={w * 0.45} height={h}
            fill="#dbeafe" stroke="#1d4ed8" strokeWidth={1} />
          <rect x={w * 0.55} y={0} width={w * 0.45} height={h}
            fill="#dbeafe" stroke="#1d4ed8" strokeWidth={1} />
          <line x1={w * 0.1} y1={cy} x2={w * 0.44} y2={cy} stroke="#1d4ed8" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
          <polygon points={`${w*0.1},${cy-2.5} ${w*0.1},${cy+2.5} ${w*0.02},${cy}`} fill="#1d4ed8" style={{ pointerEvents: 'none' }} />
          <line x1={w * 0.9} y1={cy} x2={w * 0.56} y2={cy} stroke="#1d4ed8" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
          <polygon points={`${w*0.9},${cy-2.5} ${w*0.9},${cy+2.5} ${w*0.98},${cy}`} fill="#1d4ed8" style={{ pointerEvents: 'none' }} />
          {h > scale * 0.5 && (
            <text x={cx} y={cy + Math.max(7, h * 0.35)} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(5, Math.min(8, scale * 0.3))} fill="#1e3a8a" fontWeight="700"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : isDoor ? (
        /* Architectural door symbol: thin rectangle leaf + quarter-arc sweep */
        <>
          {/* Door opening (white/clear) */}
          <rect x={0} y={0} width={w} height={h} fill="white" stroke={selected ? selColor : '#1a1a1a'} strokeWidth={selected ? 2 : 1.5} />
          {/* Door leaf (thin line along one edge) */}
          <line x1={0} y1={0} x2={w} y2={0} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={selected ? 2 : 1.5} style={{ pointerEvents: 'none' }} />
          {/* Quarter-circle arc swing */}
          <path d={`M ${w} 0 A ${w} ${w} 0 0 0 0 ${w}`}
            fill="#eff6ff" fillOpacity={0.7}
            stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1} strokeDasharray="3,2"
            style={{ pointerEvents: 'none' }}
          />
          {scale >= 14 && (
            <text x={cx} y={cy + h * 0.3} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(6, Math.min(9, scale * 0.38))} fill="#1e293b" fontWeight="600"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : isWindow ? (
        /* Architectural window: 3 parallel lines in opening */
        <>
          <rect x={0} y={0} width={w} height={h} fill="white" stroke={selected ? selColor : '#1a1a1a'} strokeWidth={selected ? 2 : 1.5} />
          {/* Three horizontal lines through centre (standard window symbol) */}
          {w >= h ? (
            <>
              <line x1={0} y1={h * 0.25} x2={w} y2={h * 0.25} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1} style={{ pointerEvents: 'none' }} />
              <line x1={0} y1={h * 0.5}  x2={w} y2={h * 0.5}  stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
              <line x1={0} y1={h * 0.75} x2={w} y2={h * 0.75} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1} style={{ pointerEvents: 'none' }} />
            </>
          ) : (
            <>
              <line x1={w * 0.25} y1={0} x2={w * 0.25} y2={h} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1} style={{ pointerEvents: 'none' }} />
              <line x1={w * 0.5}  y1={0} x2={w * 0.5}  y2={h} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
              <line x1={w * 0.75} y1={0} x2={w * 0.75} y2={h} stroke={selected ? selColor : '#1a1a1a'} strokeWidth={1} style={{ pointerEvents: 'none' }} />
            </>
          )}
        </>
      ) : isPathway ? (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.85}
            stroke={selected ? selColor : '#374151'} strokeWidth={selected ? 2 : 1} />
          {w >= h ? (
            <line x1={0} y1={cy} x2={w} y2={cy}
              stroke="rgba(255,255,255,0.5)" strokeWidth={Math.max(1, scale * 0.1)}
              strokeDasharray={`${scale * 0.5},${scale * 0.3}`} style={{ pointerEvents: 'none' }} />
          ) : (
            <line x1={cx} y1={0} x2={cx} y2={h}
              stroke="rgba(255,255,255,0.5)" strokeWidth={Math.max(1, scale * 0.1)}
              strokeDasharray={`${scale * 0.5},${scale * 0.3}`} style={{ pointerEvents: 'none' }} />
          )}
          {Math.min(w, h) > scale * 1.5 && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(6, Math.min(11, scale * 0.45))} fill="#1f2937" fontWeight="600"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : isColumn ? (
        /* Structural column: solid dark square with X */
        <>
          <rect x={0} y={0} width={w} height={h} fill="#1c1917" stroke={selected ? selColor : '#1c1917'} strokeWidth={selected ? 2 : 1} />
          <line x1={0} y1={0} x2={w} y2={h} stroke="rgba(255,255,255,0.3)" strokeWidth={1} style={{ pointerEvents: 'none' }} />
          <line x1={w} y1={0} x2={0} y2={h} stroke="rgba(255,255,255,0.3)" strokeWidth={1} style={{ pointerEvents: 'none' }} />
        </>
      ) : isBeam ? (
        /* Structural beam/wall: dark with hatching */
        <>
          <rect x={0} y={0} width={w} height={h} fill="#44403c" stroke={selected ? selColor : '#292524'} strokeWidth={selected ? 2 : 1} />
          {Array.from({ length: Math.ceil((w + h) / (scale * 0.6)) }).map((_, i) => {
            const s = scale * 0.6;
            const o = i * s - h;
            return (
              <line key={i}
                x1={Math.max(0, o)} y1={Math.min(h, -o)}
                x2={Math.min(w, o + h)} y2={Math.max(0, h - (Math.min(w, o + h) - Math.max(0, o)))}
                stroke="rgba(255,255,255,0.2)" strokeWidth={0.6}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </>
      ) : isSlab ? (
        <>
          <rect x={0} y={0} width={w} height={h} fill={item.color} fillOpacity={0.4} stroke={selected ? selColor : '#78716c'} strokeWidth={selected ? 2 : 1} strokeDasharray={selected ? '0' : '6,3'} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(7, Math.min(12, scale * 0.5))} fill="#78716c" fontWeight="600"
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {item.label}
          </text>
        </>
      ) : isTree ? (
        /* Tree: circle */
        <>
          <circle cx={cx} cy={cy} r={Math.min(cx, cy) - 1}
            fill={item.color} fillOpacity={0.6} stroke={selected ? selColor : '#166534'} strokeWidth={selected ? 2 : 1.5} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, Math.min(14, Math.min(w, h) * 0.45))}
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {def?.icon}
          </text>
        </>
      ) : isElectrical ? (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.2}
            stroke={selected ? selColor : item.color} strokeWidth={selected ? 2 : 1.5} rx={Math.min(w, h) * 0.15} />
          <text x={cx} y={cy - (h > scale * 0.7 ? 6 : 0)} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, Math.min(14, Math.min(w, h) * 0.5))}
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {def?.icon}
          </text>
          {h > scale * 0.7 && (
            <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(5, Math.min(8, scale * 0.33))} fill="#78350f"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : isPlumbing ? (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.2}
            stroke={selected ? selColor : item.color} strokeWidth={selected ? 2 : 1.5} rx={Math.min(w, h) * 0.1} />
          <text x={cx} y={cy - (h > scale * 0.7 ? 6 : 0)} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, Math.min(14, Math.min(w, h) * 0.5))}
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {def?.icon}
          </text>
          {h > scale * 0.7 && (
            <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(5, Math.min(8, scale * 0.33))} fill="#155e75"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : isElevation ? (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.25}
            stroke={selected ? selColor : item.color} strokeWidth={selected ? 2 : 1.5} />
          {Math.min(w, h) > scale * 0.8 && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(6, Math.min(10, scale * 0.42))} fill="#4b5563" fontWeight="600"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
        </>
      ) : (
        <>
          <rect x={0} y={0} width={w} height={h}
            fill={item.color} fillOpacity={0.8}
            stroke={selected ? selColor : '#475569'}
            strokeWidth={selected ? 2 : 1}
            rx={2}
          />
          <text x={cx} y={cy - (h > scale * 0.6 ? 6 : 0)} textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, scale * 0.5)} style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {def?.icon || '📦'}
          </text>
          {h > scale * 0.6 && (
            <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(5, Math.min(9, scale * 0.38))} fill="#1e293b"
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {item.label}
            </text>
          )}
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
          {/* Delete button */}
          <g
            transform={`translate(${w - 10}, -10)`}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={0} cy={0} r={10} fill="#ef4444" stroke="white" strokeWidth={1.5} />
            <text x={0} y={1} textAnchor="middle" dominantBaseline="middle"
              fontSize={13} fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
              ✕
            </text>
          </g>
        </>
      )}
    </g>
  );
}

export default function PlannerCanvas() {
  const store = usePlannerStore();
  const { plot, items, selectedId, scale, panX, panY, showGrid, snapToGrid, gridSize, drawingType } = store;
  const svgRef = useRef<SVGSVGElement>(null);

  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const plotW = plot.width * scale;
  const plotH = plot.height * scale;
  const RULER = 52;
  const dtMeta = DRAWING_TYPE_META[drawingType];

  // ── Zoom toward cursor ──────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const oldScale = store.scale;
    const delta = e.deltaY > 0 ? -2 : 2;
    const newScale = Math.max(8, Math.min(60, oldScale + delta));
    if (newScale === oldScale) return;
    const worldX = (mx - store.panX - RULER) / oldScale;
    const worldY = (my - store.panY - RULER) / oldScale;
    store.setView(newScale, mx - worldX * newScale - RULER, my - worldY * newScale - RULER);
  }, [store]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Center on first render
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    canvasElRef.current = el;
    const { width: w, height: h } = el.getBoundingClientRect();
    if (w === 0 || h === 0) return;
    const padding = 40;
    const fit = Math.min(
      Math.floor((w - RULER * 2 - padding * 2) / store.plot.width),
      Math.floor((h - RULER * 2 - padding * 2) / store.plot.height),
      60,
    );
    const s = Math.max(8, fit);
    store.setView(s,
      (w - store.plot.width * s) / 2 - RULER,
      (h - store.plot.height * s) / 2 - RULER,
    );
    return () => { canvasElRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo(); else store.undo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !inInput) {
        store.removeItem(selectedId);
      }
      if (e.key.startsWith('Arrow') && selectedId && !inInput) {
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : store.gridSize;
        const item = store.items.find((it) => it.id === selectedId);
        if (!item) return;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
        store.updateItem(selectedId, {
          x: Math.max(0, Math.min(store.plot.width  - item.width,  item.x + dx)),
          y: Math.max(0, Math.min(store.plot.height - item.height, item.y + dy)),
        });
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
      let newX = snap(dragging.origX + dx, gridSize, snapToGrid);
      let newY = snap(dragging.origY + dy, gridSize, snapToGrid);
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
    if (dragging) { store.pushHistory(); setDragging(null); }
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

  // ── Axis helpers ─────────────────────────────────────────────────────────
  function dispX(svgFt: number) {
    switch (plot.origin) {
      case 'A': case 'D': return svgFt;
      case 'B': case 'C': return plot.width - svgFt;
    }
  }
  function dispY(svgFt: number) {
    switch (plot.origin) {
      case 'A': case 'B': return svgFt;
      case 'C': case 'D': return plot.height - svgFt;
    }
  }

  function tickStep(total: number) {
    if (total <= 20)  return 1;
    if (total <= 50)  return 5;
    if (total <= 100) return 10;
    return 20;
  }

  function makeTicks(total: number, step: number): number[] {
    const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => i * step).filter(v => v <= total + 0.001);
    if (Math.abs(ticks[ticks.length - 1] - total) > 0.01) ticks.push(total);
    return ticks;
  }

  const xStep = tickStep(plot.width);
  const yStep = tickStep(plot.height);
  const xTicks = makeTicks(plot.width, xStep);
  const yTicks = makeTicks(plot.height, yStep);

  // Scale bar length in feet
  const scaleBarFt = xStep * 2;
  const scaleBarPx = scaleBarFt * scale;

  return (
    <div className="w-full h-full overflow-hidden relative select-none" style={{ background: '#1e2433', cursor: isPanning ? 'grabbing' : 'default' }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerDown={onSvgPointerDown}
      >
        {/* Drop shadow */}
        <g transform={`translate(${panX + RULER}, ${panY + RULER})`}>
          <rect x={5} y={5} width={plotW} height={plotH} fill="rgba(0,0,0,0.45)" style={{ pointerEvents: 'none' }} />

          {/* ── Plot background: warm paper/drafting look ── */}
          <rect x={0} y={0} width={plotW} height={plotH} fill="#fafaf7" data-bg="true" />

          {/* ── Grid ── */}
          {showGrid && (
            <g style={{ pointerEvents: 'none' }}>
              {Array.from({ length: plot.width + 1 }, (_, i) => i).map((x) => (
                <line key={`gv${x}`} x1={x * scale} y1={0} x2={x * scale} y2={plotH}
                  stroke={x % 5 === 0 ? '#c8c4b0' : '#e5e3d8'} strokeWidth={x % 5 === 0 ? 0.6 : 0.3} />
              ))}
              {Array.from({ length: plot.height + 1 }, (_, i) => i).map((y) => (
                <line key={`gh${y}`} x1={0} y1={y * scale} x2={plotW} y2={y * scale}
                  stroke={y % 5 === 0 ? '#c8c4b0' : '#e5e3d8'} strokeWidth={y % 5 === 0 ? 0.6 : 0.3} />
              ))}
            </g>
          )}

          {/* ── Plot border ── */}
          <rect x={0} y={0} width={plotW} height={plotH}
            fill="none" stroke="#1a1a1a" strokeWidth={3} style={{ pointerEvents: 'none' }} />

          {/* ── X-axis ── */}
          <g style={{ pointerEvents: 'none' }}>
            <text x={plotW / 2} y={plotH + RULER - 6} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600" letterSpacing="0.05em">
              X  ({plot.width} ft) →
            </text>
            {xTicks.map((svgFt) => {
              const px = svgFt * scale;
              const labelVal = dispX(svgFt);
              const isBoundary = Math.abs(svgFt - plot.width) < 0.01;
              const isStep = Math.abs(svgFt % xStep) < 0.01;
              const showLabel = isStep || isBoundary;
              const isOriginTick = Math.abs(labelVal) < 0.01;
              return (
                <g key={`xt${svgFt}`}>
                  <line x1={px} y1={plotH} x2={px} y2={plotH + (showLabel ? 8 : 4)}
                    stroke={showLabel ? '#475569' : '#94a3b8'} strokeWidth={showLabel ? 1.2 : 0.7} />
                  {showLabel && (
                    <text x={px} y={plotH + 18} textAnchor="middle" fontSize={9}
                      fontWeight={isOriginTick ? '700' : '400'}
                      fill={isOriginTick ? '#3b82f6' : '#64748b'}>
                      {parseFloat(labelVal.toFixed(1))}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Y-axis ── */}
          <g style={{ pointerEvents: 'none' }}>
            <text x={-44} y={plotH / 2} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600" letterSpacing="0.05em"
              transform={`rotate(-90, -44, ${plotH / 2})`}>
              Y  ({plot.height} ft) →
            </text>
            {yTicks.map((svgFt) => {
              const py = svgFt * scale;
              const labelVal = dispY(svgFt);
              const isBoundary = Math.abs(svgFt - plot.height) < 0.01;
              const isStep = Math.abs(svgFt % yStep) < 0.01;
              const showLabel = isStep || isBoundary;
              const isOriginTick = Math.abs(labelVal) < 0.01;
              return (
                <g key={`yt${svgFt}`}>
                  <line x1={0} y1={py} x2={-(showLabel ? 8 : 4)} y2={py}
                    stroke={showLabel ? '#475569' : '#94a3b8'} strokeWidth={showLabel ? 1.2 : 0.7} />
                  {showLabel && (
                    <text x={-14} y={py + 4} textAnchor="end" fontSize={9}
                      fontWeight={isOriginTick ? '700' : '400'}
                      fill={isOriginTick ? '#3b82f6' : '#64748b'}>
                      {parseFloat(labelVal.toFixed(1))}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Corner badges ── */}
          {SIDE_LABELS.map((label, i) => {
            const corners = [
              { cx: -14, cy: -14 },
              { cx: plotW + 14, cy: -14 },
              { cx: plotW + 14, cy: plotH + 14 },
              { cx: -14, cy: plotH + 14 },
            ];
            const isOrigin = label === plot.origin;
            const { cx, cy } = corners[i];
            return (
              <g key={label} style={{ pointerEvents: 'none' }}>
                <circle cx={cx} cy={cy} r={11} fill={isOrigin ? '#1d4ed8' : '#1e293b'}
                  stroke={isOrigin ? '#93c5fd' : '#334155'} strokeWidth={1.5} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontWeight="bold" fill="white">{label}</text>
                {isOrigin && (
                  <text x={cx} y={cy - 18} textAnchor="middle" fontSize={8} fill="#60a5fa" fontWeight="700">(0,0)</text>
                )}
              </g>
            );
          })}

          {/* ── Items ── */}
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
                onDelete={() => store.removeItem(item.id)}
                drawingType={drawingType}
              />
            ))}

          {/* ── Title block (bottom-right) ── */}
          <g transform={`translate(${plotW - 1}, ${plotH + 1})`} style={{ pointerEvents: 'none' }}>
            <rect x={0} y={0} width={180} height={40} fill="white" stroke="#1a1a1a" strokeWidth={1} />
            <line x1={0} y1={14} x2={180} y2={14} stroke="#1a1a1a" strokeWidth={0.5} />
            <line x1={90} y1={14} x2={90} y2={40} stroke="#1a1a1a" strokeWidth={0.5} />
            <text x={90} y={9} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#1a1a1a" fontWeight="700">
              {store.planName || 'Untitled Plan'}
            </text>
            <text x={45} y={26} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#374151">
              {dtMeta.icon} {dtMeta.label}
            </text>
            <text x={45} y={34} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#6b7280">
              Scale 1ft={scale}px
            </text>
            <text x={135} y={26} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#374151">
              Plot: {plot.width}×{plot.height} ft
            </text>
            <text x={135} y={34} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#6b7280">
              Origin: {plot.origin}
            </text>
          </g>

          {/* ── Scale bar (bottom-left) ── */}
          <g transform={`translate(0, ${plotH + 8})`} style={{ pointerEvents: 'none' }}>
            <rect x={0} y={0} width={scaleBarPx / 2} height={6} fill="#374151" />
            <rect x={scaleBarPx / 2} y={0} width={scaleBarPx / 2} height={6} fill="white" stroke="#374151" strokeWidth={0.8} />
            <text x={0} y={14} textAnchor="start" fontSize={7} fill="#64748b">0</text>
            <text x={scaleBarPx / 2} y={14} textAnchor="middle" fontSize={7} fill="#64748b">{scaleBarFt / 2}</text>
            <text x={scaleBarPx} y={14} textAnchor="end" fontSize={7} fill="#64748b">{scaleBarFt} ft</text>
          </g>

          {/* ── Compass ── */}
          <g transform={`translate(${plotW - 20}, -32)`} style={{ pointerEvents: 'none' }}>
            <circle cx={0} cy={0} r={14} fill="rgba(15,23,42,0.85)" stroke="#334155" strokeWidth={1} />
            <polygon points="0,-10 -4,2 0,-1 4,2" fill="#ef4444" />
            <polygon points="0,10 -4,-2 0,1 4,-2" fill="#475569" />
            <text x={0} y={-13} textAnchor="middle" fontSize={7} fill="#ef4444" fontWeight="bold">N</text>
          </g>
        </g>
      </svg>

      {/* Status bar */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs text-slate-400 max-w-[70%] flex-wrap">
        <span>1ft = {scale}px</span>
        <span className="text-slate-600">|</span>
        <span>{plot.width}×{plot.height} ft</span>
        <span className="text-slate-600">|</span>
        <span>Origin: <span className="text-blue-400 font-semibold">{plot.origin}</span></span>
        {(() => {
          const sel = items.find((it) => it.id === selectedId);
          if (!sel) return null;
          const d = svgToDisplay(sel.x, sel.y, sel.width, sel.height, plot);
          return (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                {sel.label} &nbsp;
                <span className="font-mono text-emerald-400">
                  ({d.x.toFixed(1)}, {d.y.toFixed(1)})
                </span>
                &nbsp;{sel.width}×{sel.height}ft
              </span>
            </>
          );
        })()}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => {
            const el = svgRef.current;
            const rect = el?.getBoundingClientRect();
            if (!rect) { store.setScale(scale + 2); return; }
            const mx = rect.width / 2, my = rect.height / 2;
            const ns = Math.max(8, Math.min(60, scale + 2));
            const wx = (mx - panX - RULER) / scale, wy = (my - panY - RULER) / scale;
            store.setView(ns, mx - wx * ns - RULER, my - wy * ns - RULER);
          }}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-lg flex items-center justify-center transition">+</button>
        <button
          onClick={() => {
            const el = svgRef.current;
            const rect = el?.getBoundingClientRect();
            const w = rect?.width ?? 600, h = rect?.height ?? 400;
            const padding = 40;
            const fit = Math.min(
              Math.floor((w - RULER * 2 - padding * 2) / plot.width),
              Math.floor((h - RULER * 2 - padding * 2) / plot.height), 60);
            const s = Math.max(8, fit);
            store.setView(s, (w - plot.width * s) / 2 - RULER, (h - plot.height * s) / 2 - RULER);
          }}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-xs flex items-center justify-center transition">⌂</button>
        <button
          onClick={() => {
            const el = svgRef.current;
            const rect = el?.getBoundingClientRect();
            if (!rect) { store.setScale(scale - 2); return; }
            const mx = rect.width / 2, my = rect.height / 2;
            const ns = Math.max(8, Math.min(60, scale - 2));
            const wx = (mx - panX - RULER) / scale, wy = (my - panY - RULER) / scale;
            store.setView(ns, mx - wx * ns - RULER, my - wy * ns - RULER);
          }}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-lg flex items-center justify-center transition">−</button>
      </div>
    </div>
  );
}
