import { useState } from 'react';

import { addDaysISO, mondayOf, todayISO } from '@/lib/dates';
import type { ISODate } from '@/lib/types';

/** Semana visible en /semana: offset en semanas respecto a la actual. */
export function useWeek() {
  const [offset, setOffset] = useState(0);
  const monday: ISODate = addDaysISO(mondayOf(todayISO()), offset * 7);
  return {
    monday,
    offset,
    isCurrentWeek: offset === 0,
    nextWeek: () => setOffset((o) => o + 1),
    prevWeek: () => setOffset((o) => o - 1),
    goToCurrentWeek: () => setOffset(0),
  };
}
