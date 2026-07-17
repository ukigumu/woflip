/**
 * Utilidades puras de fechas. La semana empieza en LUNES (convención Woblip).
 * Sin dependencias ni Intl: formateo es-ES con tablas propias (determinista).
 */

import type { ISODate } from './types';

const WEEKDAYS_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
const WEEKDAYS_LONG = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;
const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Medianoche local (evita el desfase UTC de `new Date('YYYY-MM-DD')`). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDaysISO(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Índice de día de semana con lunes = 0. */
export function weekdayIndex(iso: ISODate): number {
  return (parseISODate(iso).getDay() + 6) % 7;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function mondayOf(iso: ISODate): ISODate {
  return addDaysISO(iso, -weekdayIndex(iso));
}

/** Los 7 días de la semana que empieza en `monday`. */
export function weekDates(monday: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
}

/** Días de diferencia (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86400000);
}

/** 'YYYY-MM' del mes de la fecha. */
export function monthOf(iso: ISODate): string {
  return iso.slice(0, 7);
}

/** 'lun 12' */
export function formatDayShort(iso: ISODate): string {
  return `${WEEKDAYS_SHORT[weekdayIndex(iso)]} ${parseISODate(iso).getDate()}`;
}

/** 'sábado 20 de julio' */
export function formatDayLong(iso: ISODate): string {
  const d = parseISODate(iso);
  const month = MONTHS_SHORT[d.getMonth()];
  const monthLong: Record<string, string> = {
    ene: 'enero',
    feb: 'febrero',
    mar: 'marzo',
    abr: 'abril',
    may: 'mayo',
    jun: 'junio',
    jul: 'julio',
    ago: 'agosto',
    sep: 'septiembre',
    oct: 'octubre',
    nov: 'noviembre',
    dic: 'diciembre',
  };
  return `${WEEKDAYS_LONG[weekdayIndex(iso)]} ${d.getDate()} de ${monthLong[month]}`;
}

/** '12–18 may' o '28 abr – 4 may' si la semana cruza de mes. */
export function formatWeekRange(monday: ISODate): string {
  const sunday = addDaysISO(monday, 6);
  const a = parseISODate(monday);
  const b = parseISODate(sunday);
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[a.getMonth()]}`;
  }
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
}
