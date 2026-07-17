import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { Body, Caption, Heading, Hero } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { ShiftPalette } from '@/constants/palette';
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
        <Image
          source={require('../../assets/woflip-logo.svg')}
          contentFit="contain"
          style={{ width: 132, height: 44 }}
        />

        <Hero>Tus turnos, sin líos</Hero>
        <MiniWeek />
        <Caption color="secondary">
          Meter tu semana costará un tap por día: cada tap pasa de un turno al siguiente. Ajusta
          las horas si lo necesitas — o sigue directamente.
        </Caption>

        <Heading>Tus turnos-tipo</Heading>
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

      <ShiftTypeEditorSheet shiftType={editing} onDismiss={() => setEditing(null)} />
    </SafeAreaView>
  );
}

/**
 * Semana de juguete, puramente decorativa: 7 mini-pegatinas con el patrón
 * M M T T P L L que entran en cascada. Enseña el producto antes de
 * explicarlo (como los mini-planners de la web de Woblip).
 */
const TOY_WEEK = ['M', 'M', 'T', 'T', 'P', 'L', 'L'] as const;

function MiniWeek() {
  const colors = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
      {TOY_WEEK.map((code, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(50 + i * 40).springify(300).dampingRatio(0.8)}
          style={{
            width: 40,
            height: 44,
            borderRadius: 10,
            borderWidth: BorderWidth,
            borderColor: colors.border,
            backgroundColor: ShiftPalette[code].bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 15, fontFamily: Fonts.display, color: '#2E2E2E' }}>
            {code}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}
