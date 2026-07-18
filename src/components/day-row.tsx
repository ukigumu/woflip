import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { HardCard } from '@/components/ui/hard-card';
import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayShort } from '@/lib/dates';
import { effectiveIntervals, formatIntervals } from '@/lib/hours';
import type { Assignment, ISODate, ShiftType } from '@/lib/types';

/**
 * Fila de un día en /semana, estilo sticky-note: card con borde ink y sombra
 * dura del color del turno. Tap = ciclar turno (con "pop"), long-press =
 * editar las horas exactas del día.
 */
export function DayRow({
  date,
  assignment,
  shiftTypesById,
  isToday,
  onCycle,
  onEditHours,
}: {
  date: ISODate;
  assignment: Assignment | undefined;
  shiftTypesById: Record<string, ShiftType>;
  isToday: boolean;
  onCycle: () => void;
  onEditHours: () => void;
}) {
  const colors = useTheme();
  const shiftType = assignment ? shiftTypesById[assignment.shiftTypeId] : undefined;
  const intervals = assignment ? effectiveIntervals(assignment, shiftTypesById) : [];
  const hasOverride = Boolean(assignment?.overrideIntervals);

  // Pop al cambiar de turno-tipo (ciclar).
  const scale = useSharedValue(1);
  const prevTypeId = useRef(shiftType?.id);
  useEffect(() => {
    if (prevTypeId.current !== shiftType?.id) {
      prevTypeId.current = shiftType?.id;
      if (shiftType) {
        // Pop sutil: 2% arriba y vuelta con un toque de muelle.
        scale.value = withSequence(
          withTiming(1.02, { duration: 60 }),
          withSpring(1, { duration: 280, dampingRatio: 0.75 }),
        );
      }
    }
  }, [shiftType, scale]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.row}>
      <View style={styles.day}>
        <Text style={[styles.dayText, { color: isToday ? colors.text : colors.textSecondary }]}>
          {formatDayShort(date)}
        </Text>
        {isToday ? (
          <View
            style={[
              styles.todayBadge,
              { backgroundColor: colors.accent, borderColor: colors.border },
            ]}>
            <Text style={styles.todayBadgeText}>HOY</Text>
          </View>
        ) : null}
      </View>

      <Animated.View style={[{ flex: 1 }, popStyle]}>
        {shiftType ? (
          <HardCard
            color={shiftType.color}
            radius={Radii.inner}
            shadowOffset={4}
            onPress={onCycle}
            onLongPress={onEditHours}
            contentStyle={styles.chip}>
            <View style={[styles.codeBadge, { borderColor: '#2E2E2E' }]}>
              <Text style={styles.codeText}>{shiftType.code}</Text>
            </View>
            <View style={styles.chipBody}>
              <Text style={styles.chipLabel}>{shiftType.label}</Text>
              {shiftType.kind === 'work' ? (
                <Text style={styles.chipHours}>
                  {formatIntervals(intervals)}
                  {hasOverride ? '  ✎' : ''}
                </Text>
              ) : null}
            </View>
          </HardCard>
        ) : (
          <Pressable
            onPress={onCycle}
            style={({ pressed }) => [
              styles.emptyChip,
              { borderColor: colors.textSecondary },
              pressed && { backgroundColor: colors.backgroundElement },
            ]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Toca para añadir
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  day: { width: 60, gap: 3 },
  dayText: { fontSize: 13, fontFamily: Fonts.bodyBold, textTransform: 'capitalize' },
  todayBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  todayBadgeText: { fontSize: 9, fontFamily: Fonts.display, color: '#2E2E2E', letterSpacing: 0.5 },
  // Altura FIJA e igual en todas las variantes (trabajo, libre, vacío):
  // sin ella, pasar de dos líneas a una hace saltar el alto de la fila.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 56,
  },
  codeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BorderWidth,
    backgroundColor: '#FFFFFF88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { fontSize: 14, fontFamily: Fonts.display, color: '#2E2E2E' },
  chipBody: { flex: 1 },
  chipLabel: { fontSize: 15, fontFamily: Fonts.bodyBold, color: '#2E2E2E' },
  chipHours: { fontSize: 12, fontFamily: Fonts.body, color: '#2E2E2Ecc', marginTop: 1 },
  emptyChip: {
    borderWidth: BorderWidth,
    borderStyle: 'dashed',
    borderRadius: Radii.inner,
    height: 56 + 4, // mismo alto visual que una HardCard (cara + sombra)
    alignItems: 'center',
    justifyContent: 'center',
    // Compensa el padding de sombra de las HardCard vecinas para alinear anchos.
    marginRight: 4,
  },
  emptyText: { fontSize: 13, fontFamily: Fonts.bodyMedium },
});
