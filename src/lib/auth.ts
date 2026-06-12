import { cookies } from 'next/headers';
import { AuthSession } from '@/types';
import { findUserById } from './storage';

const SESSION_COOKIE = 'hp_session';

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const session: AuthSession = JSON.parse(
      Buffer.from(raw, 'base64').toString('utf-8')
    );
    const user = findUserById(session.userId);
    if (!user) return null;
    return session;
  } catch {
    return null;
  }
}

export function createSessionCookie(session: AuthSession): string {
  const encoded = Buffer.from(JSON.stringify(session)).toString('base64');
  return `${SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
