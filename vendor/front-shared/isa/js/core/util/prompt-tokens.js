/** Estimación de tokens de prompt (~4 caracteres/token). Misma heurística que langlab turnLog. */
export function estimatePromptTokens(text) {
  const s = String(text ?? "");
  if (!s.trim()) return 0;
  return Math.ceil(s.length / 4);
}
