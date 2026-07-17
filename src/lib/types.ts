/**
 * Modelo de datos local de WoFlip.
 * Espeja las decisiones de Woblip: intervalos como lista de tramos,
 * un assignment máximo por (miembro, fecha), y el día libre como
 * turno explícito de tipo 'rest' (distinto de "sin dato").
 */

/** Fecha 'YYYY-MM-DD' (comparable lexicográficamente). */
export type ISODate = string;

/** Hora 'HH:MM' en formato 24h. */
export type HHMM = string;

/** Tramo horario. Si end <= start, el tramo cruza la medianoche (+1 día). */
export interface Interval {
  start: HHMM;
  end: HHMM;
}

export type ShiftKind = 'work' | 'rest';

/** Turno-tipo (plantilla): M, T, P, L o personalizados. */
export interface ShiftType {
  id: string;
  /** Código corto que se pinta en la celda: 'M' | 'T' | 'P' | 'L' | custom. */
  code: string;
  label: string;
  /** 'rest' para L: intervals = []. */
  kind: ShiftKind;
  /** Partido = 2+ tramos; libre = []. */
  intervals: Interval[];
  color: string;
  /** Orden del ciclo de taps en la semana. */
  sortOrder: number;
}

/** Asignación de un turno a un día. Máximo una por (miembro, fecha). */
export interface Assignment {
  /** `${memberId}:${date}` — la unicidad por día queda garantizada por diseño. */
  id: string;
  memberId: string;
  date: ISODate;
  shiftTypeId: string;
  /** Horas exactas de ESE día (long-press); si falta, las del turno-tipo. */
  overrideIntervals?: Interval[];
}

export interface Member {
  id: string;
  name: string;
  isMe: boolean;
  /** Opt-in individual a mostrar el horario completo. Default false. */
  shareFullSchedule: boolean;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export type SwapOfferStatus = 'open' | 'taken' | 'cancelled';

/** Oferta broadcast: regalo un turno al grupo, cualquiera lo coge. */
export interface SwapOffer {
  id: string;
  fromMemberId: string;
  assignmentId: string;
  /** Desnormalizados para pintar la lista sin resolver el assignment. */
  date: ISODate;
  shiftTypeId: string;
  note?: string;
  status: SwapOfferStatus;
  takenByMemberId?: string;
  createdAt: string;
}

export type SwapRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

/**
 * Modo de la petición de cambio:
 * - 'rest_day': quiero librar el día de mi turno; a cambio trabajo un día
 *   que ahora libro (intercambio cruzado estilo Woblip).
 * - 'change_slot': mismo día, otra franja.
 */
export type SwapRequestMode = 'rest_day' | 'change_slot';

/** Petición ciega: la UI solo muestra candidateMemberIds.length hasta aceptar. */
export interface SwapRequest {
  id: string;
  fromMemberId: string;
  /** Mi turno a ceder. */
  assignmentId: string;
  mode: SwapRequestMode;
  /** Día que quiero librar (rest_day) o cambiar de franja (change_slot). */
  targetDate: ISODate;
  /** Calculado en local por el motor. NUNCA se muestran los nombres. */
  candidateMemberIds: string[];
  status: SwapRequestStatus;
  /** Identidad revelada solo al aceptar. */
  acceptedByMemberId?: string;
  /** Día del turno del aceptante que paso a trabajar yo (solo rest_day). */
  acceptedTheirDate?: ISODate;
  createdAt: string;
}

export interface Settings {
  onboardingDone: boolean;
  /** Contador anti-sondeo (límite blando por semana). */
  requestsThisWeek: number;
  /** Lunes (ISO) de la semana a la que pertenece el contador; al cambiar de semana se resetea. */
  requestsWeekOf: ISODate;
}
