import { NextRequest, NextResponse } from 'next/server';
import { appendEvent } from '../../../lib/analytics-store';
import { banActor } from '../../../lib/bans-store';
import { siteBanCookieHeader } from '../../../lib/ip-gate';
import {
  clientIpFromHeaders,
  evaluateOrderGuard,
  ORDER_ALREADY_RECORDED,
} from '../../../lib/order-guard';
import { DuplicateOrderError } from '../../../lib/order-messages';
import {
  deleteOrder,
  insertOrder,
  listOrders,
  updateOrderFields,
  type StoreOrder,
} from '../../../lib/orders-store';
import {
  isValidOrderPhone,
  normalizePhone,
  shouldBanIpForBadPhone,
} from '../../../lib/phone';
import { resolveAttributedSource } from '../../../lib/tracking';

function jsonWithSiteBan(
  body: Record<string, unknown>,
  status: number,
  siteBan: boolean
) {
  const res = NextResponse.json(body, { status });
  if (siteBan) res.headers.set('Set-Cookie', siteBanCookieHeader());
  return res;
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
      clickAt,
      productId,
      visitorId,
      orderId: clientOrderId,
      source: bodySource,
    } = body;
    const offerLabel = offer || offerName;
    const cleanPhone = normalizePhone(String(phone || ''));
    const cleanProductId = String(productId || '').replace(/[^\w.-]/g, '').slice(0, 80);
    const cleanVisitorId = String(visitorId || '').replace(/[^\w-]/g, '').slice(0, 80);
    const cleanName = String(name || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanAddress = String(address || cleanCity || '').trim();
    const clientIp = clientIpFromHeaders(request.headers);

    if (!cleanPhone || !offerLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // productId required so phone+product lock applies to every montage (current + future).
    if (!cleanProductId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    if (!isValidOrderPhone(cleanPhone)) {
      // Incomplete (≤2 digits after 05) or fake pattern → permanent site ban.
      if (shouldBanIpForBadPhone(cleanPhone)) {
        await banActor({
          ip: clientIp,
          visitorId: cleanVisitorId,
          phone: cleanPhone.length >= 10 ? cleanPhone : undefined,
          reason: `auto: bad phone ${cleanPhone} (≤2 digits after 05 or spam pattern)`,
        });
        return jsonWithSiteBan({ error: 'Invalid phone number' }, 400, true);
      }
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const guard = await evaluateOrderGuard({
      phone: cleanPhone,
      productId: cleanProductId,
      ip: clientIp,
      visitorId: cleanVisitorId,
      name: cleanName,
      city: cleanCity,
    });
    if (!guard.allow) {
      return jsonWithSiteBan(
        { success: false, error: ORDER_ALREADY_RECORDED },
        409,
        Boolean(guard.siteBan)
      );
    }

    const attributed = resolveAttributedSource({
      fbclid,
      ttclid,
      sccid,
      utm_source,
      clickAt,
      bodySource,
    });
    const source = attributed.source;

    const order: StoreOrder = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: cleanName,
      phone: cleanPhone,
      city: cleanCity,
      address: cleanAddress,
      offer: String(offerLabel),
      pieces,
      price,
      timestamp: timestamp || new Date().toISOString(),
      status: 'Nouveau',
      note: '',
      source,
      fbclid: attributed.fbclid,
      ttclid: attributed.ttclid,
      sccid: attributed.sccid,
      utm_source: attributed.utm_source,
      productId: cleanProductId,
      clientOrderId: String(clientOrderId || '').replace(/[^\w.-]/g, '').slice(0, 80),
      visitorId: cleanVisitorId,
      ip: clientIp,
    };

    try {
      await insertOrder(order);
    } catch (error) {
      if (isDuplicateBlock(error)) {
        return NextResponse.json(
          { success: false, error: ORDER_ALREADY_RECORDED },
          { status: 409 }
        );
      }
      throw error;
    }

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
    if (isDuplicateBlock(error)) {
      return NextResponse.json(
        { success: false, error: ORDER_ALREADY_RECORDED },
        { status: 409 }
      );
    }
    console.error('[orders] POST failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function isDuplicateBlock(error: unknown): boolean {
  if (error instanceof DuplicateOrderError) return true;
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'DuplicateOrderError' ||
    error.message === ORDER_ALREADY_RECORDED ||
    /idx_orders_phone_product_active|duplicate key|unique constraint/i.test(error.message)
  );
}

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    const orders = await listOrders();
    return NextResponse.json(
      { success: true, orders, total: orders.length },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[orders] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500, headers: NO_STORE }
    );
  }
}

const STATUSES = [
  'Nouveau',
  'Validé',
  'Confirmé', // legacy alias — kept so old rows still update
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
