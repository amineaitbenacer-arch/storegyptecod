/** Saudi mobile numbers: locked 05 prefix, exactly 8 more digits. */

const DRAFT_MAX = 15;

function toAsciiDigits(value: string): string {
  return String(value || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

function digitsOnly(value: string): string {
  return toAsciiDigits(value).replace(/\D/g, '');
}

/** Canonical digits. Extra digits are kept so an over-long number stays invalid. */
export function normalizePhone(phone: string): string {
  let digits = digitsOnly(phone);
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);

  if (digits.startsWith('5')) digits = `0${digits}`;
  return digits;
}

export function isValidOrderPhone(phone: string): boolean {
  return /^05\d{8}$/.test(normalizePhone(phone));
}

/**
 * Checkout draft. Always starts with 05.
 * Digits past 10 are kept (up to 15) so the form can show the red warning.
 */
export function draftSaPhone(raw: string): string {
  let digits = digitsOnly(raw);

  if (digits.startsWith('00966')) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith('966')) {
    const rest = digits.slice(3);
    digits = rest.startsWith('0') ? rest : `0${rest}`;
  }

  if (!digits.startsWith('05')) {
    if (digits.startsWith('5')) digits = `0${digits}`;
    else digits = `05${digits.replace(/^0+/, '')}`;
  }

  if (digits.length < 2) return '05';
  return digits.slice(0, DRAFT_MAX);
}

/** Tail typed after the locked 05. A pasted full number is recognized once. */
export function draftFromPhoneTail(tail: string): string {
  const digits = digitsOnly(tail);
  const pastedFull =
    digits.startsWith('00966') ||
    digits.startsWith('966') ||
    digits.startsWith('05') ||
    (digits.startsWith('5') && digits.length === 9);
  return draftSaPhone(pastedFull ? digits : `05${digits}`);
}

export const PHONE_TOO_LONG_MSG = 'يرجى تعديل رقم الجوال ليكون 10 أرقام فقط.';
export const PHONE_INCOMPLETE_MSG = 'يرجى إدخال رقم الجوال كاملًا، من 10 أرقام تبدأ بـ 05.';
