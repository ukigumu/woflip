import { createContext, useContext, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { getSettings } from '@/lib/store';

type Scheme = 'light' | 'dark';

const SchemeContext = createContext<Scheme | null>(null);

/**
 * Resuelve el tema efectivo: el elegido en Ajustes (settings.themeMode) o,
 * en 'system', el del dispositivo. Va en contexto (y no vía Appearance)
 * porque react-native-web no soporta Appearance.setColorScheme.
 */
export function ThemeModeProvider({ children }: PropsWithChildren) {
  useStoreVersion();
  const system = useColorScheme();
  const mode = getSettings().themeMode;
  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  return <SchemeContext.Provider value={scheme}>{children}</SchemeContext.Provider>;
}

/** Esquema activo (light/dark) ya resuelto contra el ajuste del usuario. */
export function useScheme(): Scheme {
  const ctx = useContext(SchemeContext);
  const system = useColorScheme();
  return ctx ?? (system === 'dark' ? 'dark' : 'light');
}

/** Colores semánticos del tema activo (light/dark). */
export function useTheme(): ThemeColors {
  return Colors[useScheme()];
}
