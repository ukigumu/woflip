import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayEditorSheet } from '@/components/day-editor-sheet';
import { DayRow } from '@/components/day-row';
import { Caption, Title } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { useWeek } from '@/hooks/use-week';
import { addDaysISO, formatWeekRange, todayISO, weekDates } from '@/lib/dates';
import { weekHours } from '@/lib/hours';
import {
  copyWeek,
  getAssignment,
  getAssignments,
  getMe,
  getShiftTypes,
  getShiftTypesById,
  setDayShift,
} from '@/lib/store';
import type { Assignment } from '@/lib/types';

/**
 * LA pantalla clave: meter la semana en ~7 taps.
 * Tap en un día = ciclar M → T → P → L → vacío. Long-press = horas exactas.
 * UI en RN puro (estilo neo-brutalista); @expo/ui queda solo para el sheet.
 */
export default function SemanaScreen() {
  useStoreVersion();
  const colors = useTheme();
  const { monday, isCurrentWeek, prevWeek, nextWeek, goToCurrentWeek } = useWeek();
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const me = getMe();
  const shiftTypes = getShiftTypes();
  const typesById = getShiftTypesById();
  const today = todayISO();
  const days = weekDates(monday);
  const hours = weekHours(getAssignments(me.id, monday, addDaysISO(monday, 6)), typesById, monday);
  const daysFilled = days.filter((d) => getAssignment(me.id, d)).length;

  /** Tap: pasa al siguiente turno-tipo por sortOrder; tras el último, vacía. */
  function cycleDay(date: string) {
    const ordered = [...shiftTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    const current = getAssignment(me.id, date);
    if (!current) {
      setDayShift(me.id, date, ordered[0].id);
      return;
    }
    const idx = ordered.findIndex((t) => t.id === current.shiftTypeId);
    const next = ordered[idx + 1];
    setDayShift(me.id, date, next ? next.id : null);
  }

  function onEditHours(date: string) {
    const assignment = getAssignment(me.id, date);
    const type = assignment ? typesById[assignment.shiftTypeId] : undefined;
    if (assignment && type?.kind === 'work') setEditing(assignment);
  }

  function onCopyPreviousWeek() {
    const copied = copyWeek(me.id, addDaysISO(monday, -7), monday);
    setFeedback(copied > 0 ? `${copied} días copiados` : 'La semana anterior está vacía');
  }

  function changeWeek(go: () => void) {
    setFeedback(null); // el "N días copiados" es de la semana en que se copió
    go();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Marca */}
      <View style={{ paddingHorizontal: Spacing.three, paddingTop: Spacing.one }}>
        <Image
          source={require('../../../assets/woflip-logo.svg')}
          contentFit="contain"
          style={{ width: 90, height: 30 }}
        />
      </View>

      {/* Cabecera: navegación de semanas (tap en el título = volver a hoy) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.two,
        }}>
        <PillButton size="sm" label="‹" onPress={() => changeWeek(prevWeek)} />
        <Pressable onPress={() => changeWeek(goToCurrentWeek)} style={{ alignItems: 'center' }}>
          <Title>{formatWeekRange(monday)}</Title>
          {!isCurrentWeek ? (
            <Text style={{ fontSize: 11, fontFamily: Fonts.bodyMedium, color: colors.accentDeep }}>
              ← volver a esta semana
            </Text>
          ) : (
            <Text style={{ fontSize: 11, fontFamily: Fonts.bodyMedium, color: colors.textSecondary }}>
              esta semana
            </Text>
          )}
        </Pressable>
        <PillButton size="sm" label="›" onPress={() => changeWeek(nextWeek)} />
      </View>

      {/* Los 7 días (entran en cascada) */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.three }}>
        {days.map((date, i) => (
          <Animated.View
            key={date}
            entering={FadeInDown.delay(i * 28).springify(300).dampingRatio(0.8)}>
            <DayRow
              date={date}
              assignment={getAssignment(me.id, date)}
              shiftTypesById={typesById}
              isToday={date === today}
              onCycle={() => {
                setFeedback(null);
                cycleDay(date);
              }}
              onEditHours={() => onEditHours(date)}
            />
          </Animated.View>
        ))}
        <View style={{ height: Spacing.two }} />
      </ScrollView>

      {/* Pie: horas de la semana + copiar */}
      <View
        style={{
          paddingHorizontal: Spacing.three,
          paddingTop: Spacing.two,
          paddingBottom: BottomTabInset + Spacing.five,
          gap: Spacing.two,
        }}>
        <Caption color={feedback ? undefined : 'secondary'} style={{ textAlign: 'center' }}>
          {feedback ?? 'Mantén pulsado un día para ajustar sus horas'}
        </Caption>
        <HardCard
          color={colors.backgroundSelected}
          shadowOffset={4}
          contentStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 14,
          }}>
          <View>
            <Text style={{ fontSize: 11, fontFamily: Fonts.bodyMedium, color: colors.textSecondary }}>
              {`total semana · ${daysFilled}/7 días`}
            </Text>
            <Text style={{ fontSize: 24, fontFamily: Fonts.display, color: colors.text }}>
              {`${hours} h`}
            </Text>
          </View>
          <PillButton size="sm" label="Copiar semana anterior" onPress={onCopyPreviousWeek} />
        </HardCard>
      </View>

      <DayEditorSheet assignment={editing} onDismiss={() => setEditing(null)} />
    </SafeAreaView>
  );
}
