/**
 * Motor de matching de intercambios. Funciones PURAS, sin acceso al store.
 *
 * Reglas portadas del backend de Woblip (apps/ausencias/swap_validation.py):
 * - Solo turnos futuros (fecha > hoy).
 * - Patrón simétrico en días cruzados: el candidato libra el día de mi turno
 *   y yo libro (L explícita) el día del suyo.
 * - Descanso mínimo de 12 h (720 min) entre jornadas consecutivas.
 * - Máximo 6 días de trabajo consecutivos tras el intercambio.
 * - Mínimo 1 día de descanso en toda ventana móvil de 7 días.
 * - Sin conflicto con ofertas/peticiones activas sobre los mismos turnos.
 * - Mismo día: la franja del candidato debe ser distinta a la mía.
 *
 * La UI SOLO muestra el número de candidatos (matching ciego).
 */

import { addDaysISO, diffDays } from './dates';
import { effectiveIntervals, timeToMinutes } from './hours';
import type {
  Assignment,
  Interval,
  ISODate,
  ShiftType,
  SwapRequestMode,
} from './types';

export const MIN_REST_MINUTES = 720; // 12 h entre jornadas
export const MAX_CONSECUTIVE_WORK_DAYS = 6;
export const MIN_REST_DAYS_IN_7 = 1;

export type CandidateKind = 'same_day_different_slot' | 'cross_day_rest_swap';

/** Un escenario válido de intercambio con un compañero concreto. */
export interface CandidateScenario {
  memberId: string;
  kind: CandidateKind;
  /** Fecha del turno del candidato que pasaría a ser mío. */
  theirDate: ISODate;
  theirAssignmentId: string;
}

export interface MatchInput {
  requesterId: string;
  /** Mi turno (de trabajo) a ceder. */
  requesterAssignment: Assignment;
  mode: SwapRequestMode;
  today: ISODate;
  /** Asignaciones de TODOS en un rango que cubra ±13 días de las fechas implicadas. */
  assignments: Assignment[];
  shiftTypes: ShiftType[];
  /** Ids de compañeros elegibles (sin el solicitante). */
  memberIds: string[];
  /** Assignments comprometidos en ofertas/peticiones activas. */
  busyAssignmentIds?: Set<string>;
}

// ---------------------------------------------------------------------------
// Helpers puros exportados (testeables por separado)
// ---------------------------------------------------------------------------

/** Fin de un tramo en minutos absolutos desde las 00:00 de su día (cruza medianoche → >1440). */
function intervalEndAbs(iv: Interval): number {
  const start = timeToMinutes(iv.start);
  let end = timeToMinutes(iv.end);
  if (end <= start) end += 24 * 60;
  return end;
}

/**
 * Minutos de descanso entre la jornada de un día y la del día SIGUIENTE.
 * Devuelve Infinity si alguno de los dos días no trabaja.
 */
export function restBetweenDays(prevDay: Interval[], nextDay: Interval[]): number {
  if (prevDay.length === 0 || nextDay.length === 0) return Infinity;
  const prevEnd = Math.max(...prevDay.map(intervalEndAbs));
  const nextStart = Math.min(...nextDay.map((iv) => timeToMinutes(iv.start)));
  return 24 * 60 + nextStart - prevEnd;
}

/** Máxima racha de días de trabajo consecutivos dentro del rango [from, to]. */
export function maxConsecutiveWorkDays(
  worksOn: (date: ISODate) => boolean,
  from: ISODate,
  to: ISODate,
): number {
  let max = 0;
  let run = 0;
  for (let d = from; d <= to; d = addDaysISO(d, 1)) {
    if (worksOn(d)) {
      run++;
      if (run > max) max = run;
    } else {
      run = 0;
    }
  }
  return max;
}

