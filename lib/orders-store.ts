import { promises as fs } from 'fs';
import path from 'path';
import { getSql, hasDatabase } from './db';

export type StoreOrder = {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  offer: string;
  pieces: unknown;
  price: unknown;
  timestamp: string;
  status: string;
  note: string;
  source: string;
  fbclid: string;
  ttclid: string;
  sccid: string;
  utm_source: string;
  productId: string;
  clientOrderId: string;
  visitorId: string;
  ip: string;
};

type OrderRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  offer: string;
  pieces: string | null;
  price: string | null;
  timestamp: string | Date;
  status: string;
  note: string;
  source: string;
  fbclid: string;
  ttclid: string;
  sccid: string;
  utm_source: string;
  product_id: string;
  client_order_id: string;
  visitor_id: string;
  ip: string | null;
};

type OrderBlock = {
  ip: string;
  productId: string;
  until: string;
  reason: string;
};

type AbuseAttempt = {
  ip: string;
  productId: string;
  reason: string;
  timestamp: string;
};

const ORDERS_FILE = path.join(process.cwd(), 'orders.json');
const ORDER_BLOCKS_FILE = path.join(process.cwd(), 'order-blocks.json');
const ABUSE_ATTEMPTS_FILE = path.join(process.cwd(), 'order-abuse-attempts.json');

const CANCELLED_STATUS_RE = /annul|cancel|ملغ|رفض|refus/i;

let schemaReady: Promise<void> | null = null;

export function isCancelledStatus(status: string): boolean {
  return CANCELLED_STATUS_RE.test(String(status || ''));
}

function parseMaybeJson(value: string | null): unknown {
  if (value == null || value === '') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function rowToOrder(row: OrderRow): StoreOrder {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    city: row.city,
    address: row.address || '',
    offer: row.offer,
    pieces: parseMaybeJson(row.pieces),
    price: parseMaybeJson(row.price),
    timestamp:
      typeof row.timestamp === 'string'
        ? row.timestamp
        : new Date(row.timestamp).toISOString(),
    status: row.status || 'Nouveau',
    note: row.note || '',
    source: row.source || 'direct',
    fbclid: row.fbclid || '',
    ttclid: row.ttclid || '',
    sccid: row.sccid || '',
    utm_source: row.utm_source || '',
    productId: row.product_id || '',
    clientOrderId: row.client_order_id || '',
    visitorId: row.visitor_id || '',
    ip: row.ip || '',
  };
}

function encodeField(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

async function readFileOrders(): Promise<StoreOrder[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return (data as StoreOrder[]).map((order) => ({
      ...order,
      ip: order.ip || '',
    }));
  } catch {
    return [];
  }
}

