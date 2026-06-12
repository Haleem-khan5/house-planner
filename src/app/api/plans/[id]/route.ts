import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readPlan, savePlan, deletePlan } from '@/lib/storage';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const plan = readPlan(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (plan.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ plan });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = readPlan(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = { ...existing, ...body, id, userId: session.userId, updatedAt: new Date().toISOString() };
  savePlan(updated);
  return NextResponse.json({ plan: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const plan = readPlan(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (plan.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  deletePlan(id);
  return NextResponse.json({ success: true });
}
