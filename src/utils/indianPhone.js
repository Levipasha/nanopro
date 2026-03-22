/** India mobile: fixed +91 prefix, 10-digit national number in UI. */

export function getINDisplayDigits(stored) {
  let d = String(stored ?? "").replace(/\D/g, "");
  if (d.startsWith("91")) d = d.slice(2);
  return d.slice(0, 10);
}

/** @param {string} digits0to10 — up to 10 digits */
export function toINFullPhone(digits0to10) {
  const d = String(digits0to10 ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  return d.length ? `+91${d}` : "";
}

/** WhatsApp field may store wa.me URL or a phone string */
export function getINDisplayDigitsFromWhatsAppStored(stored) {
  if (!stored) return "";
  const s = String(stored);
  const m = s.match(/wa\.me\/(\d+)/i);
  if (m) return getINDisplayDigits(m[1]);
  return getINDisplayDigits(s);
}

export function toWhatsAppUrlFromINPhone(fullINPhone) {
  const d = String(fullINPhone ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return `https://wa.me/${d}`;
  if (d.length === 10) return `https://wa.me/91${d}`;
  return "";
}

/** Optional pre-filled message for wa.me */
export function buildWhatsAppUrlFromFullINPhone(fullINPhone, optMsg) {
  const base = toWhatsAppUrlFromINPhone(fullINPhone);
  if (!base) return "";
  return optMsg ? `${base}?text=${encodeURIComponent(String(optMsg))}` : base;
}