async function writeFileOrders(orders: StoreOrder[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

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

function mergeOrdersById(primary: StoreOrder[], extra: StoreOrder[]): StoreOrder[] {
  const seen = new Set(primary.map((order) => String(order.id)));
  const merged = [...primary];
  for (const order of extra) {
    if (seen.has(String(order.id))) continue;
    seen.add(String(order.id));
    merged.push(order);
  }
  return merged.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

async function ensureOrderSchema(): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip text NOT NULL DEFAULT ''`;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_orders_phone_product
        ON orders (phone, product_id)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS order_blocks (
          ip text NOT NULL,
          product_id text NOT NULL,
          until_at timestamptz NOT NULL,
          reason text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (ip, product_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS order_abuse_attempts (
          id bigserial PRIMARY KEY,
          ip text NOT NULL,
          product_id text NOT NULL,
          reason text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_order_abuse_ip_product_created
        ON order_abuse_attempts (ip, product_id, created_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function listOrders(): Promise<StoreOrder[]> {
  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        const rows = (await sql`
          SELECT *
          FROM orders
          ORDER BY timestamp DESC
        `) as OrderRow[];
        // Surface any orders that landed in the local file during a past DB outage.
        const fileOrders = await readFileOrders();
        return mergeOrdersById(rows.map(rowToOrder), fileOrders);
      }
    } catch (error) {
      console.error('[orders] neon list failed, using file', error);
    }
  }
  const fileOrders = await readFileOrders();
  return [...fileOrders].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );
}

export async function insertOrder(order: StoreOrder): Promise<void> {
  if (hasDatabase()) {
    const sql = getSql();
    if (!sql) {
      throw new Error('DATABASE_URL is set but SQL client is unavailable');
    }
    await ensureOrderSchema();
    // Never fall back to the local file when Neon is configured: that made
    // checkout succeed + Purchase pixel fire while /admin (Neon) missed the row.
    await sql`
      INSERT INTO orders (
        id, name, phone, city, address, offer, pieces, price,
        timestamp, status, note, source, fbclid, ttclid, sccid,
        utm_source, product_id, client_order_id, visitor_id, ip
      ) VALUES (
        ${order.id},
        ${order.name},
        ${order.phone},
        ${order.city},
        ${order.address || ''},
        ${order.offer},
        ${encodeField(order.pieces)},
        ${encodeField(order.price)},
        ${order.timestamp},
        ${order.status || 'Nouveau'},
        ${order.note || ''},
        ${order.source || 'direct'},
        ${order.fbclid || ''},
        ${order.ttclid || ''},
        ${order.sccid || ''},
        ${order.utm_source || ''},
        ${order.productId || ''},
        ${order.clientOrderId || ''},
        ${order.visitorId || ''},
        ${order.ip || ''}
      )
    `;
    return;
  }

  const orders = await readFileOrders();
  orders.push({ ...order, ip: order.ip || '' });
  await writeFileOrders(orders);
}

export async function findActiveOrderByPhoneProduct(
  phone: string,
  productId: string
): Promise<StoreOrder | null> {
  const cleanPhone = String(phone || '');
  const cleanProduct = String(productId || '');
  if (!cleanPhone || !cleanProduct) return null;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        const rows = (await sql`
          SELECT id, phone, status, product_id, timestamp, ip, visitor_id
          FROM orders
          WHERE phone = ${cleanPhone}
            AND product_id = ${cleanProduct}
          ORDER BY timestamp DESC
          LIMIT 5
        `) as OrderRow[];
        const hit = rows.map(rowToOrder).find((order) => !isCancelledStatus(order.status));
        if (hit) return hit;
      }
    } catch (error) {
      console.error('[orders] findActiveOrderByPhoneProduct failed', error);
    }
  }

  const fileOrders = await readFileOrders();
  return (
    fileOrders.find(
      (order) =>
        order.phone === cleanPhone &&
        order.productId === cleanProduct &&
        !isCancelledStatus(order.status)
    ) || null
  );
}

/** Small set for near-dup checks: same product + same IP or visitor only. */
export async function listRecentOrdersForNearDup(
  productId: string,
  sinceIso: string,
  ip: string,
  visitorId: string
): Promise<StoreOrder[]> {
  const cleanProduct = String(productId || '');
  const cleanIp = String(ip || '').trim();
  const cleanVisitor = String(visitorId || '').trim();
  if (!cleanProduct || (!cleanIp && !cleanVisitor)) return [];
  const sinceMs = Date.parse(sinceIso);

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        const rows = (await sql`
          SELECT id, phone, status, timestamp, ip, visitor_id, product_id
          FROM orders
          WHERE product_id = ${cleanProduct}
            AND timestamp >= ${sinceIso}
            AND (
              (${cleanIp} <> '' AND ip = ${cleanIp})
              OR (${cleanVisitor} <> '' AND visitor_id = ${cleanVisitor})
            )
          ORDER BY timestamp DESC
          LIMIT 30
        `) as OrderRow[];
        return rows
          .map(rowToOrder)
          .filter((order) => !isCancelledStatus(order.status));
      }
    } catch (error) {
      console.error('[orders] listRecentOrdersForNearDup failed', error);
    }
  }

  const fileOrders = await readFileOrders();
  return fileOrders.filter((order) => {
    if (order.productId !== cleanProduct || isCancelledStatus(order.status)) {
      return false;
    }
    if (Date.parse(order.timestamp) < sinceMs) return false;
    const sameIp = Boolean(cleanIp && order.ip === cleanIp);
    const sameVisitor = Boolean(cleanVisitor && order.visitorId === cleanVisitor);
    return sameIp || sameVisitor;
  });
}

export async function isIpProductBlocked(
  ip: string,
  productId: string
): Promise<boolean> {
  const cleanIp = String(ip || '').trim();
  const cleanProduct = String(productId || '').trim();
  if (!cleanIp || !cleanProduct) return false;
  const now = Date.now();

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        const rows = (await sql`
          SELECT until_at
          FROM order_blocks
          WHERE ip = ${cleanIp}
            AND product_id = ${cleanProduct}
          LIMIT 1
        `) as { until_at: string | Date }[];
        if (!rows[0]) return false;
        const untilMs =
          typeof rows[0].until_at === 'string'
            ? Date.parse(rows[0].until_at)
            : rows[0].until_at.getTime();
        return untilMs > now;
      }
    } catch (error) {
      console.error('[orders] isIpProductBlocked failed', error);
    }
  }

  const blocks = await readJsonFile<OrderBlock[]>(ORDER_BLOCKS_FILE, []);
  return blocks.some(
    (block) =>
      block.ip === cleanIp &&
      block.productId === cleanProduct &&
      Date.parse(block.until) > now
  );
}

export async function banIpProduct(
  ip: string,
  productId: string,
  untilIso: string,
  reason: string
): Promise<void> {
  const cleanIp = String(ip || '').trim();
  const cleanProduct = String(productId || '').trim();
  if (!cleanIp || !cleanProduct) return;

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        await sql`
          INSERT INTO order_blocks (ip, product_id, until_at, reason)
          VALUES (${cleanIp}, ${cleanProduct}, ${untilIso}, ${reason || ''})
          ON CONFLICT (ip, product_id)
          DO UPDATE SET
            until_at = EXCLUDED.until_at,
            reason = EXCLUDED.reason
        `;
        return;
      }
    } catch (error) {
      console.error('[orders] banIpProduct failed', error);
    }
  }

  const blocks = await readJsonFile<OrderBlock[]>(ORDER_BLOCKS_FILE, []);
  const next = blocks.filter(
    (block) => !(block.ip === cleanIp && block.productId === cleanProduct)
  );
  next.push({
    ip: cleanIp,
    productId: cleanProduct,
    until: untilIso,
    reason: reason || '',
  });
  await writeJsonFile(ORDER_BLOCKS_FILE, next);
}

export async function recordAbuseAttempt(
  ip: string,
  productId: string,
  reason: string
): Promise<void> {
  const cleanIp = String(ip || '').trim();
  const cleanProduct = String(productId || '').trim();
  if (!cleanIp || !cleanProduct) return;
  const timestamp = new Date().toISOString();

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        await sql`
          INSERT INTO order_abuse_attempts (ip, product_id, reason, created_at)
          VALUES (${cleanIp}, ${cleanProduct}, ${reason || ''}, ${timestamp})
        `;
        return;
      }
    } catch (error) {
      console.error('[orders] recordAbuseAttempt failed', error);
    }
  }

  const attempts = await readJsonFile<AbuseAttempt[]>(ABUSE_ATTEMPTS_FILE, []);
  attempts.push({
    ip: cleanIp,
    productId: cleanProduct,
    reason: reason || '',
    timestamp,
  });
  await writeJsonFile(ABUSE_ATTEMPTS_FILE, attempts);
}

export async function countAbuseAttempts(
  ip: string,
  productId: string,
  sinceIso: string
): Promise<number> {
  const cleanIp = String(ip || '').trim();
  const cleanProduct = String(productId || '').trim();
  if (!cleanIp || !cleanProduct) return 0;
  const sinceMs = Date.parse(sinceIso);

  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        await ensureOrderSchema();
        const rows = (await sql`
          SELECT COUNT(*)::int AS count
          FROM order_abuse_attempts
          WHERE ip = ${cleanIp}
            AND product_id = ${cleanProduct}
            AND created_at >= ${sinceIso}
        `) as { count: number }[];
        return Number(rows[0]?.count || 0);
      }
    } catch (error) {
      console.error('[orders] countAbuseAttempts failed', error);
    }
  }

  const attempts = await readJsonFile<AbuseAttempt[]>(ABUSE_ATTEMPTS_FILE, []);
  return attempts.filter(
    (attempt) =>
      attempt.ip === cleanIp &&
      attempt.productId === cleanProduct &&
      Date.parse(attempt.timestamp) >= sinceMs
  ).length;
}

export async function updateOrderFields(
  id: string,
  patch: { status?: string; note?: string; address?: string }
): Promise<StoreOrder | null> {
  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        const current = (await sql`
          SELECT * FROM orders WHERE id = ${id} LIMIT 1
        `) as OrderRow[];
        if (!current[0]) return null;
        const nextStatus = patch.status !== undefined ? patch.status : current[0].status;
        const nextNote = patch.note !== undefined ? patch.note : current[0].note;
        const nextAddress = patch.address !== undefined ? patch.address : current[0].address;
        const rows = (await sql`
          UPDATE orders
          SET status = ${nextStatus},
              note = ${nextNote},
              address = ${nextAddress}
          WHERE id = ${id}
          RETURNING *
        `) as OrderRow[];
        return rows[0] ? rowToOrder(rows[0]) : null;
      }
    } catch (error) {
      console.error('[orders] neon update failed, using file', error);
    }
  }

  const orders = await readFileOrders();
  const index = orders.findIndex((order) => String(order.id) === String(id));
  if (index === -1) return null;
  if (patch.status !== undefined) orders[index].status = patch.status;
  if (patch.note !== undefined) orders[index].note = patch.note;
  if (patch.address !== undefined) orders[index].address = patch.address;
  await writeFileOrders(orders);
  return orders[index];
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (hasDatabase()) {
    try {
      const sql = getSql();
      if (sql) {
        const rows = (await sql`
          DELETE FROM orders
          WHERE id = ${id}
          RETURNING id
        `) as { id: string }[];
        if (rows.length > 0) return true;
      }
    } catch (error) {
      console.error('[orders] neon delete failed, using file', error);
    }
  }

  const orders = await readFileOrders();
  const next = orders.filter((order) => String(order.id) !== String(id));
  if (next.length === orders.length) return false;
  await writeFileOrders(next);
  return true;
}
