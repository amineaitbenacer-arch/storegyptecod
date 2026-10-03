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

export async function listOrders(): Promise<StoreOrder[]> {
  const sql = getSql();
  if (!sql || !hasDatabase()) return [];
  const rows = (await sql`
    SELECT *
    FROM orders
    ORDER BY timestamp DESC
  `) as OrderRow[];
  return rows.map(rowToOrder);
}

export async function insertOrder(order: StoreOrder): Promise<void> {
  const sql = getSql();
  if (!sql || !hasDatabase()) {
    throw new Error('DATABASE_URL missing');
  }
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
}

export async function updateOrderFields(
  id: string,
  patch: { status?: string; note?: string; address?: string }
): Promise<StoreOrder | null> {
  const sql = getSql();
  if (!sql || !hasDatabase()) throw new Error('DATABASE_URL missing');

  const rows = (await sql`
    UPDATE orders
    SET
      status = COALESCE(${patch.status ?? null}, status),
      note = COALESCE(${patch.note ?? null}, note),
      address = COALESCE(${patch.address ?? null}, address)
    WHERE id = ${id}
    RETURNING *
  `) as OrderRow[];

  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql || !hasDatabase()) throw new Error('DATABASE_URL missing');
  const rows = (await sql`
    DELETE FROM orders
    WHERE id = ${id}
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}
