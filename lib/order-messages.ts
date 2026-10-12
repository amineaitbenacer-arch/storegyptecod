/**
 * Site-wide COD order messaging (all products / future montages).
 * Soft block copy shown under the phone when the same number reorders the same product.
 * No Node/fs imports — safe for client components.
 */

export const ORDER_ALREADY_RECORDED = 'ORDER_ALREADY_RECORDED';

export const ORDER_ALREADY_RECORDED_MSG =
  'تم تسجيل طلبكم بنجاح، وسنتواصل معكم قريباً. طلبكم مؤكد بنسبة ١٠٠٪.';

export class DuplicateOrderError extends Error {
  constructor() {
    super(ORDER_ALREADY_RECORDED);
    this.name = 'DuplicateOrderError';
  }
}
