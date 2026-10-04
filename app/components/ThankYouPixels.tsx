'use client';

import { useEffect } from 'react';
import { readLastOrder } from '../../lib/last-order';
import { trackThankYouPixels } from '../../lib/pixels';

type Props = {
  orderId?: string;
  price?: string | number;
  offer?: string;
};

function orderPayload(orderId?: string, price?: string | number, offer?: string) {
  const data = readLastOrder() || {};
  const params = new URLSearchParams(window.location.search);
  const id = String(orderId || data.orderId || data.serverOrderId || params.get('oid') || '')
    .replace(/^#/, '')
    .trim();
  const value = Number(price ?? data.price);
  const productId = String(data.productId || '').trim();
  return {
    value: Number.isFinite(value) && value > 0 ? value : undefined,
    currency: 'SAR',
    content_type: 'product',
    content_id: productId || undefined,
    content_ids: productId ? [productId] : undefined,
    content_name: String(offer || data.offerName || data.offer || '').trim() || undefined,
    num_items: Number(data.pieces) || 1,
    transaction_id: id && id !== '----' ? id : undefined,
  };
}

export default function ThankYouPixels({ orderId, price, offer }: Props) {
  useEffect(() => {
    const fire = () => trackThankYouPixels(orderPayload(orderId, price, offer));
    const start = window.setTimeout(fire, 400);
    const again = window.setTimeout(fire, 1200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(again);
    };
  }, [orderId, price, offer]);

  return null;
}
