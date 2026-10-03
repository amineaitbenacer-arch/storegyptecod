import { NextRequest, NextResponse } from 'next/server';
import { appendEvent } from '../../../lib/analytics-store';
import {
  deleteOrder,
  insertOrder,
  listOrders,
  updateOrderFields,
  type StoreOrder,
} from '../../../lib/orders-store';
import { normalizePhone } from '../../../lib/phone';
import { isAdSource, sourceFromClick, type AdSource } from '../../../lib/tracking';

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
    const cleanPhone = normalizePhone(String(phone || ''));

    if (!name || !cleanPhone || !city || !offerLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const clickSource = sourceFromClick({
      fbclid: fbclid || undefined,
      ttclid: ttclid || undefined,
      sccid: sccid || undefined,
      utm_source: utm_source || undefined,
    });
    const source: AdSource =
      clickSource !== 'direct'
        ? clickSource
        : isAdSource(bodySource)
          ? bodySource
          : 'direct';

    const order: StoreOrder = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: String(name).trim(),
      phone: cleanPhone,
      city: String(city).trim(),
      address: String(address || city || '').trim(),
      offer: String(offerLabel),
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

    await insertOrder(order);

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
  } catch (error) {
    console.error('[orders] POST failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orders = await listOrders();
    return NextResponse.json({ success: true, orders, total: orders.length });
  } catch (error) {
    console.error('[orders] GET failed', error);
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

  const order = await updateOrderFields(id, { status, note, address });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ success: true, order });
}

export async function PATCH(request: NextRequest) {
  try {
    return await updateOrder(request);
  } catch (error) {
    console.error('[orders] PATCH failed', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await updateOrder(request);
  } catch (error) {
    console.error('[orders] PUT failed', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await deleteOrder(id);
    if (!ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[orders] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
