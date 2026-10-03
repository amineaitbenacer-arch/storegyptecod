/** Normalize Maghreb / KSA phones including Arabic-Indic digits. */

function toAsciiDigits(value: string): string {
  return String(value || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

export function normalizePhone(phone: string): string {
  let digits = toAsciiDigits(phone).replace(/\D/g, '');
  if (digits.startsWith('212') && digits.length >= 12) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.startsWith('966') && digits.length >= 12) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

export function isValidOrderPhone(phone: string): boolean {
  return /^\d{10}$/.test(normalizePhone(phone));
}
