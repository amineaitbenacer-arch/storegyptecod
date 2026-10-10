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
};

const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

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
    return Array.isArray(data) ? (data as StoreOrder[]) : [];
  } catch {
    return [];
  }
}

async function writeFileOrders(orders: StoreOrder[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
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
    // Never fall back to the local file when Neon is configured: that made
    // checkout succeed + Purchase pixel fire while /admin (Neon) missed the row.
    await sql`
      INSERT INTO orders (
        id, name, phone, city, address, offer, pieces, price,
        timestamp, status, note, source, fbclid, ttclid, sccid,
        utm_source, product_id, client_order_id, visitor_id
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
        ${order.visitorId || ''}
      )
    `;
    return;
  }

  const orders = await readFileOrders();
  orders.push(order);
  await writeFileOrders(orders);
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
