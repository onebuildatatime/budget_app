import { getDaysInMonth, parseMonthId } from '../../budgetModel';
import type { TripDates } from './books';
import { deviceLocale } from './locale';

const DAY = 24 * 60 * 60 * 1000;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const isoForDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString();

export const sameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

export const daysBetween = (a: Date, b: Date) =>
  Math.round((fromDateKey(toDateKey(b)).getTime() - fromDateKey(toDateKey(a)).getTime()) / DAY);

/** The date span a budget period covers: a calendar month, or a trip's dates. */
export type Period = { start: Date; end: Date };

export function monthPeriod(monthId: string): Period {
  const first = parseMonthId(monthId);
  return {
    start: new Date(first.getFullYear(), first.getMonth(), 1, 12),
    end: new Date(first.getFullYear(), first.getMonth(), getDaysInMonth(monthId), 12),
  };
}

export const tripPeriod = (trip: TripDates): Period => ({ start: fromDateKey(trip.start), end: fromDateKey(trip.end) });

export const clampToPeriod = (d: Date, p: Period) =>
  d < p.start ? p.start : d > p.end ? p.end : d;

/** Days remaining including today, or null if today is outside the period. */
export function daysLeftInPeriod(p: Period, today = new Date()): number | null {
  const t = fromDateKey(toDateKey(today));
  if (t < p.start || t > p.end) return null;
  return daysBetween(t, p.end) + 1;
}

export function formatTripRange(trip: TripDates, locale = deviceLocale) {
  const start = fromDateKey(trip.start);
  const end = fromDateKey(trip.end);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endLabel = end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export const tripLength = (trip: TripDates) => daysBetween(fromDateKey(trip.start), fromDateKey(trip.end)) + 1;
