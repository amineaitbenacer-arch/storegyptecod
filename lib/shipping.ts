/** رسوم التوصيل ثابتة — تُحسب دائماً مع مجموع الدفع عند الاستلام */
export const SHIPPING_FEE_SAR = 20;

export function orderTotalWithShipping(subtotal: number) {
  const base = Math.round(Number(subtotal) || 0);
  return base + SHIPPING_FEE_SAR;
}
