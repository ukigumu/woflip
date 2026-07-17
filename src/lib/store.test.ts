/**
 * Tests del store: reset semanal del límite anti-sondeo y comportamiento
 * de resetDemoData. El KV nativo se sustituye por un Map en memoria.
 */

import { addDaysISO, mondayOf, todayISO } from './dates';
import { ME_ID } from './seed';
import {
  createRequest,
  getAssignments,
  getRequestsThisWeek,
  getSettings,
  initStore,
  resetDemoData,
  updateSettings,
} from './store';

// jest.mock se iza por encima de los imports: el KV nativo nunca llega a cargarse.
jest.mock('expo-sqlite/kv-store', () => {
  const map = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItemSync: (key: string) => map.get(key) ?? null,
      setItemSync: (key: string, value: string) => {
        map.set(key, value);
      },
      clearSync: () => map.clear(),
    },
  };
});

beforeEach(() => {
  initStore();
  resetDemoData();
});

describe('límite semanal de peticiones', () => {
  test('el contador de una semana anterior cuenta como 0', () => {
    const lastMonday = addDaysISO(mondayOf(todayISO()), -7);
    updateSettings({ requestsThisWeek: 3, requestsWeekOf: lastMonday });
    expect(getRequestsThisWeek()).toBe(0);
  });

  test('el contador de la semana actual se conserva', () => {
    updateSettings({ requestsThisWeek: 2, requestsWeekOf: mondayOf(todayISO()) });
    expect(getRequestsThisWeek()).toBe(2);
  });

  test('crear una petición con contador caducado reinicia a 1', () => {
    const lastMonday = addDaysISO(mondayOf(todayISO()), -7);
    updateSettings({ requestsThisWeek: 3, requestsWeekOf: lastMonday });

    const today = todayISO();
    const [myShift] = getAssignments(ME_ID, addDaysISO(today, 1), addDaysISO(today, 14));
    expect(myShift).toBeDefined();

    createRequest(myShift.id, 'rest_day');
    expect(getRequestsThisWeek()).toBe(1);
    expect(getSettings().requestsWeekOf).toBe(mondayOf(today));
  });
});

describe('resetDemoData', () => {
  test('no re-arma el onboarding', () => {
    updateSettings({ onboardingDone: true });
    resetDemoData();
    expect(getSettings().onboardingDone).toBe(true);
  });
});
