'use client';

import { useRouter } from 'next/navigation';
import { usePlannerStore } from '@/store/planner';
import { Plan } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ToolbarProps {
  onSetup: () => void;
  onExport: () => void;
  isSaving: boolean;
  onSave: () => void;
  user: { name: string; email: string } | null;
}

export default function Toolbar({ onSetup, onExport, isSaving, onSave, user }: ToolbarProps) {
  const store = usePlannerStore();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-3 gap-2 flex-shrink-0">
      {/* Logo */}
      <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 mr-2 hover:opacity-80 transition">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
          </svg>
        </div>
        <span className="text-sm font-bold text-white hidden sm:block">HousePlanner</span>
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Plan name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200 truncate">{store.planName}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Plot Setup */}
        <button onClick={onSetup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Plot
        </button>

        {/* Grid toggle */}
        <button onClick={store.toggleGrid}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            store.showGrid ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-700/40 border-slate-600 text-slate-400'
          }`}
          title="Toggle grid">
          Grid
        </button>

        {/* Snap toggle */}
        <button onClick={store.toggleSnap}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            store.snapToGrid ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-700/40 border-slate-600 text-slate-400'
          }`}
          title="Snap to grid">
          Snap
        </button>

        {/* Undo / Redo */}
        <button onClick={store.undo}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600 text-slate-400 text-xs transition"
          title="Undo (Ctrl+Z)">
          ↩
        </button>
        <button onClick={store.redo}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600 text-slate-400 text-xs transition"
          title="Redo (Ctrl+Shift+Z)">
          ↪
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Export */}
        <button onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        {/* Save */}
        <button onClick={onSave} disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-lg shadow-blue-600/20">
          {isSaving ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {isSaving ? 'Saving…' : 'Save'}
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* User */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user.name[0]?.toUpperCase()}
            </div>
            <button onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-300 transition hidden sm:block">
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
