import { effectiveIntervals, intervalMinutes, intervalsTotalMinutes, monthHours } from './hours';
import { defaultShiftTypes } from './seed';
import type { Assignment, ShiftType } from './types';

const typesById: Record<string, ShiftType> = Object.fromEntries(
  defaultShiftTypes().map((t) => [t.id, t]),
);

describe('hours', () => {
  test('intervalMinutes maneja el cruce de medianoche', () => {
    expect(intervalMinutes({ start: '08:00', end: '16:00' })).toBe(480);
    expect(intervalMinutes({ start: '22:00', end: '06:00' })).toBe(480); // cruza
    expect(intervalMinutes({ start: '16:00', end: '24:00' })).toBe(480);
  });

  test('el partido suma sus dos tramos', () => {
    const partido = typesById['st-p'];
    expect(intervalsTotalMinutes(partido.intervals)).toBe(480); // 4h + 4h
  });

  test('effectiveIntervals: el override del día prevalece sobre el tipo', () => {
    const a: Assignment = {
      id: 'me:2026-07-17',
      memberId: 'me',
      date: '2026-07-17',
      shiftTypeId: 'st-m',
      overrideIntervals: [{ start: '09:00', end: '13:00' }],
    };
    expect(intervalsTotalMinutes(effectiveIntervals(a, typesById))).toBe(240);
    delete a.overrideIntervals;
    expect(intervalsTotalMinutes(effectiveIntervals(a, typesById))).toBe(480);
  });

  test('monthHours suma solo el mes pedido y el descanso cuenta 0', () => {
    const mk = (date: string, type: string): Assignment => ({
      id: `me:${date}`,
      memberId: 'me',
      date,
      shiftTypeId: type,
    });
    const assignments = [
      mk('2026-07-01', 'st-m'), // 8 h
      mk('2026-07-02', 'st-p'), // 8 h
      mk('2026-07-03', 'st-l'), // libre: 0 h
      mk('2026-08-01', 'st-m'), // otro mes: fuera
    ];
    expect(monthHours(assignments, typesById, '2026-07')).toBe(16);
  });
});
