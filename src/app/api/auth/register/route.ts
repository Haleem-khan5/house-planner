import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, saveUser } from '@/lib/storage';
import { createSessionCookie } from '@/lib/auth';
import { AuthSession } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    const session: AuthSession = { userId: user.id, email: user.email, name: user.name };
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    res.headers.set('Set-Cookie', createSessionCookie(session));
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
