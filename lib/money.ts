/** أرقام فرنسية + ريال قصير */

export function toFrenchDigits(value: number | string) {
  return String(value).replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatSar(amount: number) {
  const rounded = Math.round(Number(amount) || 0);
  return `${toFrenchDigits(rounded)} ريال`;
}

export function formatSarHtml(amount: number) {
  const rounded = Math.round(Number(amount) || 0);
  return `<span lang="fr" dir="ltr" class="latin-nums">${toFrenchDigits(rounded)}</span> ريال`;
}

export function toArabicDigits(value: number | string) {
  return toFrenchDigits(value);
}
