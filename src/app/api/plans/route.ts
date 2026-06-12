import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth';
import { savePlan, listPlansForUser } from '@/lib/storage';
import { Plan } from '@/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plans = listPlansForUser(session.userId);
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const plan: Plan = {
      id: body.id || uuidv4(),
      userId: session.userId,
      name: body.name || 'Untitled Plan',
      description: body.description || '',
      plot: body.plot,
      items: body.items || [],
      createdAt: body.createdAt || now,
      updatedAt: now,
    };
    savePlan(plan);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
