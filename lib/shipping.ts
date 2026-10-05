/** رسوم التوصيل الثابتة (إن لم يكن التوصيل مشمولاً في سعر العرض) */
export const SHIPPING_FEE_SAR = 20;

export function shippingFeeForOrder(shippingIncluded?: boolean) {
  return shippingIncluded ? 0 : SHIPPING_FEE_SAR;
}

export function orderTotalWithShipping(subtotal: number, shippingIncluded?: boolean) {
  const base = Math.round(Number(subtotal) || 0);
  return base + shippingFeeForOrder(shippingIncluded);
}
