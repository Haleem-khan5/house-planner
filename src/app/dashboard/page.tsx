'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plan, DrawingType } from '@/types';
import { DRAWING_TYPE_META } from '@/lib/drawingTypes';

const TYPE_ORDER: DrawingType[] = [
  'architectural', 'structural', 'electrical', 'plumbing', 'foundation', 'site-plan', 'elevation',
];

function PlanThumbnail({ plan }: { plan: Plan }) {
  const meta = DRAWING_TYPE_META[plan.drawingType ?? 'architectural'];
  return (
    <div className="relative h-40 overflow-hidden" style={{ background: '#f8fafc' }}>
      <svg viewBox={`0 0 ${plan.plot.width * 5} ${plan.plot.height * 5}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect x={0} y={0} width={plan.plot.width * 5} height={plan.plot.height * 5} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />
        {plan.items
          .filter(it => ['room','master-bedroom','bedroom','kitchen','washroom','bathroom','living-room','guest-room','kids-room','drawing-room','study'].includes(it.type))
          .map(it => (
            <rect key={it.id} x={it.x * 5} y={it.y * 5} width={it.width * 5} height={it.height * 5}
              fill={it.color} fillOpacity={0.55} stroke="#94a3b8" strokeWidth={0.5} />
          ))}
        {plan.items
          .filter(it => it.type.startsWith('wall') || it.type.startsWith('exterior-wall'))
          .map(it => (
            <rect key={it.id} x={it.x * 5} y={it.y * 5} width={it.width * 5} height={it.height * 5} fill="#1e293b" />
          ))}
      </svg>
      {/* Type pill */}
      <div className="absolute top-2.5 left-2.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm"
          style={{ background: meta.color + '28', color: meta.color, border: `1px solid ${meta.color}50` }}>
          {meta.icon} {meta.label.split(' ')[0]}
        </span>
      </div>
      <div className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur rounded px-1.5 py-0.5 text-xs text-slate-500 font-medium">
        {plan.plot.width}×{plan.plot.height} ft
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawingType | 'all'>('all');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
      fetch('/api/plans').then(r => r.json()).then(pd => {
        setPlans(pd.plans || []);
        setLoading(false);
      });
    });
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this drawing?')) return;
    setDeleting(id);
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    setPlans(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const typeCounts = plans.reduce<Record<string, number>>((acc, p) => {
    const t = p.drawingType ?? 'architectural';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const filteredPlans = activeTab === 'all' ? plans : plans.filter(p => (p.drawingType ?? 'architectural') === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
            </svg>
          </div>
          <span className="font-bold text-white">HousePlanner</span>
          <span className="hidden sm:block text-xs text-slate-500 border-l border-slate-700 pl-3">Professional Drawing Suite</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden sm:block text-sm text-slate-400">{user.email}</span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                {user.name[0]?.toUpperCase()}
              </div>
            </>
          )}
          <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-slate-300 transition px-2 py-1.5 rounded-lg hover:bg-slate-800">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">

        {/* ── Welcome banner ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {plans.length === 0 ? 'Welcome to HousePlanner' : `Welcome back, ${user?.name?.split(' ')[0]}`}
            </h1>
            <p className="text-slate-400 mt-1">
              {plans.length === 0
                ? 'Create professional architectural drawings for your house project.'
                : `${plans.length} drawing${plans.length !== 1 ? 's' : ''} · Pick a type below to start a new one`}
            </p>
          </div>
          {plans.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="text-2xl font-bold text-white">{plans.length}</span> drawings &nbsp;
              <span className="text-2xl font-bold text-white">{Object.keys(typeCounts).length}</span> types
            </div>
          )}
        </div>

        {/* ── Create New Drawing — always visible ─────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Create New Drawing</h2>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">click any type to start</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TYPE_ORDER.map(type => {
              const meta = DRAWING_TYPE_META[type];
              const count = typeCounts[type] || 0;
              return (
                <button
                  key={type}
                  onClick={() => router.push(`/planner/new?type=${type}`)}
                  className="group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${meta.color}0a 0%, transparent 100%)`,
                    borderColor: meta.color + '30',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = meta.color + '80')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = meta.color + '30')}
                >
                  {/* Count badge */}
                  {count > 0 && (
                    <span className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: meta.color + '22', color: meta.color }}>
                      {count}
                    </span>
                  )}
                  <span className="text-3xl">{meta.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{meta.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{meta.desc}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium mt-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: meta.color }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New {meta.label.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── My Drawings ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">My Drawings</h2>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">{plans.length} total</span>
          </div>

          {/* Type filter tabs */}
          {plans.length > 0 && (
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
              {(['all', ...TYPE_ORDER.filter(t => typeCounts[t])] as (DrawingType | 'all')[]).map(tab => {
                const active = activeTab === tab;
                const meta = tab !== 'all' ? DRAWING_TYPE_META[tab] : null;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap"
                    style={active && meta ? { background: meta.color + '22', color: meta.color } : active ? { background: '#334155', color: 'white' } : {}}>
                    <span className={active ? '' : 'text-slate-400 hover:text-slate-200'}>
                      {tab === 'all' ? 'All' : meta!.icon + ' ' + meta!.label.split(' ')[0]}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={active && meta ? { background: meta.color + '33', color: meta.color } : { background: '#1e293b', color: '#64748b' }}>
                      {tab === 'all' ? plans.length : typeCounts[tab as DrawingType] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-2xl text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-slate-400 font-medium">No drawings yet</p>
              <p className="text-slate-600 text-sm mt-1">Click any drawing type above to create your first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlans.map(plan => {
                const meta = DRAWING_TYPE_META[plan.drawingType ?? 'architectural'];
                return (
                  <div key={plan.id}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5">
                    <PlanThumbnail plan={plan} />
                    <div className="p-3.5">
                      <h3 className="font-semibold text-slate-100 truncate text-sm mb-1">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{plan.items.length} items · {formatDate(plan.updatedAt)}</p>
                      <div className="flex gap-2">
                        <Link href={`/planner/${plan.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          style={{ background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}35` }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          Open
                        </Link>
                        <button onClick={() => handleDelete(plan.id)} disabled={deleting === plan.id}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-700/40 text-slate-500 hover:text-red-400 rounded-lg transition disabled:opacity-40">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">How it works</h2>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Set your plot', desc: 'Define your plot dimensions in feet. Choose your origin corner for accurate measurements.', icon: '📐' },
              { step: '02', title: 'Switch drawing types', desc: 'Use the tab strip inside the planner to switch between all 7 document types anytime.', icon: '🔄' },
              { step: '03', title: 'Add & arrange items', desc: 'Drag items onto the canvas. Nudge with arrow keys. Delete with ✕. Save when done.', icon: '🛋️' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-xs text-slate-600 font-bold mb-0.5">STEP {item.step}</div>
                  <div className="text-sm font-semibold text-slate-200 mb-1">{item.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
