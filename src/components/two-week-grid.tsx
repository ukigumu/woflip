import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Caption } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { BorderWidth, Fonts, Palette, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, formatDayLong, formatRange, mondayOf, todayISO } from '@/lib/dates';
import { getAssignment, getShiftTypesById } from '@/lib/store';
import type { Assignment, ISODate, ShiftType } from '@/lib/types';

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

interface Props {
  memberId: string;
  /** Qué celdas se pueden tocar. */
  canSelect?: (
    date: ISODate,
    assignment: Assignment | undefined,
    type: ShiftType | undefined,
  ) => boolean;
  onSelectDay?: (date: ISODate, assignment: Assignment) => void;
  selectedDate?: ISODate | null;
  /** Privacidad: los días de trabajo se pintan como bloque neutro, sin código. */
  masked?: boolean;
}

/**
 * Calendario de 2 semanas alineado a lunes con los turnos propios coloreados
 * y navegación por bloques de 14 días (nunca antes de la quincena actual).
 * Los días pasados salen velados: `canSelect` exige fecha futura.
 */
export function TwoWeekGrid({ memberId, canSelect, onSelectDay, selectedDate, masked }: Props) {
  const colors = useTheme();
  const today = todayISO();
  // Bloques de 14 días desde el lunes de esta semana; 0 = quincena actual.
  const [block, setBlock] = useState(0);
  const start = addDaysISO(mondayOf(today), block * 14);
  const typesById = getShiftTypesById();
  const weeks = [0, 1].map((w) =>
    Array.from({ length: 7 }, (_, d) => addDaysISO(start, w * 7 + d)),
  );

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PillButton
          size="sm"
          icon="arrow-left"
          accessibilityLabel="Dos semanas anteriores"
          onPress={() => setBlock((b) => Math.max(0, b - 1))}
        />
        <Caption color="secondary">{formatRange(start, addDaysISO(start, 13))}</Caption>
        <PillButton
          size="sm"
          icon="arrow-right"
          accessibilityLabel="Dos semanas siguientes"
          onPress={() => setBlock((b) => b + 1)}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DAY_LETTERS.map((letter) => (
          <Text
            key={letter}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontFamily: Fonts.bodyBold,
              color: colors.textSecondary,
            }}>
            {letter}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0]} style={{ flexDirection: 'row', gap: 6 }}>
          {week.map((date) => (
            <DayCell
              key={date}
              date={date}
              isToday={date === today}
              selected={date === selectedDate}
              assignment={getAssignment(memberId, date)}
              typesById={typesById}
              canSelect={canSelect}
              onSelectDay={onSelectDay}
              masked={masked}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function DayCell({
  date,
  isToday,
  selected,
  assignment,
  typesById,
  canSelect,
  onSelectDay,
  masked,
}: {
  date: ISODate;
  isToday: boolean;
  selected: boolean;
  assignment: Assignment | undefined;
  typesById: Record<string, ShiftType>;
  canSelect?: Props['canSelect'];
  onSelectDay?: Props['onSelectDay'];
  masked?: boolean;
}) {
  const colors = useTheme();
  const type = assignment ? typesById[assignment.shiftTypeId] : undefined;
  const pickerMode = canSelect != null;
  const selectable = pickerMode && canSelect(date, assignment, type);
  // Librar es público; el turno de trabajo exacto no (ni código ni color).
  const hidden = masked === true && type != null && type.kind !== 'rest';

  const face = (
    <View
      style={{
        height: 44,
        borderRadius: Radii.inner,
        borderWidth: BorderWidth,
        borderStyle: type ? 'solid' : 'dashed',
        borderColor: type ? colors.border : colors.textSecondary,
        backgroundColor: hidden ? Palette.sky : (type?.color ?? colors.surface),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          fontSize: 16,
          fontFamily: isToday || selected ? Fonts.display : Fonts.displaySemi,
          color: type ? '#2E2E2E' : colors.textSecondary,
        }}>
        {Number(date.slice(8, 10))}
      </Text>
      {type && !hidden ? (
        <Text style={{ fontSize: 8, fontFamily: Fonts.display, color: '#2E2E2E' }}>
          {type.code}
        </Text>
      ) : null}
      {pickerMode && !selectable ? (
        // Velo OPACO por encima (no opacity en la celda: el marcador de hoy
        // se transparentaría por detrás y la celda se vería oscura).
        <View
          style={{
            position: 'absolute',
            top: -BorderWidth,
            left: -BorderWidth,
            right: -BorderWidth,
            bottom: -BorderWidth,
            borderRadius: Radii.inner,
            backgroundColor: colors.surface,
            opacity: 0.65,
          }}
        />
      ) : null}
    </View>
  );

  const label = `${formatDayLong(date)}, ${type ? (hidden ? 'trabaja' : type.label) : 'sin turno'}`;

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      {/* Hueco de 3px para el marcador de hoy/selección (bloque desplazado,
          no sombra: en dark la sombra es transparente y esto debe verse). */}
      <View style={{ paddingRight: 3, paddingBottom: 3 }}>
        {isToday || selected ? (
          <View
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              right: 0,
              bottom: 0,
              borderRadius: Radii.inner,
              backgroundColor: selected ? colors.accentDeep : colors.border,
            }}
          />
        ) : null}
        {selectable && onSelectDay ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (assignment) onSelectDay(date, assignment);
            }}
            style={({ pressed }) => [
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}>
            {face}
          </Pressable>
        ) : (
          <View
            accessibilityLabel={label}
            accessibilityState={pickerMode ? { disabled: true } : undefined}>
            {face}
          </View>
        )}
      </View>
    </View>
  );
}
