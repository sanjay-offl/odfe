// Centralized formatting utilities. Currency/locale are configurable at runtime via
// configureMoney() (driven by cafe Settings) and default to INR for this cafe.

let CURRENCY = 'INR';
let LOCALE = 'en-IN';

export function configureMoney(currency: string, locale: string) {
  CURRENCY = currency || 'INR';
  LOCALE = locale || 'en-IN';
}

export function getCurrency() {
  return CURRENCY;
}

/** Formats a number as currency using the configured currency + locale. */
export function money(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${CURRENCY} ${amount.toFixed(2)}`;
  }
}

/** Compact currency for chart axes / tight cards (e.g. ₹1.2k). */
export function moneyShort(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `${getCurrencySymbol()}${k.toFixed(k >= 100 ? 0 : 1)}k`;
  }
  return money(value);
}

export function getCurrencySymbol(): string {
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? CURRENCY;
  } catch {
    return CURRENCY;
  }
}

export function number(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function percent(value: number, digits = 0): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat(LOCALE, opts).format(new Date(iso));
}

export function formatTime(iso: string | Date) {
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date) {
  return `${formatDate(iso, { day: '2-digit', month: 'short' })} · ${formatTime(iso)}`;
}

/** Human readable duration from a past timestamp. */
export function elapsed(fromIso: string, now: number = Date.now()): string {
  const ms = Math.max(0, now - new Date(fromIso).getTime());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const delta = now - new Date(iso).getTime();
  if (Math.abs(delta) < 60000) return 'just now';
  const mins = Math.round(delta / 60000);
  if (Math.abs(mins) < 60) return mins > 0 ? `${mins}m ago` : `in ${-mins}m`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return hrs > 0 ? `${hrs}h ago` : `in ${-hrs}h`;
  const days = Math.round(hrs / 24);
  return days > 0 ? `${days}d ago` : `in ${-days}d`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Readable foreground for a hex background. */
export function readableText(hex: string): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const luminance = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return luminance > 155 ? '#2b1b14' : '#ffffff';
}

export function toDateInput(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
