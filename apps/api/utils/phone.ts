/**
 * Phone number normalization utilities
 * Ensures Saudi numbers are stored in E.164 format: +966xxxxxxxxx (12 chars total)
 */

/**
 * Normalize Saudi phone number to E.164 format: +966xxxxxxxxx
 * Handles: 05xxxxxxxx, 9665xxxxxxxx, +966501234567, 501234567, etc.
 * Saudi mobile: 9 digits starting with 5 (e.g. 50, 53, 54, 55, 56, 58, 59)
 */
export function normalizeSaudiPhone(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.trim().replace(/\D/g, '');
  if (digits.length < 9) return value.trim();
  if (digits.startsWith('966') && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith('966') && digits.length >= 9) return `+966${digits.slice(3, 12)}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+966${digits.slice(1, 10)}`;
  if (digits.length === 9) return `+966${digits}`;
  if (digits.length > 9) return `+966${digits.slice(-9)}`;
  return value.trim();
}
