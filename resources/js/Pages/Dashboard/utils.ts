export function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(amount);
}

/**
 * Format a date value (Excel serial number, ISO string, etc.) to Philippine standard MM/DD/YYYY format.
 * Returns '—' for empty, null, or placeholder values.
 */
export function formatDisplayDate(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const str = String(val).trim();
  if (!str || str === '—' || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a') return '—';

  // Check if it's an Excel numeric serial date (e.g. 43207, 43900)
  const num = Number(str);
  if (!isNaN(num) && num >= 1 && num <= 100000 && !str.includes('-') && !str.includes('/')) {
    const day = Math.floor(num);
    const date = new Date(Math.round((day - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      const y = date.getUTCFullYear();
      return `${m}/${d}/${y}`;
    }
  }

  // ISO format YYYY-MM-DD or YYYY-M-D
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  }

  // Already MM/DD/YYYY or M/D/YYYY
  const mdyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  }

  return str;
}





