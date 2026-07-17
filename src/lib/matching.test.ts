import {
  findSwapCandidates,
  type MatchInput,
  restBetweenDays,
} from './matching';
import { buildSeedAssignments, defaultShiftTypes, ME_ID } from './seed';
import { addDaysISO, mondayOf, weekdayIndex } from './dates';
import type { Assignment } from './types';

const TYPES = defaultShiftTypes();

/** Crea un assignment de test. */
function mk(memberId: string, date: string, type: 'M' | 'T' | 'P' | 'L'): Assignment {
  const typeId = { M: 'st-m', T: 'st-t', P: 'st-p', L: 'st-l' }[type];
  return { id: `${memberId}:${date}`, memberId, date, shiftTypeId: typeId };
}

/** Input base: hoy es miércoles 2026-07-01; fechas de test en la semana siguiente. */
function baseInput(overrides: Partial<MatchInput>): MatchInput {
  return {
    requesterId: 'me',
    requesterAssignment: mk('me', '2026-07-06', 'M'),
    mode: 'rest_day',
    today: '2026-07-01',
    assignments: [],
    shiftTypes: TYPES,
    memberIds: ['bea'],
    ...overrides,
  };
}

describe('restBetweenDays', () => {
  test('T (16–24) seguido de M (08–16) da 8 h: viola las 12 h', () => {
    const rest = restBetweenDays([{ start: '16:00', end: '24:00' }], [{ start: '08:00', end: '16:00' }]);
    expect(rest).toBe(480);
  });

  test('caso 10 — el tramo que cruza medianoche (22–06) reduce el descanso', () => {
    // Sale a las 06:00 y entra a las 10:00 del mismo día: solo 4 h de descanso.
    const rest = restBetweenDays([{ start: '22:00', end: '06:00' }], [{ start: '10:00', end: '18:00' }]);
    expect(rest).toBe(240);
  });

  test('día sin trabajo a un lado ⇒ sin restricción (Infinity)', () => {
    expect(restBetweenDays([], [{ start: '08:00', end: '16:00' }])).toBe(Infinity);
  });
});

describe('findSwapCandidates — días cruzados (rest_day)', () => {
  test('caso 1 — feliz: Bea libra mi día y trabaja un día que yo libro', () => {
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'), // lunes: mi turno a ceder
        mk('me', '2026-07-09', 'L'), // jueves: yo libro
        mk('bea', '2026-07-06', 'L'), // Bea libra el lunes
        mk('bea', '2026-07-09', 'T'), // y trabaja el jueves
      ],
    });
    const candidates = findSwapCandidates(input);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      memberId: 'bea',
      kind: 'cross_day_rest_swap',
      theirDate: '2026-07-09',
    });
  });

  test('caso 2 — sin L explícita (celda vacía) el día objetivo ⇒ excluido', () => {
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        // Bea NO tiene celda el lunes (sin dato ≠ libra)
        mk('bea', '2026-07-09', 'T'),
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });

  test('caso 3 — descanso de 12 h violado tras el intercambio ⇒ excluido', () => {
    // Bea saldría de T (hasta 24:00) el domingo y entraría a mi M (08:00) el lunes: 8 h.
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        mk('bea', '2026-07-05', 'T'), // domingo T hasta 24:00
        mk('bea', '2026-07-06', 'L'),
        mk('bea', '2026-07-09', 'T'),
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });

  test('caso 4 — el intercambio dejaría a Bea con 7 días seguidos ⇒ excluido', () => {
    // Bea encadena 6 días (mar 30 jun – dom 5 jul) y libra el lunes 6.
    // Si coge mi lunes 6, el lunes puentea la racha: 7 días seguidos.
    const bea6days = ['2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']
      .map((d) => mk('bea', d, 'M'));
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        mk('bea', '2026-07-06', 'L'),
        mk('bea', '2026-07-09', 'T'),
        ...bea6days,
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });

  test('caso 5 — el partido (P) usa su último tramo para el descanso', () => {
    // Bea sale del P a las 24:00 (tramo 20–24) y entraría a M a las 08:00: 8 h ⇒ excluido.
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        mk('bea', '2026-07-05', 'P'), // domingo partido, segundo tramo hasta 24:00
        mk('bea', '2026-07-06', 'L'),
        mk('bea', '2026-07-09', 'T'),
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });

  test('caso 6 — el override del día prevalece sobre el tipo', () => {
    // Igual que el caso 3, pero el domingo de Bea tiene override que acaba a las 18:00:
    // descanso 08:00 lunes − 18:00 domingo = 14 h ⇒ ahora SÍ es candidata.
    const beaSunday = { ...mk('bea', '2026-07-05', 'T'), overrideIntervals: [{ start: '10:00', end: '18:00' }] };
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        beaSunday,
        mk('bea', '2026-07-06', 'L'),
        mk('bea', '2026-07-09', 'T'),
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(1);
  });

  test('caso 8 — turno en el pasado ⇒ 0 candidatos', () => {
    const input = baseInput({
      requesterAssignment: mk('me', '2026-06-29', 'M'),
      assignments: [
        mk('me', '2026-06-29', 'M'),
        mk('me', '2026-07-02', 'L'),
        mk('bea', '2026-06-29', 'L'),
        mk('bea', '2026-07-02', 'T'),
      ],
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });

  test('caso 9 — turno comprometido en otra oferta/petición activa ⇒ excluido', () => {
    const input = baseInput({
      assignments: [
        mk('me', '2026-07-06', 'M'),
        mk('me', '2026-07-09', 'L'),
        mk('bea', '2026-07-06', 'L'),
        mk('bea', '2026-07-09', 'T'),
      ],
      busyAssignmentIds: new Set(['bea:2026-07-09']),
    });
    expect(findSwapCandidates(input)).toHaveLength(0);
  });
});

