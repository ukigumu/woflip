/**
 * Repositorio local: ÚNICO punto de acceso a datos de la app.
 * Envuelve expo-sqlite/kv-store (API síncrona) con caché en memoria y un
 * emisor de cambios para React (useSyncExternalStore). Sustituible por una
 * API real más adelante sin tocar pantallas.
 */

import Storage from 'expo-sqlite/kv-store';

import { addDaysISO, mondayOf, todayISO, weekDates } from './dates';
import { findSwapCandidates, type CandidateScenario } from './matching';
import {
  buildSeedAssignments,
  buildSeedGroup,
  buildSeedMembers,
  buildSeedOffers,
  defaultShiftTypes,
  SEED_VERSION,
} from './seed';
import type {
  Assignment,
  Group,
  Interval,
  ISODate,
  Member,
  Settings,
  ShiftType,
  SwapOffer,
  SwapRequest,
} from './types';

// ---------------------------------------------------------------------------
// Claves KV (namespaced y versionadas para poder migrar sin limpiar)
// ---------------------------------------------------------------------------

const KEY = {
  seedVersion: 'woflip:v1:seedVersion',
  settings: 'woflip:v1:settings',
  shiftTypes: 'woflip:v1:shiftTypes',
  members: 'woflip:v1:members',
  group: 'woflip:v1:group',
  offers: 'woflip:v1:offers',
  requests: 'woflip:v1:requests',
  assignments: (memberId: string) => `woflip:v1:assignments:${memberId}`,
} as const;

function defaultSettings(): Settings {
  return { onboardingDone: false, requestsThisWeek: 0, requestsWeekOf: mondayOf(todayISO()) };
}

// ---------------------------------------------------------------------------
// Estado en memoria + emisor de cambios
// ---------------------------------------------------------------------------

interface State {
  settings: Settings;
  shiftTypes: ShiftType[];
  members: Member[];
  group: Group;
  /** memberId → (fecha → assignment). Un turno máximo por (miembro, día). */
  assignmentsByMember: Record<string, Record<ISODate, Assignment>>;
  offers: SwapOffer[];
  requests: SwapRequest[];
}

let state: State | null = null;
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version++;
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion(): number {
  return version;
}

function readJSON<T>(key: string): T | null {
  const raw = Storage.getItemSync(key);
  return raw == null ? null : (JSON.parse(raw) as T);
}

function writeJSON(key: string, value: unknown): void {
  Storage.setItemSync(key, JSON.stringify(value));
}

function requireState(): State {
  if (!state) throw new Error('initStore() debe llamarse antes de usar el store');
  return state;
}

// ---------------------------------------------------------------------------
// Inicialización y seed
// ---------------------------------------------------------------------------

export function initStore(): void {
  if (state) return;
  const storedSeed = readJSON<number>(KEY.seedVersion);
  if (storedSeed !== SEED_VERSION) {
    seedAll();
    return;
  }
  const members = readJSON<Member[]>(KEY.members) ?? buildSeedMembers();
  const storedSettings = readJSON<Settings>(KEY.settings);
  state = {
    // requestsWeekOf puede faltar en datos v1 antiguos: el reset perezoso lo normaliza.
    settings: storedSettings
      ? { ...defaultSettings(), ...storedSettings }
      : defaultSettings(),
    shiftTypes: readJSON<ShiftType[]>(KEY.shiftTypes) ?? defaultShiftTypes(),
    members,
    group: readJSON<Group>(KEY.group) ?? buildSeedGroup(),
    assignmentsByMember: Object.fromEntries(
      members.map((m) => [m.id, readJSON<Record<ISODate, Assignment>>(KEY.assignments(m.id)) ?? {}]),
    ),
    offers: readJSON<SwapOffer[]>(KEY.offers) ?? [],
    requests: readJSON<SwapRequest[]>(KEY.requests) ?? [],
  };
  notify();
}

