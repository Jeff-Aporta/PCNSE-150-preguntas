/** Transporte César para contraseñas en login (mismo criterio que langlab / Swagger). */
export const CAESAR_PREFIX = "abc123";
export const CAESAR_SUFFIX = "xyz987";

export function caesarShiftForDate(date = new Date()) {
  return date.getUTCDate();
}

function mod26(n) {
  return ((n % 26) + 26) % 26;
}

function shiftChar(c, delta) {
  const code = c.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(mod26(code - 65 + delta) + 65);
  if (code >= 97 && code <= 122) return String.fromCharCode(mod26(code - 97 + delta) + 97);
  return c;
}

function caesarEncode(plain, shift) {
  return [...plain].map((c) => shiftChar(c, shift)).join("");
}

export function wrapPassword(plain) {
  if (!plain) return plain;
  return caesarEncode(CAESAR_PREFIX + plain + CAESAR_SUFFIX, caesarShiftForDate(new Date()));
}

window.ISAFront = window.ISAFront || {};
window.ISAFront.Caesar = { wrapPassword, CAESAR_PREFIX, CAESAR_SUFFIX };
