'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plan } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
      fetch('/api/plans').then((r) => r.json()).then((pd) => {
        setPlans(pd.plans || []);
        setLoading(false);
      });
    });
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this plan?')) return;
    setDeleting(id);
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Nav */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">HousePlanner</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-200">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
            {user?.name[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-200 transition px-3 py-1.5 rounded-lg hover:bg-slate-700">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Plans</h1>
            <p className="text-slate-400 mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''} · Design and manage your house layouts</p>
          </div>
          <Link href="/planner/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Plan
          </Link>
        </div>

        {plans.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5 shadow-xl">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">No plans yet</h2>
            <p className="text-slate-500 mb-6 max-w-sm">Start designing your house by creating your first plan. Add rooms, furniture, and more.</p>
            <Link href="/planner/new"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Plan
            </Link>
          </div>
        ) : (
          /* Plan grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id}
                className="group bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-900/50">
                {/* Preview SVG thumbnail */}
                <div className="h-36 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                  <svg viewBox={`-5 -5 ${plan.plot.width * 6 + 10} ${plan.plot.height * 6 + 10}`}
                    className="w-full h-full">
                    <rect x={0} y={0} width={plan.plot.width * 6} height={plan.plot.height * 6}
                      fill="#f8fafc" stroke="#1e293b" strokeWidth={2} rx={1} />
                    {plan.items.filter((it) => ['room','master-bedroom','bedroom','kitchen','washroom','bathroom','living-room'].includes(it.type))
                      .map((it) => (
                        <rect key={it.id} x={it.x * 6} y={it.y * 6}
                          width={it.width * 6} height={it.height * 6}
                          fill={it.color} fillOpacity={0.7} stroke="#334155" strokeWidth={0.5} rx={0.5} />
                      ))}
                  </svg>
                  <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur rounded-lg px-2 py-0.5 text-xs text-slate-400">
                    {plan.plot.width}×{plan.plot.height} ft
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-100 truncate mb-0.5">{plan.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span>{plan.items.length} items</span>
                    <span>·</span>
                    <span>{plan.plot.width * plan.plot.height} sq.ft</span>
                    <span>·</span>
                    <span>{formatDate(plan.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/planner/${plan.id}`}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg text-center transition">
                      Open
                    </Link>
                    <button onClick={() => handleDelete(plan.id)} disabled={deleting === plan.id}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New plan card */}
            <Link href="/planner/new"
              className="group border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center py-12 transition-all hover:bg-blue-600/5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-600/10 border border-slate-700 group-hover:border-blue-500/30 flex items-center justify-center mb-3 transition-all">
                <svg className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover:text-blue-400 transition">New Plan</span>
            </Link>
          </div>
        )}

        {/* Features strip */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📐', title: 'Accurate Measurements', desc: 'Set plot dimensions in feet with snap-to-grid precision.' },
            { icon: '🛋️', title: '50+ Household Items', desc: 'Rooms, doors, windows, furniture, and outdoor elements.' },
            { icon: '📄', title: 'Export & Download', desc: 'Export your plan as TXT report, JSON data, or CSV sheet.' },
          ].map((f) => (
            <div key={f.title} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-200 mb-1">{f.title}</div>
              <div className="text-xs text-slate-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
