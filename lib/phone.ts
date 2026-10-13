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

/**
 * Fake / troll numbers kids type for fun: 0512121212, 0500000000, 0512345678…
 * Reject at checkout so they never become real orders.
 */
export function isSpamPhonePattern(phone: string): boolean {
  const p = normalizePhone(phone);
  if (!/^05\d{8}$/.test(p)) return false;
  const body = p.slice(2);

  // 00000000 / 11111111 / …
  if (/^(\d)\1{7}$/.test(body)) return true;
  // 12121212 / 01010101 / …
  if (/^(\d{2})\1{3}$/.test(body)) return true;
  // 12341234 / 55505550-style doubles
  if (/^(\d{4})\1$/.test(body)) return true;
  // Obvious sequences
  if (
    body === '01234567' ||
    body === '12345678' ||
    body === '23456789' ||
    body === '98765432' ||
    body === '87654321' ||
    body === '76543210'
  ) {
    return true;
  }
  // Only 1–2 distinct digits in the whole number body
  if (new Set(body).size <= 2) return true;

  return false;
}

export function isValidOrderPhone(phone: string): boolean {
  const p = normalizePhone(phone);
  return /^05\d{8}$/.test(p) && !isSpamPhonePattern(p);
}

/** Digits typed after the locked 05 (0–8 expected for a complete SA mobile). */
export function phoneBodyLen(phone: string): number {
  const p = normalizePhone(phone);
  if (!p.startsWith('05')) return 0;
  return Math.max(0, p.length - 2);
}

/**
 * Troll / incomplete: only 0–2 digits after 05 (of the 8 required),
 * or a full fake pattern like 0512121212 → ban their IP.
 */
export function shouldBanIpForBadPhone(phone: string): boolean {
  const p = normalizePhone(phone);
  if (!p.startsWith('05')) return false;
  const bodyLen = phoneBodyLen(p);
  if (bodyLen >= 0 && bodyLen <= 2) return true;
  if (isSpamPhonePattern(p)) return true;
  return false;
}

export const PHONE_FAKE_MSG = 'الرقم غير صالح. يرجى إدخال رقم جوال حقيقي.';

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
