'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { usePlannerStore } from '@/store/planner';
import Toolbar from '@/components/planner/Toolbar';
import ItemPanel from '@/components/planner/ItemPanel';
import PropertiesPanel from '@/components/planner/PropertiesPanel';
import PlotSetup from '@/components/planner/PlotSetup';
import ExportModal from '@/components/planner/ExportModal';
import { v4 as uuidv4 } from 'uuid';
import { DrawingType } from '@/types';
import { DRAWING_TYPE_META } from '@/lib/drawingTypes';

const PlannerCanvas = dynamic(() => import('@/components/planner/PlannerCanvas'), { ssr: false });

const TYPE_ORDER: DrawingType[] = [
  'architectural', 'structural', 'electrical', 'plumbing', 'foundation', 'site-plan', 'elevation',
];

function DrawingTypeStrip() {
  const store = usePlannerStore();
  const active = store.drawingType;
  return (
    <div className="flex items-stretch border-b border-slate-700/70 bg-slate-900 flex-shrink-0 overflow-x-auto" style={{ minHeight: 34 }}>
      {TYPE_ORDER.map(type => {
        const meta = DRAWING_TYPE_META[type];
        const isActive = active === type;
        return (
          <button
            key={type}
            onClick={() => store.setDrawingType(type)}
            className="relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={isActive
              ? { color: meta.color, background: meta.color + '18', borderBottom: `2px solid ${meta.color}` }
              : { color: '#64748b', borderBottom: '2px solid transparent' }}
            title={meta.label}
          >
            <span>{meta.icon}</span>
            <span className="hidden sm:inline">{meta.label.replace(' Plan', '').replace(' Drawing', '')}</span>
          </button>
        );
      })}
      <div className="flex-1" />
      <div className="flex items-center px-3 text-xs text-slate-600 border-l border-slate-700/50 whitespace-nowrap">
        {DRAWING_TYPE_META[active].label}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = usePlannerStore();
  const id = params?.id as string;
  const isNew = id === 'new';
  const newDrawingType = (searchParams?.get('type') ?? 'architectural') as DrawingType;

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(240);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
    });
  }, [router]);

  useEffect(() => {
    if (isNew) {
      const meta = DRAWING_TYPE_META[newDrawingType];
      store.loadPlan({
        id: uuidv4(),
        userId: '',
        name: `New ${meta.label}`,
        description: '',
        plot: { width: 40, height: 30, origin: 'A' },
        items: [],
        drawingType: newDrawingType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
      setShowSetup(true);
      return;
    }
    fetch(`/api/plans/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.plan) store.loadPlan(d.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const body = {
        id: store.planId,
        name: store.planName,
        description: store.planDescription,
        plot: store.plot,
        items: store.items,
        drawingType: store.drawingType,
      };
      const res = await fetch(
        isNew || !store.planId ? '/api/plans' : `/api/plans/${store.planId}`,
        { method: isNew || !store.planId ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (data.plan) {
        store.setPlanMeta(data.plan.id, data.plan.name, data.plan.description);
        if (isNew) router.replace(`/planner/${data.plan.id}`);
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function startResizeLeft(e: React.MouseEvent) { isDraggingLeft.current = true; e.preventDefault(); }
  function startResizeRight(e: React.MouseEvent) { isDraggingRight.current = true; e.preventDefault(); }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (isDraggingLeft.current) setLeftWidth(Math.max(180, Math.min(340, e.clientX)));
      if (isDraggingRight.current) setRightWidth(Math.max(200, Math.min(380, window.innerWidth - e.clientX)));
    }
    function onUp() { isDraggingLeft.current = false; isDraggingRight.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">

      {/* Top toolbar */}
      <Toolbar onSetup={() => setShowSetup(true)} onExport={() => setShowExport(true)}
        isSaving={isSaving} onSave={handleSave} user={user} />

      {/* ── Drawing type strip — always visible ── */}
      <DrawingTypeStrip />

      {saveMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {saveMsg}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        <div style={{ width: leftWidth, flexShrink: 0 }} className="min-h-0 flex flex-col">
          <ItemPanel />
        </div>
        <div className="w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={startResizeLeft} />
        <div className="flex-1 min-w-0 min-h-0">
          <PlannerCanvas />
        </div>
        <div className="w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={startResizeRight} />
        <div style={{ width: rightWidth, flexShrink: 0 }} className="min-h-0 flex flex-col">
          <PropertiesPanel />
        </div>
      </div>

      {showSetup && <PlotSetup onClose={() => setShowSetup(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}
