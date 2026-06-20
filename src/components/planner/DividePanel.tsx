'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePlannerStore } from '@/store/planner';
import { PlacedItem } from '@/types';

// Item types that can be divided
const DIVISIBLE = [
  'room', 'master-bedroom', 'bedroom', 'kids-room', 'guest-room',
  'living-room', 'drawing-room', 'study', 'prayer-room', 'store-room',
  'washroom', 'bathroom', 'toilet', 'kitchen', 'garage', 'balcony',
  'garden', 'patio', 'car-parking', 'landing',
  'pathway', 'road', 'driveway', 'footpath', 'lane', 'garden-path',
  'wall', 'boundary-wall',
];

function parseSegments(raw: string): number[] | null {
  const parts = raw.split(',').map((s) => parseFloat(s.trim()));
  if (parts.some((n) => isNaN(n) || n <= 0)) return null;
  return parts;
}

interface Props {
  item: PlacedItem;
}

export default function DividePanel({ item }: Props) {
  const store = usePlannerStore();
  const [open, setOpen] = useState(false);
  const [axis, setAxis] = useState<'horizontal' | 'vertical'>('vertical');
  const [mode, setMode] = useState<'equal' | 'custom'>('equal');
  const [parts, setParts] = useState('2');
  const [customDims, setCustomDims] = useState('');
  const [error, setError] = useState('');

  if (!DIVISIBLE.includes(item.type)) return null;

  // Along which axis are we cutting?
  // vertical  → slices stacked top-to-bottom (divide the HEIGHT)
  // horizontal → slices side-by-side   (divide the WIDTH)
  const totalDim = axis === 'vertical' ? item.height : item.width;

  function validate(): number[] | null {
    setError('');
    if (mode === 'equal') {
      const n = parseInt(parts, 10);
      if (isNaN(n) || n < 2 || n > 20) {
        setError('Enter a number between 2 and 20');
        return null;
      }
      const size = parseFloat((totalDim / n).toFixed(4));
      return Array(n).fill(size);
    } else {
      const segs = parseSegments(customDims);
      if (!segs) { setError('Enter valid comma-separated sizes (e.g. 8, 10, 8)'); return null; }
      const sum = segs.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - totalDim) > 0.05) {
        setError(`Sizes must add up to ${totalDim} ft (got ${sum.toFixed(2)} ft)`);
        return null;
      }
      return segs;
    }
  }

  function handleDivide() {
    const segments = validate();
    if (!segments) return;

    store.pushHistory();

    const newItems: PlacedItem[] = [];
    let offset = 0;

    segments.forEach((seg, i) => {
      const suffix = segments.length <= 26 ? String.fromCharCode(65 + i) : String(i + 1);
      const child: PlacedItem = {
        ...item,
        id: uuidv4(),
        label: `${item.label} ${suffix}`,
        x: axis === 'horizontal' ? item.x + offset : item.x,
        y: axis === 'vertical'   ? item.y + offset : item.y,
        width:  axis === 'horizontal' ? seg : item.width,
        height: axis === 'vertical'   ? seg : item.height,
      };
      newItems.push(child);
      offset += seg;
    });

    // Remove original, add children
    store.removeItem(item.id);
    newItems.forEach((it) => store.addItem(it));
    store.setSelectedId(newItems[0].id);
    setOpen(false);
  }

  // Live preview segments for custom mode
  const preview: number[] | null = mode === 'equal'
    ? (() => { const n = parseInt(parts, 10); return (!isNaN(n) && n >= 2) ? Array(n).fill(parseFloat((totalDim / n).toFixed(2))) : null; })()
    : parseSegments(customDims);

  const previewValid = preview && (
    mode === 'equal' || Math.abs(preview.reduce((a, b) => a + b, 0) - totalDim) <= 0.05
  );

  return (
    <div className="border border-slate-600 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-700/40 hover:bg-slate-700/60 transition text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium text-slate-200">Divide into Parts</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-slate-800/40">

          {/* Axis */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Cut direction</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { value: 'vertical',   label: 'Top → Bottom', icon: '⬛\n⬛' },
                { value: 'horizontal', label: 'Left → Right', icon: '▬▬' },
              ] as const).map((opt) => (
                <button key={opt.value} onClick={() => setAxis(opt.value)}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition ${
                    axis === opt.value
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}>
                  {opt.label}
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    divides {axis === opt.value ? (opt.value === 'vertical' ? 'height' : 'width') : (opt.value === 'vertical' ? 'height' : 'width')} ({totalDim} ft)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Split mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { value: 'equal', label: 'Equal parts' },
                { value: 'custom', label: 'Custom sizes' },
              ] as const).map((opt) => (
                <button key={opt.value} onClick={() => { setMode(opt.value); setError(''); }}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition ${
                    mode === opt.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          {mode === 'equal' ? (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Number of equal parts</label>
              <input
                type="number" min={2} max={20} value={parts}
                onChange={(e) => { setParts(e.target.value); setError(''); }}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2"
              />
              {preview && (
                <div className="mt-1 text-xs text-slate-500">
                  Each part: <span className="text-slate-300 font-semibold">{preview[0]} ft</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Part sizes (ft), comma-separated — must sum to {totalDim} ft
              </label>
              <input
                type="text" value={customDims}
                onChange={(e) => { setCustomDims(e.target.value); setError(''); }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder={`e.g. ${(totalDim / 3).toFixed(1)}, ${(totalDim / 3).toFixed(1)}, ${(totalDim / 3).toFixed(1)}`}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
              {error}
            </div>
          )}

          {/* Visual preview bar */}
          {preview && preview.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Preview</label>
              <div className={`flex ${axis === 'vertical' ? 'flex-col' : 'flex-row'} gap-0.5 h-16 rounded-lg overflow-hidden border ${previewValid ? 'border-slate-600' : 'border-red-500/40'}`}>
                {preview.map((seg, i) => {
                  const pct = (seg / totalDim) * 100;
                  const suffix = preview.length <= 26 ? String.fromCharCode(65 + i) : String(i + 1);
                  const bgColors = ['#dbeafe','#ede9fe','#fce7f3','#dcfce7','#fef9c3','#fde68a','#bfdbfe','#c4b5fd'];
                  return (
                    <div key={i}
                      style={{
                        [axis === 'vertical' ? 'height' : 'width']: `${pct}%`,
                        backgroundColor: bgColors[i % bgColors.length],
                        [axis === 'vertical' ? 'width' : 'height']: '100%',
                        flexShrink: 0,
                      }}
                      className="flex items-center justify-center min-h-0 min-w-0"
                    >
                      <span className="text-[9px] font-semibold text-slate-700 truncate px-1">
                        {suffix}: {seg} ft
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply */}
          <button
            onClick={handleDivide}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-600/20"
          >
            Split into {mode === 'equal' ? (parseInt(parts, 10) || '?') : (preview?.length ?? '?')} Parts
          </button>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            The original item will be replaced by the new parts. Each part inherits the same type, color, and z-layer.
          </p>
        </div>
      )}
    </div>
  );
}
