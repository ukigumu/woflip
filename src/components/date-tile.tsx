import { Text, View } from 'react-native';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseISODate, weekdayIndex } from '@/lib/dates';
import type { ISODate, ShiftType } from '@/lib/types';

// Tablas locales: dates.ts no exporta las suyas y aquí van en mayúsculas.
const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;
const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/**
 * Bloque de fecha tipo calendario: día de semana, número grande sobre el
 * color del turno (dashed si no hay turno) y mes corto debajo. Sin código de
 * turno dentro (a 40px no se lee): el texto adyacente lleva la etiqueta, así
 * el color nunca es el único portador de información.
 */
export function DateTile({
  date,
  shiftType,
  size = 'md',
}: {
  date: ISODate;
  shiftType?: ShiftType;
  size?: 'sm' | 'md';
}) {
  const colors = useTheme();
  const d = parseISODate(date);
  const square = size === 'md' ? 40 : 32;

  return (
    <View
      accessible={false}
      style={{ width: size === 'md' ? 48 : 40, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 10, fontFamily: Fonts.bodyBold, color: colors.textSecondary }}>
        {WEEKDAYS[weekdayIndex(date)]}
      </Text>
      <View
        style={{
          width: square,
          height: square,
          borderRadius: Radii.inner,
          borderWidth: BorderWidth,
          borderStyle: shiftType ? 'solid' : 'dashed',
          borderColor: shiftType ? colors.border : colors.textSecondary,
          backgroundColor: shiftType?.color ?? colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            fontSize: size === 'md' ? 18 : 15,
            fontFamily: Fonts.display,
            color: shiftType ? '#2E2E2E' : colors.text,
          }}>
          {d.getDate()}
        </Text>
      </View>
      <Text style={{ fontSize: 10, fontFamily: Fonts.body, color: colors.textSecondary }}>
        {MONTHS[d.getMonth()]}
      </Text>
    </View>
  );
}
