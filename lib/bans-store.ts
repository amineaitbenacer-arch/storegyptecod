import { promises as fs } from 'fs';
import path from 'path';
import { getSql, hasDatabase } from './db';
import { normalizePhone } from './phone';

export type PhoneBan = {
  phone: string;
  reason: string;
  createdAt: string;
};

export type IpBan = {
  ip: string;
  reason: string;
  createdAt: string;
};

export type VisitorBan = {
  visitorId: string;
  reason: string;
  createdAt: string;
};

const PHONE_BANS_FILE = path.join(process.cwd(), 'phone-bans.json');
const IP_BANS_FILE = path.join(process.cwd(), 'ip-bans.json');
const VISITOR_BANS_FILE = path.join(process.cwd(), 'visitor-bans.json');

/** Permanent site bans — seeded for known abusers. */
const SEED_PHONE_BANS: PhoneBan[] = [
  {
    phone: '0509606340',
    reason: 'abuse: multi-order قريش شرواني',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    phone: '0570267340',
    reason: 'abuse: same person alt number قريش شرواني',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
];

const SEED_VISITOR_BANS: VisitorBan[] = [
  {
    visitorId: '9be93016-a35f-432f-b4fd-0c4c4e2ec351',
    reason: 'abuse: multi-order 0509606340',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    visitorId: 'fe9fc92d-86bf-4723-a7dc-2863de77c35d',
    reason: 'abuse: multi-order 0570267340',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
];

let schemaReady: Promise<void> | null = null;
let seedReady: Promise<void> | null = null;

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function ensureBanSchema(): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS phone_bans (
          phone text PRIMARY KEY,
          reason text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS ip_bans (
          ip text PRIMARY KEY,
          reason text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS visitor_bans (
          visitor_id text PRIMARY KEY,
          reason text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function ensureSeedBans(): Promise<void> {
  if (!seedReady) {
    seedReady = (async () => {
      for (const ban of SEED_PHONE_BANS) {
        await banPhone(ban.phone, ban.reason, ban.createdAt);
      }
      for (const ban of SEED_VISITOR_BANS) {
        await banVisitor(ban.visitorId, ban.reason, ban.createdAt);
      }
    })().catch((error) => {
      seedReady = null;
      console.error('[bans] seed failed', error);
    });
  }
  await seedReady;
}

export async function banPhone(
  phone: string,
  reason: string,
  createdAt = new Date().toISOString()
): Promise<void> {
  const clean = normalizePhone(phone);
  if (!clean) return;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        await sql`
          INSERT INTO phone_bans (phone, reason, created_at)
          VALUES (${clean}, ${reason || ''}, ${createdAt})
          ON CONFLICT (phone) DO UPDATE SET reason = EXCLUDED.reason
        `;
        return;
      }
    } catch (error) {
      console.error('[bans] banPhone failed', error);
    }
  }

  const bans = await readJsonFile<PhoneBan[]>(PHONE_BANS_FILE, []);
  const next = bans.filter((b) => b.phone !== clean);
  next.push({ phone: clean, reason: reason || '', createdAt });
  await writeJsonFile(PHONE_BANS_FILE, next);
}

export async function banIp(
  ip: string,
  reason: string,
  createdAt = new Date().toISOString()
): Promise<void> {
  const clean = String(ip || '').trim().slice(0, 80);
  if (!clean) return;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        await sql`
          INSERT INTO ip_bans (ip, reason, created_at)
          VALUES (${clean}, ${reason || ''}, ${createdAt})
          ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason
        `;
        return;
      }
    } catch (error) {
      console.error('[bans] banIp failed', error);
    }
  }

  const bans = await readJsonFile<IpBan[]>(IP_BANS_FILE, []);
  const next = bans.filter((b) => b.ip !== clean);
  next.push({ ip: clean, reason: reason || '', createdAt });
  await writeJsonFile(IP_BANS_FILE, next);
}

export async function banVisitor(
  visitorId: string,
  reason: string,
  createdAt = new Date().toISOString()
): Promise<void> {
  const clean = String(visitorId || '')
    .replace(/[^\w-]/g, '')
    .slice(0, 80);
  if (!clean) return;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        await sql`
          INSERT INTO visitor_bans (visitor_id, reason, created_at)
          VALUES (${clean}, ${reason || ''}, ${createdAt})
          ON CONFLICT (visitor_id) DO UPDATE SET reason = EXCLUDED.reason
        `;
        return;
      }
    } catch (error) {
      console.error('[bans] banVisitor failed', error);
    }
  }

  const bans = await readJsonFile<VisitorBan[]>(VISITOR_BANS_FILE, []);
  const next = bans.filter((b) => b.visitorId !== clean);
  next.push({ visitorId: clean, reason: reason || '', createdAt });
  await writeJsonFile(VISITOR_BANS_FILE, next);
}

export async function isPhoneBanned(phone: string): Promise<boolean> {
  await ensureSeedBans();
  const clean = normalizePhone(phone);
  if (!clean) return false;

  if (SEED_PHONE_BANS.some((b) => b.phone === clean)) return true;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        const rows = (await sql`
          SELECT 1 FROM phone_bans WHERE phone = ${clean} LIMIT 1
        `) as { '?column?': number }[];
        return rows.length > 0;
      }
    } catch (error) {
      console.error('[bans] isPhoneBanned failed', error);
    }
  }

  const bans = await readJsonFile<PhoneBan[]>(PHONE_BANS_FILE, []);
  return bans.some((b) => b.phone === clean);
}

export async function isIpBanned(ip: string): Promise<boolean> {
  const clean = String(ip || '').trim();
  if (!clean) return false;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        const rows = (await sql`
          SELECT 1 FROM ip_bans WHERE ip = ${clean} LIMIT 1
        `) as { '?column?': number }[];
        return rows.length > 0;
      }
    } catch (error) {
      console.error('[bans] isIpBanned failed', error);
    }
  }

  const bans = await readJsonFile<IpBan[]>(IP_BANS_FILE, []);
  return bans.some((b) => b.ip === clean);
}

export async function isVisitorBanned(visitorId: string): Promise<boolean> {
  await ensureSeedBans();
  const clean = String(visitorId || '')
    .replace(/[^\w-]/g, '')
    .slice(0, 80);
  if (!clean) return false;

  if (SEED_VISITOR_BANS.some((b) => b.visitorId === clean)) return true;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureBanSchema();
        const rows = (await sql`
          SELECT 1 FROM visitor_bans WHERE visitor_id = ${clean} LIMIT 1
        `) as { '?column?': number }[];
        return rows.length > 0;
      }
    } catch (error) {
      console.error('[bans] isVisitorBanned failed', error);
    }
  }

  const bans = await readJsonFile<VisitorBan[]>(VISITOR_BANS_FILE, []);
  return bans.some((b) => b.visitorId === clean);
}

/** Fast sync check for middleware (seed + env only — no DB/fs). */
export function isIpBannedSync(ip: string): boolean {
  const clean = String(ip || '').trim();
  if (!clean) return false;
  const fromEnv = (process.env.BANNED_IPS || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.includes(clean);
}
