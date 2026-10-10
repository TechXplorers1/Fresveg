/**
 * Recursively sanitizes payload objects removing undefined values.
 * @param {any} obj
 * @returns {any}
 */
export function sanitizePayload(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      sanitized[key] = sanitizePayload(obj[key]);
    }
  }
  return sanitized;
}

/**
 * Returns a URL-friendly slug from farm name or id.
 * @param {object} farm
 * @returns {string}
 */
export function getFarmSlug(farm) {
  if (!farm) return '';
  if (!farm.farmName) return farm.id || '';
  const cleanName = farm.farmName
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return cleanName || farm.id || 'farm';
}

/**
 * Formats ISO timestamp string into a human-readable format.
 * @param {string} isoString
 * @returns {string|null}
 */
export const formatUpdatedTime = (isoString) => {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return null;
  }
};
