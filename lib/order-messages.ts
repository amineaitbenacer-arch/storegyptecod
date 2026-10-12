/** Client-safe order messaging — no Node/fs imports. */

export const ORDER_ALREADY_RECORDED = 'ORDER_ALREADY_RECORDED';

export const ORDER_ALREADY_RECORDED_MSG =
  'تم تسجيل طلبكم بنجاح، وسنتواصل معكم قريباً. طلبكم مؤكد بنسبة ١٠٠٪.';

export class DuplicateOrderError extends Error {
  constructor() {
    super(ORDER_ALREADY_RECORDED);
    this.name = 'DuplicateOrderError';
  }
}