function seedAll(): void {
  const today = todayISO();
  const members = buildSeedMembers();
  const assignmentsByMember: Record<string, Record<ISODate, Assignment>> = Object.fromEntries(
    members.map((m) => [m.id, {}]),
  );
  for (const a of buildSeedAssignments(today)) {
    assignmentsByMember[a.memberId][a.date] = a;
  }
  state = {
    settings: defaultSettings(),
    shiftTypes: defaultShiftTypes(),
    members,
    group: buildSeedGroup(),
    assignmentsByMember,
    offers: buildSeedOffers(today),
    requests: [],
  };
  persistAll();
  writeJSON(KEY.seedVersion, SEED_VERSION);
  notify();
}

function persistAll(): void {
  const s = requireState();
  writeJSON(KEY.settings, s.settings);
  writeJSON(KEY.shiftTypes, s.shiftTypes);
  writeJSON(KEY.members, s.members);
  writeJSON(KEY.group, s.group);
  writeJSON(KEY.offers, s.offers);
  writeJSON(KEY.requests, s.requests);
  for (const m of s.members) writeJSON(KEY.assignments(m.id), s.assignmentsByMember[m.id] ?? {});
}

/** Borra todo y re-siembra (botón "Restablecer datos de demo"). */
export function resetDemoData(): void {
  // Resetear datos de demo no debe re-armar el onboarding en el próximo arranque.
  const onboardingDone = state?.settings.onboardingDone ?? false;
  Storage.clearSync();
  state = null;
  seedAll();
  updateSettings({ onboardingDone });
}

// ---------------------------------------------------------------------------
// Settings y turnos-tipo
// ---------------------------------------------------------------------------

export function getSettings(): Settings {
  return requireState().settings;
}

/**
 * Peticiones enviadas ESTA semana. Si el contador guardado es de una semana
 * anterior vale 0 (reset perezoso: se normaliza al incrementar, sin mutar aquí).
 */
export function getRequestsThisWeek(): number {
  const s = requireState();
  return s.settings.requestsWeekOf === mondayOf(todayISO()) ? s.settings.requestsThisWeek : 0;
}

export function updateSettings(patch: Partial<Settings>): void {
  const s = requireState();
  s.settings = { ...s.settings, ...patch };
  writeJSON(KEY.settings, s.settings);
  notify();
}

export function getShiftTypes(): ShiftType[] {
  return requireState().shiftTypes;
}

/** Turnos-tipo indexados por id (para effectiveIntervals y render). */
export function getShiftTypesById(): Record<string, ShiftType> {
  return Object.fromEntries(requireState().shiftTypes.map((t) => [t.id, t]));
}

export function saveShiftType(shiftType: ShiftType): void {
  const s = requireState();
  const idx = s.shiftTypes.findIndex((t) => t.id === shiftType.id);
  if (idx >= 0) s.shiftTypes = s.shiftTypes.map((t) => (t.id === shiftType.id ? shiftType : t));
  else s.shiftTypes = [...s.shiftTypes, shiftType];
  writeJSON(KEY.shiftTypes, s.shiftTypes);
  notify();
}

// ---------------------------------------------------------------------------
// Miembros y grupo
// ---------------------------------------------------------------------------

export function getMembers(): Member[] {
  return requireState().members;
}

export function getMe(): Member {
  const me = requireState().members.find((m) => m.isMe);
  if (!me) throw new Error('Seed corrupto: falta el miembro isMe');
  return me;
}

export function getGroup(): Group {
  return requireState().group;
}