/** ¿Toda ventana móvil de 7 días que empieza en [from, to] tiene ≥ minRest días libres? */
export function hasWeeklyRest(
  worksOn: (date: ISODate) => boolean,
  from: ISODate,
  to: ISODate,
  minRest: number = MIN_REST_DAYS_IN_7,
): boolean {
  for (let d = from; d <= to; d = addDaysISO(d, 1)) {
    let rest = 0;
    for (let i = 0; i < 7; i++) {
      if (!worksOn(addDaysISO(d, i))) rest++;
    }
    if (rest < minRest) return false;
  }
  return true;
}

/** ¿Dos jornadas del mismo día son la misma franja? (intercambio sin sentido). */
export function sameSlot(a: Interval[], b: Interval[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((iv, i) => iv.start === b[i].start && iv.end === b[i].end);
}

// ---------------------------------------------------------------------------
// Proyección del calendario tras un intercambio
// ---------------------------------------------------------------------------

/** date → tramos efectivos (vacío = libra o sin dato). */
type DaySchedule = Map<ISODate, Interval[]>;

function buildSchedule(
  memberId: string,
  assignments: Assignment[],
  typesById: Record<string, ShiftType>,
): DaySchedule {
  const schedule: DaySchedule = new Map();
  for (const a of assignments) {
    if (a.memberId !== memberId) continue;
    schedule.set(a.date, effectiveIntervals(a, typesById));
  }
  return schedule;
}

/** Copia el calendario intercambiando los tramos de `dates` entre dos miembros. */
function projectSwap(
  mine: DaySchedule,
  theirs: DaySchedule,
  dates: ISODate[],
): { mine: DaySchedule; theirs: DaySchedule } {
  const projectedMine = new Map(mine);
  const projectedTheirs = new Map(theirs);
  for (const date of dates) {
    const a = mine.get(date) ?? [];
    const b = theirs.get(date) ?? [];
    projectedMine.set(date, b);
    projectedTheirs.set(date, a);
  }
  return { mine: projectedMine, theirs: projectedTheirs };
}

/** Valida descansos y rachas de un calendario proyectado alrededor de `alteredDates`. */
function scheduleIsSafe(schedule: DaySchedule, alteredDates: ISODate[]): boolean {
  const min = alteredDates.reduce((a, b) => (a < b ? a : b));
  const max = alteredDates.reduce((a, b) => (a > b ? a : b));
  const worksOn = (date: ISODate) => (schedule.get(date) ?? []).length > 0;

  // Máx. días consecutivos en el entorno afectado (lookback/lookahead = 6, como Woblip).
  const scanFrom = addDaysISO(min, -MAX_CONSECUTIVE_WORK_DAYS);
  const scanTo = addDaysISO(max, MAX_CONSECUTIVE_WORK_DAYS);
  if (maxConsecutiveWorkDays(worksOn, scanFrom, scanTo) > MAX_CONSECUTIVE_WORK_DAYS) return false;

  // Descanso semanal en ventana móvil de 7 días.
  if (!hasWeeklyRest(worksOn, addDaysISO(min, -6), max)) return false;

  // Descanso mínimo entre jornadas alrededor de cada día alterado.
  for (const date of alteredDates) {
    const prev = schedule.get(addDaysISO(date, -1)) ?? [];
    const curr = schedule.get(date) ?? [];
    const next = schedule.get(addDaysISO(date, 1)) ?? [];
    if (restBetweenDays(prev, curr) < MIN_REST_MINUTES) return false;
    if (restBetweenDays(curr, next) < MIN_REST_MINUTES) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Motor principal
// ---------------------------------------------------------------------------

/**
 * Candidatos válidos para la petición. Deduplicados por miembro: el número
 * que ve el usuario es de COMPAÑEROS compatibles, no de escenarios.
 */
export function findSwapCandidates(input: MatchInput): CandidateScenario[] {
  const {
    requesterId,
    requesterAssignment,
    mode,
    today,
    assignments,
    shiftTypes,
    memberIds,
    busyAssignmentIds,
  } = input;
  const typesById = Object.fromEntries(shiftTypes.map((t) => [t.id, t]));
  const busy = busyAssignmentIds ?? new Set<string>();
  const myDate = requesterAssignment.date;

  // Estructurales: mi turno debe ser de trabajo, futuro y no estar comprometido.
  const myType = typesById[requesterAssignment.shiftTypeId];
  if (!myType || myType.kind !== 'work') return [];
  if (myDate <= today) return [];
  if (busy.has(requesterAssignment.id)) return [];

  const mySchedule = buildSchedule(requesterId, assignments, typesById);
  const myIntervals = effectiveIntervals(requesterAssignment, typesById);

  const isRestDay = (memberId: string, date: ISODate): boolean => {
    // L EXPLÍCITA: la celda existe y no tiene tramos. Sin dato no cuenta
    // (regla conservadora: no proponer a quien no ha metido su horario).
    const a = assignments.find((x) => x.memberId === memberId && x.date === date);
    if (!a) return false;
    return (typesById[a.shiftTypeId]?.kind ?? 'work') === 'rest';
  };

  const results: CandidateScenario[] = [];

  for (const memberId of memberIds) {
    if (memberId === requesterId) continue;
    const theirAssignments = assignments.filter((a) => a.memberId === memberId);
    const theirSchedule = buildSchedule(memberId, assignments, typesById);
    let scenario: CandidateScenario | null = null;

    if (mode === 'change_slot') {
      // Mismo día, franja distinta.
      const theirs = theirAssignments.find((a) => a.date === myDate);
      if (!theirs || busy.has(theirs.id)) continue;
      if ((typesById[theirs.shiftTypeId]?.kind ?? 'work') !== 'work') continue;
      const theirIntervals = effectiveIntervals(theirs, typesById);
      if (sameSlot(myIntervals, theirIntervals)) continue;
      const projected = projectSwap(mySchedule, theirSchedule, [myDate]);
      if (scheduleIsSafe(projected.mine, [myDate]) && scheduleIsSafe(projected.theirs, [myDate])) {
        scenario = {
          memberId,
          kind: 'same_day_different_slot',
          theirDate: myDate,
          theirAssignmentId: theirs.id,
        };
      }
    } else {
      // Días cruzados: candidato libra mi día; yo libro (L explícita) el suyo.
      if (!isRestDay(memberId, myDate)) continue;
      const candidateShifts = theirAssignments.filter((a) => {
        if (a.date === myDate || a.date <= today) return false;
        if (Math.abs(diffDays(myDate, a.date)) > 7) return false;
        if (busy.has(a.id)) return false;
        if ((typesById[a.shiftTypeId]?.kind ?? 'work') !== 'work') return false;
        return isRestDay(requesterId, a.date);
      });
      for (const theirs of candidateShifts) {
        const dates = [myDate, theirs.date];
        const projected = projectSwap(mySchedule, theirSchedule, dates);
        if (scheduleIsSafe(projected.mine, dates) && scheduleIsSafe(projected.theirs, dates)) {
          scenario = {
            memberId,
            kind: 'cross_day_rest_swap',
            theirDate: theirs.date,
            theirAssignmentId: theirs.id,
          };
          break; // un escenario válido basta: contamos compañeros
        }
      }
    }

    if (scenario) results.push(scenario);
  }
  return results;
}

// ---------------------------------------------------------------------------
// TODO(cadenas a 3): NO implementar en este MVP.
// Cadena A↔B↔C: A cede su turno a B, B cede el suyo a C y C cede el suyo a A,
// de forma que los tres calendarios resultantes pasen scheduleIsSafe. La firma
// prevista reutiliza MatchInput y devolvería las dos "patas" adicionales:
//
// export interface ThreeWayChain {
//   legs: [CandidateScenario, CandidateScenario, CandidateScenario];
// }
// export function findThreeWayChains(input: MatchInput): ThreeWayChain[];
//
// Estrategia esperada: para cada par (B, C) con patrón de descansos compatible,
// componer las tres proyecciones y validar con scheduleIsSafe; expandir el
// rango de assignments a ±13 días de las tres fechas implicadas.
// ---------------------------------------------------------------------------
