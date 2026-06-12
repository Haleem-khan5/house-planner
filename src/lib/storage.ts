import fs from 'fs';
import path from 'path';
import { User, Plan } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLANS_DIR = path.join(DATA_DIR, 'plans');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Users ──────────────────────────────────────────────────────────────────

export function readUsers(): User[] {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

export function writeUsers(users: User[]): void {
  ensureDir(DATA_DIR);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

export function saveUser(user: User): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeUsers(users);
}

// ── Plans ──────────────────────────────────────────────────────────────────

function planFile(planId: string): string {
  return path.join(PLANS_DIR, `${planId}.json`);
}

export function readPlan(planId: string): Plan | null {
  ensureDir(PLANS_DIR);
  const file = planFile(planId);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function savePlan(plan: Plan): void {
  ensureDir(PLANS_DIR);
  fs.writeFileSync(planFile(plan.id), JSON.stringify(plan, null, 2));
}

export function deletePlan(planId: string): boolean {
  const file = planFile(planId);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return true;
  }
  return false;
}

export function listPlansForUser(userId: string): Plan[] {
  ensureDir(PLANS_DIR);
  const files = fs.readdirSync(PLANS_DIR).filter((f) => f.endsWith('.json'));
  const plans: Plan[] = [];
  for (const f of files) {
    try {
      const plan: Plan = JSON.parse(
        fs.readFileSync(path.join(PLANS_DIR, f), 'utf-8')
      );
      if (plan.userId === userId) plans.push(plan);
    } catch {
      // skip corrupt file
    }
  }
  return plans.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
