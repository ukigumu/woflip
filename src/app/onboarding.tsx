import { Host } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { Body, Caption, Heading } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { BorderWidth, Fonts, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { formatIntervals } from '@/lib/hours';
import { getShiftTypes, updateSettings } from '@/lib/store';
import type { ShiftType } from '@/lib/types';

/**
 * Onboarding: definir los turnos-tipo. Los defaults ya son válidos, así que
 * el camino feliz es un solo tap en "Empezar" (< 30 segundos garantizados).
 */
export default function OnboardingScreen() {
  useStoreVersion();
  const router = useRouter();
  const colors = useTheme();
  const shiftTypes = getShiftTypes();
  const [editing, setEditing] = useState<ShiftType | null>(null);

  function start() {
    updateSettings({ onboardingDone: true });
    router.replace('/(tabs)/semana');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: Spacing.four, gap: Spacing.three }}>
        {/* Marca como sticker rotado */}
        <HardCard
          color={colors.accent}
          rotate={-2}
          shadowOffset={4}
          style={{ alignSelf: 'flex-start' }}
          contentStyle={{ paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={{ fontSize: 26, fontFamily: Fonts.display, color: '#2E2E2E' }}>
            woflip
          </Text>
        </HardCard>

        <Heading>Tus turnos-tipo</Heading>
        <Caption color="secondary">
          Meter tu semana costará un tap por día: cada tap pasa de un turno al siguiente. Ajusta
          las horas si lo necesitas — o sigue directamente.
        </Caption>

        <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 2 }}>
          {shiftTypes.map((st, i) => (
            <Pressable
              key={st.id}
              onPress={() => setEditing(st)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.backgroundElement,
                },
                pressed && { backgroundColor: colors.backgroundElement },
              ]}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: BorderWidth,
                  borderColor: '#2E2E2E',
                  backgroundColor: st.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 13, fontFamily: Fonts.display, color: '#2E2E2E' }}>
                  {st.code}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyMedium }}>{st.label}</Body>
                <Caption color="secondary">
                  {st.kind === 'rest' ? 'Día libre' : formatIntervals(st.intervals)}
                </Caption>
              </View>
              <Caption color="secondary">Editar ›</Caption>
            </Pressable>
          ))}
        </HardCard>

        <View style={{ flex: 1 }} />
        <PillButton variant="primary" label="Empezar" onPress={start} />
      </View>

      <Host matchContents>
        <ShiftTypeEditorSheet shiftType={editing} onDismiss={() => setEditing(null)} />
      </Host>
    </SafeAreaView>
  );
}
