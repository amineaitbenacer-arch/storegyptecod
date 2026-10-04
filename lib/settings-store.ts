import { promises as fs } from 'fs';
import path from 'path';
import { getSql, hasDatabase } from './db';
import { extractPixelIds, isExamplePixel, joinPixelIds } from './pixel-ids';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

export const SETTINGS_KEYS = [
  'fb_pixel_1',
  'fb_token_1',
  'fb_pixel_2',
  'fb_token_2',
  'tiktok_pixel',
  'tiktok_token',
  'snapchat_pixel',
  'snapchat_token',
  'snapchat_pixel_2',
  'snapchat_token_2',
] as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[number];
export type StoreSettings = Record<SettingsKey, string>;

const EMPTY: StoreSettings = {
  fb_pixel_1: '',
  fb_token_1: '',
  fb_pixel_2: '',
  fb_token_2: '',
  tiktok_pixel: '',
  tiktok_token: '',
  snapchat_pixel: '',
  snapchat_token: '',
  snapchat_pixel_2: '',
  snapchat_token_2: '',
};

const TOKEN_KEYS = new Set<SettingsKey>([
  'fb_token_1',
  'fb_token_2',
  'tiktok_token',
  'snapchat_token',
  'snapchat_token_2',
]);

let tableReady: Promise<void> | null = null;

function blank(): StoreSettings {
  return { ...EMPTY };
}

export function normalizeSettings(raw: unknown): StoreSettings {
  const next = blank();
  if (!raw || typeof raw !== 'object') return next;
  const source = raw as Record<string, unknown>;
  const aliases: Partial<Record<SettingsKey, string>> = {
    fb_pixel_1: 'fb_pixel_id',
    fb_token_1: 'fb_access_token',
    tiktok_pixel: 'tiktok_pixel_id',
    tiktok_token: 'tiktok_access_token',
  };
  for (const key of SETTINGS_KEYS) {
    const alias = aliases[key];
    const value = source[key] ?? (alias ? source[alias] : undefined);
    next[key] = cleanValue(key, value);
  }
  return next;
}

function cleanToken(value: string) {
  const text = value.replace(/\u0000/g, '').replace(/[\r\n\t]+/g, '').trim();
  if (!text || isExamplePixel(text)) return '';
  return text.slice(0, 8000);
}

function cleanValue(key: SettingsKey, value: unknown) {
  const text = String(value ?? '').replace(/\u0000/g, '').trim();
  if (!text) return '';
  if (key.startsWith('fb_pixel')) return joinPixelIds(extractPixelIds(text, 'meta'));
  if (key === 'tiktok_pixel') return joinPixelIds(extractPixelIds(text, 'tiktok'));
  if (key.startsWith('snapchat_pixel')) return joinPixelIds(extractPixelIds(text, 'snap'));
  return cleanToken(text);
}

async function readFileSettings(): Promise<StoreSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return blank();
  }
}

async function ensureTable() {
  const sql = getSql();
  if (!sql) return;
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        id integer PRIMARY KEY,
        data text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
      .then(() => undefined)
      .catch((error) => {
        tableReady = null;
        throw error;
      });
  }
  await tableReady;
}

export async function readSettings(): Promise<StoreSettings> {
  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureTable();
        const rows = (await sql`
          SELECT data FROM store_settings WHERE id = 1 LIMIT 1
        `) as { data: string }[];
        if (rows[0]?.data) return normalizeSettings(JSON.parse(rows[0].data));
        return blank();
      }
    } catch (error) {
      console.error('[settings] neon read failed', error);
    }
  }
  return readFileSettings();
}

export async function writeSettings(incoming: unknown): Promise<StoreSettings> {
  const current = await readSettings();
  const parsed = normalizeSettings(incoming);
  const next = { ...current };
  for (const key of SETTINGS_KEYS) {
    const value = parsed[key];
    if (TOKEN_KEYS.has(key) && !value && current[key]) continue;
    next[key] = value;
  }

  const payload = JSON.stringify(next);
  if (hasDatabase()) {
    const sql = getSql();
    if (!sql) throw new Error('Database is not configured');
    try {
      await ensureTable();
      await sql`
        INSERT INTO store_settings (id, data, updated_at)
        VALUES (1, ${payload}, NOW())
        ON CONFLICT (id) DO UPDATE
        SET data = EXCLUDED.data, updated_at = NOW()
      `;
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error && 'message' in error
            ? String((error as { message: unknown }).message)
            : String(error);
      throw new Error(detail || 'Settings could not be saved');
    }
    return next;
  }

  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    throw new Error('Settings could not be saved. The host filesystem is read-only.');
  }
  return next;
}