describe('findSwapCandidates — mismo día (change_slot)', () => {
  test('caso 7 — franja distinta sí; franja igual no', () => {
    const differentSlot = baseInput({
      mode: 'change_slot',
      assignments: [mk('me', '2026-07-06', 'M'), mk('bea', '2026-07-06', 'T')],
    });
    expect(findSwapCandidates(differentSlot)).toHaveLength(1);
    expect(findSwapCandidates(differentSlot)[0].kind).toBe('same_day_different_slot');

    const sameSlotInput = baseInput({
      mode: 'change_slot',
      assignments: [mk('me', '2026-07-06', 'M'), mk('bea', '2026-07-06', 'M')],
    });
    expect(findSwapCandidates(sameSlotInput)).toHaveLength(0);
  });
});

describe('caso 11 — garantía de candidatos sobre el seed real', () => {
  test('cada día laborable mío de la semana próxima tiene ≥1 candidato', () => {
    const today = '2026-07-15'; // miércoles (fecha fija: seed determinista)
    const assignments = buildSeedAssignments(today);
    const memberIds = ['lucia', 'marco', 'aisha', 'pablo', 'vera', 'iker'];
    const nextMonday = addDaysISO(mondayOf(today), 7);

    const myNextWeekWork = assignments.filter(
      (a) =>
        a.memberId === ME_ID &&
        a.date >= nextMonday &&
        a.date <= addDaysISO(nextMonday, 6) &&
        a.shiftTypeId !== 'st-l',
    );
    expect(myNextWeekWork.length).toBeGreaterThan(0);

    for (const myShift of myNextWeekWork) {
      const candidates = findSwapCandidates({
        requesterId: ME_ID,
        requesterAssignment: myShift,
        mode: 'rest_day',
        today,
        assignments,
        shiftTypes: TYPES,
        memberIds,
      });
      // El día de semana ayuda a diagnosticar si algún patrón del seed falla.
      expect({ weekday: weekdayIndex(myShift.date), count: candidates.length }).toEqual({
        weekday: weekdayIndex(myShift.date),
        count: expect.any(Number),
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
    }
  });
});
