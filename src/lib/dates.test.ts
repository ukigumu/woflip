import {
  addDaysISO,
  diffDays,
  formatDayShort,
  formatRange,
  formatWeekRange,
  mondayOf,
  monthOf,
  parseISODate,
  toISODate,
  weekdayIndex,
  weekDates,
} from './dates';

describe('dates', () => {
  test('toISODate/parseISODate son inversas en hora local', () => {
    expect(toISODate(parseISODate('2026-07-17'))).toBe('2026-07-17');
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('weekdayIndex: lunes = 0, domingo = 6', () => {
    expect(weekdayIndex('2026-07-13')).toBe(0); // lunes
    expect(weekdayIndex('2026-07-17')).toBe(4); // viernes
    expect(weekdayIndex('2026-07-19')).toBe(6); // domingo
  });

  test('mondayOf devuelve el lunes de la semana, incluso en domingo', () => {
    expect(mondayOf('2026-07-17')).toBe('2026-07-13');
    expect(mondayOf('2026-07-19')).toBe('2026-07-13'); // domingo → lunes anterior
    expect(mondayOf('2026-07-13')).toBe('2026-07-13'); // el propio lunes
  });

  test('addDaysISO cruza mes y año', () => {
    expect(addDaysISO('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDaysISO('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDaysISO('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('weekDates devuelve 7 días consecutivos desde el lunes', () => {
    const days = weekDates('2026-07-13');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-07-13');
    expect(days[6]).toBe('2026-07-19');
  });

  test('diffDays y monthOf', () => {
    expect(diffDays('2026-07-13', '2026-07-20')).toBe(7);
    expect(diffDays('2026-07-20', '2026-07-13')).toBe(-7);
    expect(monthOf('2026-07-17')).toBe('2026-07');
  });

  test('formato es-ES', () => {
    expect(formatDayShort('2026-07-17')).toBe('vie 17');
    expect(formatWeekRange('2026-07-13')).toBe('13–19 jul');
    expect(formatWeekRange('2026-07-27')).toBe('27 jul – 2 ago'); // cruza mes
  });

  test('formatRange con rango arbitrario', () => {
    expect(formatRange('2026-07-19', '2026-08-01')).toBe('19 jul – 1 ago'); // 14 días, cruza mes
    expect(formatRange('2026-07-06', '2026-07-19')).toBe('6–19 jul'); // mismo mes
  });
});
