import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { appendEvent } from '../../../lib/analytics-store';
import { isAdSource, sourceFromClick } from '../../../lib/tracking';

const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

async function getOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveOrders(orders: unknown[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      city,
      address,
      offer,
      offerName,
      pieces,
      price,
      timestamp,
      fbclid,
      ttclid,
      sccid,
      utm_source,
      productId,
      visitorId,
      orderId: clientOrderId,
      source: bodySource,
    } = body;
    const offerLabel = offer || offerName;

    if (!name || !phone || !city || !offerLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const clickSource = sourceFromClick({
      fbclid: fbclid || undefined,
      ttclid: ttclid || undefined,
      sccid: sccid || undefined,
      utm_source: utm_source || undefined,
    });
    const source =
      clickSource !== 'direct'
        ? clickSource
        : isAdSource(bodySource)
          ? bodySource
          : 'direct';

    const order = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name,
      phone,
      city,
      address: address || '',
      offer: offerLabel,
      pieces,
      price,
      timestamp: timestamp || new Date().toISOString(),
      status: 'Nouveau',
      note: '',
      source,
      fbclid: fbclid || '',
      ttclid: ttclid || '',
      sccid: sccid || '',
      utm_source: utm_source || '',
      productId: String(productId || '').replace(/[^\w.-]/g, '').slice(0, 80),
      clientOrderId: String(clientOrderId || '').replace(/[^\w.-]/g, '').slice(0, 80),
      visitorId: String(visitorId || '').replace(/[^\w-]/g, '').slice(0, 80),
    };

    const orders = await getOrders();
    orders.push(order);
    await saveOrders(orders);

    // Keep statistics in sync even if client analytics beacon is lost
    const vid = String(order.visitorId || '');
    if (/^[a-zA-Z0-9-]{8,80}$/.test(vid)) {
      try {
        await appendEvent({
          visitorId: vid,
          type: 'purchase',
          source,
          path: '/thankyou',
          productId: order.productId || '',
          orderId: String(order.clientOrderId || order.id),
          ts: order.timestamp,
          loadMs: 0,
        });
      } catch {
        /* never fail the order */
      }
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json({ success: true, orders, total: orders.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

const STATUSES = [
  'Nouveau',
  'Confirmé',
  'Annulé',
  'Pas de réponse',
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

async function updateOrder(request: NextRequest) {
  const body = await request.json();
  const { id, status, note, address } = body as {
    id?: string;
    status?: string;
    note?: string;
    address?: string;
  };

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (status !== undefined && !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const orders = await getOrders();
  const index = orders.findIndex((order: { id?: string }) => String(order.id) === String(id));
  if (index === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (status !== undefined) orders[index].status = status;
  if (note !== undefined) orders[index].note = note;
  if (address !== undefined) orders[index].address = address;
  await saveOrders(orders);
  return NextResponse.json({ success: true, order: orders[index] });
}

export async function PATCH(request: NextRequest) {
  try {
    return await updateOrder(request);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await updateOrder(request);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const orders = await getOrders();
    const next = orders.filter((order: { id?: string }) => String(order.id) !== String(id));
    if (next.length === orders.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    await saveOrders(next);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
