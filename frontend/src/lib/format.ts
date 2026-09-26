const MAX_LENGTH = 16

/**
 * Formats a number for display: rounds to 12 significant digits to hide
 * floating point noise (0.1 + 0.2 → "0.3") and falls back to exponential
 * notation when the plain representation is longer than 16 characters.
 */
export function formatNumber (n: number): string {
  const plain = String(parseFloat(n.toPrecision(12)))
  if (plain.length <= MAX_LENGTH) return plain
  return n.toExponential(8).replace(/\.?0+e/, 'e')
}
