import { Moon02Icon, SmartPhone01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Text, View } from 'react-native';

import { HardCard } from '@/components/ui/hard-card';
import { Fonts, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { getSettings, updateSettings } from '@/lib/store';
import type { ThemeMode } from '@/lib/types';

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun01Icon }[] = [
  { mode: 'system', label: 'Sistema', icon: SmartPhone01Icon },
  { mode: 'light', label: 'Claro', icon: Sun01Icon },
  { mode: 'dark', label: 'Oscuro', icon: Moon02Icon },
];

/**
 * Selector de tema (sistema/claro/oscuro) en tres tarjetas cuadradas.
 * Lee y escribe settings.themeMode directamente: el cambio se aplica al
 * momento vía ThemeModeProvider. Usado en Ajustes y en el onboarding.
 */
export function ThemeModePicker() {
  useStoreVersion();
  const colors = useTheme();
  const current = getSettings().themeMode;

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
      {OPTIONS.map(({ mode, label, icon }) => {
        const selected = current === mode;
        return (
          <HardCard
            key={mode}
            onPress={() => {
              haptics.selection();
              updateSettings({ themeMode: mode });
            }}
            shadowOffset={4}
            color={selected ? colors.accent : undefined}
            pressedColor={colors.accent}
            accessibilityRole="button"
            accessibilityLabel={`Tema ${label}`}
            accessibilityState={{ selected }}
            style={{ flex: 1 }}
            contentStyle={{
              alignItems: 'center',
              paddingVertical: Spacing.three,
              gap: Spacing.two,
            }}>
            <HugeiconsIcon
              icon={icon}
              size={26}
              color={selected ? '#2E2E2E' : colors.text}
              strokeWidth={2}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: Fonts.bodyBold,
                color: selected ? '#2E2E2E' : colors.text,
              }}>
              {label}
            </Text>
          </HardCard>
        );
      })}
    </View>
  );
}
