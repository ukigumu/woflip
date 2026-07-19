/**
 * Puente React ↔ store: StoreProvider inicializa (y siembra) una vez;
 * useStoreVersion re-renderiza al cambiar cualquier dato del store.
 * Los componentes leen con los getters de lib/store tras suscribirse.
 */

import { type PropsWithChildren, useEffect, useState } from 'react';
import { useSyncExternalStore } from 'react';

import { getVersion, initStore, subscribe } from '@/lib/store';

export function StoreProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    initStore().then(
      () => {
        if (active) setReady(true);
      },
      (reason: unknown) => {
        if (active) setError(reason);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) throw error;
  if (!ready) return null;
  return <>{children}</>;
}

/** Suscripción reactiva: devuelve un contador que cambia con cada mutación. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion);
}
