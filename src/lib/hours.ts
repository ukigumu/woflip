/**
 * Cálculo puro de horas a partir de tramos.
 * Regla compartida con el motor: un tramo con end <= start cruza la medianoche.
 */

import { monthOf, mondayOf } from './dates';
import type { Assignment, HHMM, Interval, ISODate, ShiftType } from './types';

export function timeToMinutes(t: HHMM): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Duración de un tramo en minutos (maneja cruce de medianoche). */
export function intervalMinutes(iv: Interval): number {
  const start = timeToMinutes(iv.start);
  let end = timeToMinutes(iv.end);
  if (end <= start) end += 24 * 60;
  return end - start;
}

export function intervalsTotalMinutes(intervals: Interval[]): number {
  return intervals.reduce((sum, iv) => sum + intervalMinutes(iv), 0);
}

/** Tramos efectivos de un día: el override del día prevalece sobre el tipo. */
export function effectiveIntervals(
  assignment: Assignment,
  typesById: Record<string, ShiftType>,
): Interval[] {
  if (assignment.overrideIntervals) return assignment.overrideIntervals;
  return typesById[assignment.shiftTypeId]?.intervals ?? [];
}

/** Horas (con 1 decimal) de las asignaciones cuyo mes es `yearMonth` ('YYYY-MM'). */
export function monthHours(
  assignments: Assignment[],
  typesById: Record<string, ShiftType>,
  yearMonth: string,
): number {
  const minutes = assignments
    .filter((a) => monthOf(a.date) === yearMonth)
    .reduce((sum, a) => sum + intervalsTotalMinutes(effectiveIntervals(a, typesById)), 0);
  return Math.round((minutes / 60) * 10) / 10;
}

/** '08:00–16:00' o '12:00–16:00 · 20:00–24:00' (partido). '' si no hay tramos. */
export function formatIntervals(intervals: Interval[]): string {
  return intervals.map((iv) => `${iv.start}–${iv.end}`).join(' · ');
}

/** Horas de la semana que empieza en `monday`. */
export function weekHours(
  assignments: Assignment[],
  typesById: Record<string, ShiftType>,
  monday: ISODate,
): number {
  const minutes = assignments
    .filter((a) => mondayOf(a.date) === monday)
    .reduce((sum, a) => sum + intervalsTotalMinutes(effectiveIntervals(a, typesById)), 0);
  return Math.round((minutes / 60) * 10) / 10;
}
