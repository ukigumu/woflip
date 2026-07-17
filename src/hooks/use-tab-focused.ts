import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Si la pantalla (pestaña) tiene el foco de navegación.
 * Necesario porque las vistas SwiftUI/Compose de @expo/ui (Host) pueden
 * "sangrar" sobre otras pestañas cuando su escena pierde el foco en
 * NativeTabs: montamos el árbol nativo solo con la pestaña activa.
 */
export function useTabFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
