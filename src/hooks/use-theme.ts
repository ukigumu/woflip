import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

/** Colores semánticos del tema activo (light/dark). */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
