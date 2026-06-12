'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { usePlannerStore } from '@/store/planner';
import Toolbar from '@/components/planner/Toolbar';
import ItemPanel from '@/components/planner/ItemPanel';
import PropertiesPanel from '@/components/planner/PropertiesPanel';
import PlotSetup from '@/components/planner/PlotSetup';
import ExportModal from '@/components/planner/ExportModal';
import { v4 as uuidv4 } from 'uuid';

// Canvas must be client-only (uses SVG pointer events)
const PlannerCanvas = dynamic(() => import('@/components/planner/PlannerCanvas'), { ssr: false });

export default function PlannerPage() {
  const params = useParams();
  const router = useRouter();
  const store = usePlannerStore();
  const id = params?.id as string;
  const isNew = id === 'new';

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

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
    });
  }, [router]);

  // Load plan
  useEffect(() => {
    if (isNew) {
      store.loadPlan({
        id: uuidv4(),
        userId: '',
        name: 'New House Plan',
        description: '',
        plot: { width: 40, height: 30, origin: 'A' },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
      setShowSetup(true);
      return;
    }
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.plan) store.loadPlan(d.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      };
      const res = await fetch(
        isNew || !store.planId ? '/api/plans' : `/api/plans/${store.planId}`,
        {
          method: isNew || !store.planId ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
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

  // Panel resize
  function startResizeLeft(e: React.MouseEvent) {
    isDraggingLeft.current = true;
    e.preventDefault();
  }
  function startResizeRight(e: React.MouseEvent) {
    isDraggingRight.current = true;
    e.preventDefault();
  }
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
          <span className="text-slate-400 text-sm">Loading plan…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        onSetup={() => setShowSetup(true)}
        onExport={() => setShowExport(true)}
        isSaving={isSaving}
        onSave={handleSave}
        user={user}
      />

      {/* Save message toast */}
      {saveMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {saveMsg}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — Items */}
        <div style={{ width: leftWidth, flexShrink: 0 }} className="min-h-0 flex flex-col">
          <ItemPanel />
        </div>

        {/* Left resize handle */}
        <div
          className="w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={startResizeLeft}
        />

        {/* Canvas */}
        <div className="flex-1 min-w-0 min-h-0">
          <PlannerCanvas />
        </div>

        {/* Right resize handle */}
        <div
          className="w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={startResizeRight}
        />

        {/* Right panel — Properties */}
        <div style={{ width: rightWidth, flexShrink: 0 }} className="min-h-0 flex flex-col">
          <PropertiesPanel />
        </div>
      </div>

      {/* Modals */}
      {showSetup && <PlotSetup onClose={() => setShowSetup(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}
