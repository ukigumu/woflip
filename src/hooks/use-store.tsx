/**
 * Puente React ↔ store: StoreProvider inicializa (y siembra) una vez;
 * useStoreVersion re-renderiza al cambiar cualquier dato del store.
 * Los componentes leen con los getters de lib/store tras suscribirse.
 */

import { type PropsWithChildren, useState } from 'react';
import { useSyncExternalStore } from 'react';

import { getVersion, initStore, subscribe } from '@/lib/store';

export function StoreProvider({ children }: PropsWithChildren) {
  // Inicialización síncrona en el primer render (kv-store es síncrono).
  useState(() => {
    initStore();
    return true;
  });
  return <>{children}</>;
}

/** Suscripción reactiva: devuelve un contador que cambia con cada mutación. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion);
}
