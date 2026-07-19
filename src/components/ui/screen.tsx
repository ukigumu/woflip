import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Envoltorio estándar de pantalla RN: SafeArea + fondo papel + scroll con
 * padding y aire inferior para la tab bar flotante. Sustituye a HostScreen
 * en el cuerpo de las pantallas (HostScreen queda para sheets @expo/ui).
 */
export function Screen({
  children,
  scroll = true,
  gap = Spacing.three,
}: PropsWithChildren<{ scroll?: boolean; gap?: number }>) {
  const colors = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: Spacing.three,
            paddingBottom: BottomTabInset + Spacing.four,
            gap,
          }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