export function updateMember(id: string, patch: Partial<Omit<Member, 'id'>>): void {
  const s = requireState();
  s.members = s.members.map((m) => (m.id === id ? { ...m, ...patch } : m));
  writeJSON(KEY.members, s.members);
  notify();
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export function getAssignment(memberId: string, date: ISODate): Assignment | undefined {
  return requireState().assignmentsByMember[memberId]?.[date];
}

/** Asignaciones de un miembro en el rango [from, to] (inclusive). */
export function getAssignments(memberId: string, from: ISODate, to: ISODate): Assignment[] {
  const byDate = requireState().assignmentsByMember[memberId] ?? {};
  return Object.values(byDate)
    .filter((a) => a.date >= from && a.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Asignaciones de TODOS los miembros en el rango (para matching y "hoy"). */
export function getAllAssignments(from: ISODate, to: ISODate): Assignment[] {
  const s = requireState();
  return s.members.flatMap((m) => getAssignments(m.id, from, to));
}

function persistMemberAssignments(memberId: string): void {
  const s = requireState();
  writeJSON(KEY.assignments(memberId), s.assignmentsByMember[memberId] ?? {});
}

/** Asigna un turno-tipo a un día (null = vaciar la celda). Borra el override. */
export function setDayShift(memberId: string, date: ISODate, shiftTypeId: string | null): void {
  const s = requireState();
  const byDate = { ...(s.assignmentsByMember[memberId] ?? {}) };
  if (shiftTypeId === null) {
    delete byDate[date];
  } else {
    byDate[date] = { id: `${memberId}:${date}`, memberId, date, shiftTypeId };
  }
  s.assignmentsByMember = { ...s.assignmentsByMember, [memberId]: byDate };
  persistMemberAssignments(memberId);
  notify();
}

/** Horas exactas de ESE día (long-press). null restablece las del tipo. */
export function setDayOverride(memberId: string, date: ISODate, intervals: Interval[] | null): void {
  const s = requireState();
  const existing = s.assignmentsByMember[memberId]?.[date];
  if (!existing) return;
  const updated: Assignment = { ...existing };
  if (intervals === null) delete updated.overrideIntervals;
  else updated.overrideIntervals = intervals;
  s.assignmentsByMember = {
    ...s.assignmentsByMember,
    [memberId]: { ...s.assignmentsByMember[memberId], [date]: updated },
  };
  persistMemberAssignments(memberId);
  notify();
}

/** Copia la semana de `fromMonday` sobre la de `toMonday`. Devuelve nº de días copiados. */
export function copyWeek(memberId: string, fromMonday: ISODate, toMonday: ISODate): number {
  const s = requireState();
  const source = s.assignmentsByMember[memberId] ?? {};
  const byDate = { ...source };
  let copied = 0;
  weekDates(fromMonday).forEach((date, i) => {
    const target = addDaysISO(toMonday, i);
    const src = source[date];
    if (src) {
      byDate[target] = { ...src, id: `${memberId}:${target}`, date: target };
      copied++;
    } else {
      delete byDate[target];
    }
  });
  s.assignmentsByMember = { ...s.assignmentsByMember, [memberId]: byDate };
  persistMemberAssignments(memberId);
  notify();
  return copied;
}

// ---------------------------------------------------------------------------
// Ofertas (broadcast)
// ---------------------------------------------------------------------------

export function listOffers(): SwapOffer[] {
  return requireState().offers;
}

export function createOffer(assignmentId: string, note?: string): SwapOffer {
  const s = requireState();
  const [memberId, date] = splitAssignmentId(assignmentId);
  const assignment = s.assignmentsByMember[memberId]?.[date];
  if (!assignment) throw new Error(`No existe el assignment ${assignmentId}`);
  const offer: SwapOffer = {
    id: `offer-${Date.now()}`,
    fromMemberId: memberId,
    assignmentId,
    date,
    shiftTypeId: assignment.shiftTypeId,
    note,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  s.offers = [offer, ...s.offers];
  writeJSON(KEY.offers, s.offers);
  notify();
  return offer;
}

/** Quien coge la oferta se queda el turno; el ofertante pasa a librar ese día. */
export function takeOffer(offerId: string, byMemberId: string): void {
  const s = requireState();
  const offer = s.offers.find((o) => o.id === offerId);
  if (!offer || offer.status !== 'open') return;
  const restType = s.shiftTypes.find((t) => t.kind === 'rest');
  const given = s.assignmentsByMember[offer.fromMemberId]?.[offer.date];
  if (given) {
    // El turno cambia de dueño: payload al receptor, descanso al ofertante.
    setCell(byMemberId, offer.date, given.shiftTypeId, given.overrideIntervals);
    setCell(offer.fromMemberId, offer.date, restType?.id ?? null, undefined);
  }
  s.offers = s.offers.map((o) =>
    o.id === offerId ? { ...o, status: 'taken', takenByMemberId: byMemberId } : o,
  );
  writeJSON(KEY.offers, s.offers);
  notify();
}

export function cancelOffer(offerId: string): void {
  const s = requireState();
  s.offers = s.offers.map((o) => (o.id === offerId ? { ...o, status: 'cancelled' } : o));
  writeJSON(KEY.offers, s.offers);
  notify();
}

// ---------------------------------------------------------------------------
// Peticiones de cambio (matching ciego)
// ---------------------------------------------------------------------------

export function listRequests(): SwapRequest[] {
  return requireState().requests;
}

/** Assignments comprometidos en ofertas abiertas o peticiones pendientes. */
function busyAssignmentIds(): Set<string> {
  const s = requireState();
  const busy = new Set<string>();
  for (const o of s.offers) if (o.status === 'open') busy.add(o.assignmentId);
  for (const r of s.requests) if (r.status === 'pending') busy.add(r.assignmentId);
  return busy;
}

/**
 * Ejecuta el motor de matching para un turno mío. Devuelve los escenarios
 * VÁLIDOS — la UI solo debe enseñar el número (matching ciego).
 */
export function computeCandidates(
  assignmentId: string,
  mode: SwapRequest['mode'],
  options?: { excludeRequestId?: string },
): CandidateScenario[] {
  const s = requireState();
  const [memberId, date] = splitAssignmentId(assignmentId);
  const assignment = s.assignmentsByMember[memberId]?.[date];
  if (!assignment) return [];
  const busy = busyAssignmentIds();
  if (options?.excludeRequestId) {
    const own = s.requests.find((r) => r.id === options.excludeRequestId);
    if (own) busy.delete(own.assignmentId);
  }
  return findSwapCandidates({
    requesterId: memberId,
    requesterAssignment: assignment,
    mode,
    today: todayISO(),
    assignments: getAllAssignments(addDaysISO(date, -13), addDaysISO(date, 13)),
    shiftTypes: s.shiftTypes,
    memberIds: s.members.filter((m) => m.id !== memberId).map((m) => m.id),
    busyAssignmentIds: busy,
  });
}

/** Crea la petición ciega: guarda solo ids de candidatos, nunca se muestran nombres. */
export function createRequest(assignmentId: string, mode: SwapRequest['mode']): SwapRequest {
  const s = requireState();
  const [memberId, date] = splitAssignmentId(assignmentId);
  const candidates = computeCandidates(assignmentId, mode);
  const request: SwapRequest = {
    id: `req-${Date.now()}`,
    fromMemberId: memberId,
    assignmentId,
    mode,
    targetDate: date,
    candidateMemberIds: [...new Set(candidates.map((c) => c.memberId))],
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  s.requests = [request, ...s.requests];
  writeJSON(KEY.requests, s.requests);
  updateSettings({
    requestsThisWeek: getRequestsThisWeek() + 1,
    requestsWeekOf: mondayOf(todayISO()),
  });
  return request;
}

/**
 * Modo demo: simula la respuesta de un compañero. Como Woblip, RE-VALIDA en
 * el momento de aceptar; si ya no hay escenario válido, la respuesta es un
 * rechazo. Al aceptar se aplica el intercambio y se revela la identidad.
 */
export function simulateResponse(requestId: string): SwapRequest | undefined {
  const s = requireState();
  const req = s.requests.find((r) => r.id === requestId);
  if (!req || req.status !== 'pending') return req;

  const scenarios = computeCandidates(req.assignmentId, req.mode, { excludeRequestId: req.id });
  const chosen = scenarios.find((c) => req.candidateMemberIds.includes(c.memberId)) ?? scenarios[0];

  let updated: SwapRequest;
  if (!chosen) {
    updated = { ...req, status: 'rejected' };
  } else {
    updated = {
      ...req,
      status: 'accepted',
      acceptedByMemberId: chosen.memberId,
      acceptedTheirDate: chosen.kind === 'cross_day_rest_swap' ? chosen.theirDate : undefined,
    };
  }
  s.requests = s.requests.map((r) => (r.id === requestId ? updated : r));
  writeJSON(KEY.requests, s.requests);
  if (updated.status === 'accepted') applyAcceptedSwap(requestId);
  notify();
  return updated;
}

export function cancelRequest(requestId: string): void {
  const s = requireState();
  s.requests = s.requests.map((r) =>
    r.id === requestId ? { ...r, status: 'cancelled' as const } : r,
  );
  writeJSON(KEY.requests, s.requests);
  notify();
}

/**
 * Intercambio físico estilo Woblip: NO se reasignan dueños; se intercambia el
 * contenido del turno entre las filas (miembro, fecha) de los dos implicados.
 * En días cruzados se crean los descansos complementarios si faltan.
 */
export function applyAcceptedSwap(requestId: string): void {
  const s = requireState();
  const req = s.requests.find((r) => r.id === requestId);
  if (!req || req.status !== 'accepted' || !req.acceptedByMemberId) return;
  const me = req.fromMemberId;
  const them = req.acceptedByMemberId;
  const [, myDate] = splitAssignmentId(req.assignmentId);
  const restTypeId = s.shiftTypes.find((t) => t.kind === 'rest')?.id ?? null;

  const dates =
    req.mode === 'change_slot' || !req.acceptedTheirDate
      ? [myDate]
      : [myDate, req.acceptedTheirDate];

  for (const date of dates) {
    // Descanso complementario: si a alguien le falta la celda, se crea como L.
    if (!s.assignmentsByMember[me]?.[date] && restTypeId) setCell(me, date, restTypeId, undefined);
    if (!s.assignmentsByMember[them]?.[date] && restTypeId)
      setCell(them, date, restTypeId, undefined);
    swapCellPayloads(me, them, date);
  }
  notify();
}

// ---------------------------------------------------------------------------
// Helpers internos de celdas
// ---------------------------------------------------------------------------

function splitAssignmentId(assignmentId: string): [memberId: string, date: ISODate] {
  const sep = assignmentId.lastIndexOf(':');
  return [assignmentId.slice(0, sep), assignmentId.slice(sep + 1)];
}

function setCell(
  memberId: string,
  date: ISODate,
  shiftTypeId: string | null,
  overrideIntervals: Interval[] | undefined,
): void {
  const s = requireState();
  const byDate = { ...(s.assignmentsByMember[memberId] ?? {}) };
  if (shiftTypeId === null) {
    delete byDate[date];
  } else {
    const cell: Assignment = { id: `${memberId}:${date}`, memberId, date, shiftTypeId };
    if (overrideIntervals) cell.overrideIntervals = overrideIntervals;
    byDate[date] = cell;
  }
  s.assignmentsByMember = { ...s.assignmentsByMember, [memberId]: byDate };
  persistMemberAssignments(memberId);
}

/** Intercambia el payload (tipo + override) de las celdas de dos miembros en `date`. */
function swapCellPayloads(memberA: string, memberB: string, date: ISODate): void {
  const s = requireState();
  const a = s.assignmentsByMember[memberA]?.[date];
  const b = s.assignmentsByMember[memberB]?.[date];
  if (!a || !b) return;
  setCell(memberA, date, b.shiftTypeId, b.overrideIntervals);
  setCell(memberB, date, a.shiftTypeId, a.overrideIntervals);
}

// ---------------------------------------------------------------------------
// Utilidades de fecha de conveniencia para pantallas
// ---------------------------------------------------------------------------

export function currentMonday(): ISODate {
  return mondayOf(todayISO());
}
