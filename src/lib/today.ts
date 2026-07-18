/**
 * Selector puro de la vista "hoy". LA REGLA DE PRODUCTO VIVE AQUÍ:
 * de los demás solo se ve quién trabaja o libra — las horas solo aparecen
 * si el miembro hizo opt-in (shareFullSchedule) o soy yo.
 */

import { effectiveIntervals, formatIntervals } from './hours';
import type { Assignment, ISODate, Member, ShiftType } from './types';

export interface TodayEntry {
  memberId: string;
  name: string;
  isMe: boolean;
  /** Horas visibles SOLO con opt-in o si soy yo; si no, undefined. */
  visibleHours?: string;
}

export interface TodayView {
  working: TodayEntry[];
  resting: TodayEntry[];
  /** Compañeros sin turno introducido hoy (sin dato ≠ libra). */
  unknownCount: number;
}

export function buildTodayView(
  members: Member[],
  todayAssignments: Assignment[],
  typesById: Record<string, ShiftType>,
  today: ISODate,
): TodayView {
  const byMember = new Map(
    todayAssignments.filter((a) => a.date === today).map((a) => [a.memberId, a]),
  );
  const working: TodayEntry[] = [];
  const resting: TodayEntry[] = [];
  let unknownCount = 0;

  for (const member of members) {
    const assignment = byMember.get(member.id);
    if (!assignment) {
      unknownCount++;
      continue;
    }
    const type = typesById[assignment.shiftTypeId];
    const entry: TodayEntry = { memberId: member.id, name: member.name, isMe: member.isMe };
    if (type?.kind === 'rest') {
      resting.push(entry);
    } else {
      // Privacidad por defecto: horas solo con opt-in individual o si soy yo.
      if (member.isMe || member.shareFullSchedule) {
        entry.visibleHours = formatIntervals(effectiveIntervals(assignment, typesById));
      }
      working.push(entry);
    }
  }
  return { working, resting, unknownCount };
}
