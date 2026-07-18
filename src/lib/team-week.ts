/**
 * Selector puro de la vista "equipo" en semana. Aplica LA MISMA regla de
 * producto que today.ts: de los demás solo se ve si trabajan o libran — el
 * turno concreto (código/color) solo con opt-in (shareFullSchedule) o si soy yo.
 */

import type { Assignment, ISODate, Member, ShiftType } from './types';

export type TeamWeekCell =
  /** Sin turno introducido ese día (sin dato ≠ libra). */
  | { state: 'unknown' }
  /** Libra: público por diseño ("quién libra" es el producto). */
  | { state: 'rest'; code: string; color: string }
  /** Trabaja pero sin opt-in: NUNCA se revela el turno concreto. */
  | { state: 'work' }
  /** Trabaja y el turno es visible (soy yo o hizo opt-in). */
  | { state: 'workVisible'; code: string; color: string };

export interface TeamWeekRow {
  memberId: string;
  name: string;
  isMe: boolean;
  photoUri?: string;
  /** Una celda por día, en el orden de `days`. */
  cells: TeamWeekCell[];
}

export function buildTeamWeekView(
  members: Member[],
  assignments: Assignment[],
  typesById: Record<string, ShiftType>,
  days: ISODate[],
): TeamWeekRow[] {
  const byMemberDate = new Map(assignments.map((a) => [`${a.memberId}:${a.date}`, a]));
  // Yo primero; el resto conserva el orden del store (sort estable).
  const ordered = [...members].sort((a, b) => Number(b.isMe) - Number(a.isMe));

  return ordered.map((member) => ({
    memberId: member.id,
    name: member.name,
    isMe: member.isMe,
    photoUri: member.photoUri,
    cells: days.map((date): TeamWeekCell => {
      const assignment = byMemberDate.get(`${member.id}:${date}`);
      if (!assignment) return { state: 'unknown' };
      const type = typesById[assignment.shiftTypeId];
      if (!type) return { state: 'unknown' };
      if (type.kind === 'rest') return { state: 'rest', code: type.code, color: type.color };
      if (member.isMe || member.shareFullSchedule) {
        return { state: 'workVisible', code: type.code, color: type.color };
      }
      return { state: 'work' };
    }),
  }));
}
