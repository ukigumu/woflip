/**
 * Seed local determinista (sin Math.random): yo + 6 compañeros con patrones
 * semanales fijos, diseñados para que el matching SIEMPRE tenga candidatos:
 * cada día laborable mío hay alguien que libra ese día y trabaja un día
 * en que yo libro (pares L↔trabajo cruzados).
 */

import { ShiftPalette } from '@/constants/palette';
import { addDaysISO, mondayOf } from './dates';
import type { Assignment, Group, Member, ShiftType, SwapOffer, ISODate } from './types';

export const SEED_VERSION = 3; // v3: re-siembra con la paleta nueva (colores de turno)

export const ME_ID = 'me';

export function defaultShiftTypes(): ShiftType[] {
  return [
    {
      id: 'st-m',
      code: 'M',
      label: 'Mañana',
      kind: 'work',
      intervals: [{ start: '08:00', end: '16:00' }],
      color: ShiftPalette.M.bg,
      sortOrder: 0,
    },
    {
      id: 'st-t',
      code: 'T',
      label: 'Tarde',
      kind: 'work',
      intervals: [{ start: '16:00', end: '24:00' }],
      color: ShiftPalette.T.bg,
      sortOrder: 1,
    },
    {
      id: 'st-p',
      code: 'P',
      label: 'Partido',
      kind: 'work',
      intervals: [
        { start: '12:00', end: '16:00' },
        { start: '20:00', end: '24:00' },
      ],
      color: ShiftPalette.P.bg,
      sortOrder: 2,
    },
    {
      id: 'st-l',
      code: 'L',
      label: 'Libre',
      kind: 'rest',
      intervals: [],
      color: ShiftPalette.L.bg,
      sortOrder: 3,
    },
  ];
}

export function buildSeedMembers(): Member[] {
  return [
    { id: ME_ID, name: 'Yo', isMe: true, shareFullSchedule: false },
    { id: 'lucia', name: 'Lucía', isMe: false, shareFullSchedule: true },
    { id: 'marco', name: 'Marco', isMe: false, shareFullSchedule: false },
    { id: 'aisha', name: 'Aisha', isMe: false, shareFullSchedule: false },
    { id: 'pablo', name: 'Pablo', isMe: false, shareFullSchedule: true },
    { id: 'vera', name: 'Vera', isMe: false, shareFullSchedule: false },
    { id: 'iker', name: 'Iker', isMe: false, shareFullSchedule: false },
  ];
}

export function buildSeedGroup(): Group {
  return {
    id: 'group-1',
    name: 'Mi equipo',
    memberIds: buildSeedMembers().map((m) => m.id),
  };
}

type Code = 'M' | 'T' | 'P' | 'L';

/**
 * Patrones semanales (lun..dom) por miembro. Diseño de cobertura:
 * - Cada día laborable de "yo" (lun–vie) hay ≥1 compañero con L ese día
 *   que trabaja en sáb/dom (mis días L) → candidato cruzado garantizado
 *   (lun→Aisha, mar→Vera, mié→Marco, jue→Pablo, vie→Lucía).
 * - Ningún patrón base viola el descanso de 12 h: nunca un turno que acaba
 *   a las 24:00 (T/P) va seguido de una M a las 08:00, tampoco al cruzar
 *   de domingo a lunes.
 * - Cada día hay gente trabajando y gente librando (para "hoy").
 */
const WEEK_PATTERNS: Record<string, Code[]> = {
  me: ['M', 'M', 'T', 'T', 'P', 'L', 'L'],
  lucia: ['M', 'M', 'T', 'T', 'L', 'T', 'L'],
  marco: ['T', 'T', 'L', 'T', 'T', 'P', 'L'],
  aisha: ['L', 'M', 'M', 'M', 'T', 'T', 'L'],
  pablo: ['T', 'L', 'P', 'L', 'P', 'T', 'T'],
  vera: ['M', 'L', 'T', 'T', 'P', 'L', 'M'],
  iker: ['T', 'T', 'T', 'P', 'L', 'M', 'T'],
};

const CODE_TO_TYPE: Record<Code, string> = {
  M: 'st-m',
  T: 'st-t',
  P: 'st-p',
  L: 'st-l',
};

/** Rango de semanas sembradas por miembro, relativo a la semana actual. */
const WEEK_RANGE: Record<string, [from: number, to: number]> = {
  me: [-2, 1], // las semanas +2..+4 quedan vacías: se rellenan con los ~7 taps
  lucia: [-2, 4],
  marco: [-2, 4],
  aisha: [-2, 4],
  pablo: [-2, 4],
  vera: [-2, 4],
  iker: [-2, 0], // semana futura sin datos: demuestra "ofrecer" con datos incompletos
};

export function buildSeedAssignments(today: ISODate): Assignment[] {
  const currentMonday = mondayOf(today);
  const assignments: Assignment[] = [];
  for (const [memberId, pattern] of Object.entries(WEEK_PATTERNS)) {
    const [from, to] = WEEK_RANGE[memberId];
    for (let week = from; week <= to; week++) {
      for (let day = 0; day < 7; day++) {
        const date = addDaysISO(currentMonday, week * 7 + day);
        assignments.push({
          id: `${memberId}:${date}`,
          memberId,
          date,
          shiftTypeId: CODE_TO_TYPE[pattern[day]],
        });
      }
    }
  }
  return assignments;
}

/** Una oferta abierta sembrada para que /cambios no arranque vacío. */
export function buildSeedOffers(today: ISODate): SwapOffer[] {
  const nextMonday = addDaysISO(mondayOf(today), 7);
  const offerDate = addDaysISO(nextMonday, 5); // sábado próximo: Marco tiene P
  return [
    {
      id: 'offer-seed-1',
      fromMemberId: 'marco',
      assignmentId: `marco:${offerDate}`,
      date: offerDate,
      shiftTypeId: 'st-p',
      note: 'Me sale un compromiso familiar',
      status: 'open',
      createdAt: `${today}T09:00:00.000Z`,
    },
  ];
}
