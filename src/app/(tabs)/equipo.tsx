import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MemberScheduleSheet } from '@/components/member-schedule-sheet';
import {
  type AnchorRect,
  type TeamDayDetail,
  TeamDayPopover,
} from '@/components/team-day-popover';
import { AppHeader } from '@/components/ui/app-header';
import { Caption, Heading } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { BorderWidth, Fonts, Palette } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { useWeek } from '@/hooks/use-week';
import { addDaysISO, formatWeekRange, parseISODate, todayISO, weekDates } from '@/lib/dates';
import { getAllAssignments, getMembers, getShiftTypes, getShiftTypesById } from '@/lib/store';
import { buildTeamWeekView, type TeamWeekCell } from '@/lib/team-week';

/** Iniciales de los días con la semana empezando en lunes (convención es-ES). */
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export default function EquipoScreen() {
  useStoreVersion();
  const colors = useTheme();
  const { monday, isCurrentWeek, prevWeek, nextWeek, goToCurrentWeek } = useWeek();
  const [scheduleMemberId, setScheduleMemberId] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<TeamDayDetail | null>(null);

  const today = todayISO();
  const days = weekDates(monday);
  const rows = buildTeamWeekView(
    getMembers(),
    getAllAssignments(monday, addDaysISO(monday, 6)),
    getShiftTypesById(),
    days,
  );
  const restType = getShiftTypes().find((t) => t.kind === 'rest');

  return (
    <Screen>
      <AppHeader title="Mi equipo" />

      {/* Navegación de semanas (tap en el rango = volver a la actual) */}
      <View style={styles.nav}>
        <PillButton
          size="sm"
          icon="arrow-left"
          accessibilityLabel="Semana anterior"
          onPress={prevWeek}
        />
        <Pressable onPress={goToCurrentWeek} style={{ alignItems: 'center' }}>
          <Heading>{formatWeekRange(monday)}</Heading>
          {!isCurrentWeek ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                size={12}
                color={colors.accentDeep}
                strokeWidth={3}
              />
              <Text
                style={{ fontSize: 11, fontFamily: Fonts.bodyMedium, color: colors.accentDeep }}>
                volver a esta semana
              </Text>
            </View>
          ) : (
            <Text
              style={{ fontSize: 11, fontFamily: Fonts.bodyMedium, color: colors.textSecondary }}>
              esta semana
            </Text>
          )}
        </Pressable>
        <PillButton
          size="sm"
          icon="arrow-right"
          accessibilityLabel="Semana siguiente"
          onPress={nextWeek}
        />
      </View>

      {/* Rejilla: cabecera de días + una fila por miembro */}
      <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}>
        <View style={styles.gridRow}>
          <View style={styles.nameCol} />
          {days.map((date, i) => {
            const isToday = date === today;
            return (
              <View key={date} style={styles.cellSlot}>
                <View style={styles.dayHeader}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: Fonts.bodyBold,
                      color: isToday ? colors.accentDeep : colors.textSecondary,
                    }}>
                    {DAY_LETTERS[i]}
                  </Text>
                  <View
                    style={[
                      styles.dayNumber,
                      isToday && { backgroundColor: colors.accent, borderColor: colors.border },
                    ]}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: Fonts.display,
                        color: isToday ? '#2E2E2E' : colors.text,
                      }}>
                      {parseISODate(date).getDate()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {rows.map((row) => (
          <View
            key={row.memberId}
            style={[
              styles.gridRow,
              { borderTopWidth: 1, borderTopColor: colors.backgroundElement },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={row.isMe ? 'Ver tu horario' : `Ver horario de ${row.name}`}
              onPress={() => setScheduleMemberId(row.memberId)}
              style={({ pressed }) => [
                styles.nameCol,
                { flexDirection: 'row', alignItems: 'center', gap: 6 },
                pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
              ]}>
              <Avatar
                name={row.name}
                initial={row.isMe ? 'T' : undefined}
                photoUri={row.photoUri}
                size={24}
              />
              <Text
                numberOfLines={1}
                style={{ flex: 1, fontSize: 12, fontFamily: Fonts.bodyMedium, color: colors.text }}>
                {row.isMe ? 'Tú' : row.name}
              </Text>
            </Pressable>
            {row.cells.map((cell, i) => (
              <View key={days[i]} style={styles.cellSlot}>
                <DayCell
                  cell={cell}
                  onPress={(anchor) =>
                    setDayDetail({
                      memberId: row.memberId,
                      name: row.name,
                      isMe: row.isMe,
                      date: days[i],
                      cell,
                      anchor,
                    })
                  }
                />
              </View>
            ))}
          </View>
        ))}
      </HardCard>

      {/* Leyenda + regla de privacidad */}
      <View style={{ gap: 8 }}>
        <View style={styles.legend}>
          <LegendItem label="trabaja">
            <View
              style={[styles.swatch, { backgroundColor: Palette.sky, borderColor: colors.border }]}
            />
          </LegendItem>
          <LegendItem label="libra">
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: restType?.color ?? colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}>
              <Text style={styles.swatchCode}>{restType?.code ?? 'L'}</Text>
            </View>
          </LegendItem>
          <LegendItem label="sin dato">
            <View
              style={[styles.swatch, { borderStyle: 'dashed', borderColor: colors.textSecondary }]}
            />
          </LegendItem>
        </View>
        <Caption color="secondary">
          El turno exacto (M, T, P…) solo se ve si el compañero comparte su horario.
        </Caption>
      </View>

      <MemberScheduleSheet memberId={scheduleMemberId} onDismiss={() => setScheduleMemberId(null)} />
      <TeamDayPopover detail={dayDetail} onDismiss={() => setDayDetail(null)} />
    </Screen>
  );
}

/** Celda de un día: color+código si es visible, bloque sólido si es privado. */
function DayCell({
  cell,
  onPress,
}: {
  cell: TeamWeekCell;
  onPress?: (anchor: AnchorRect) => void;
}) {
  const colors = useTheme();
  const ref = useRef<View>(null);
  if (cell.state === 'unknown') {
    return (
      <View style={[styles.cell, { borderStyle: 'dashed', borderColor: colors.textSecondary }]} />
    );
  }
  const face =
    cell.state === 'work' ? (
      // Sky: pegatina neutra que no coincide con ningún turno-tipo (M/T/P/L).
      <View style={[styles.cell, { backgroundColor: Palette.sky, borderColor: colors.border }]} />
    ) : (
      <View style={[styles.cell, { backgroundColor: cell.color, borderColor: colors.border }]}>
        <Text style={styles.cellCode}>{cell.code}</Text>
      </View>
    );
  if (!onPress) return face;
  const label =
    cell.state === 'work' ? 'trabaja' : cell.state === 'rest' ? 'libra' : `turno ${cell.code}`;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        // El popover se ancla a la celda: medimos su rect en ventana.
        ref.current?.measureInWindow((x, y, width, height) => onPress({ x, y, width, height }));
      }}
      style={({ pressed }) => [
        { width: '100%', alignItems: 'center' },
        pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
      ]}>
      {face}
    </Pressable>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {children}
      <Caption color="secondary">{label}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 3,
  },
  nameCol: { width: 78 },
  /** Hueco flexible: centra la celda y reparte el ancho entre los 7 días. */
  cellSlot: { flex: 1, alignItems: 'center' },
  dayHeader: { alignItems: 'center', gap: 1 },
  /** Círculo del número: siempre ocupa el mismo sitio; hoy se pinta de acento. */
  dayNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: BorderWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: '100%',
    maxWidth: 34,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: BorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellCode: { fontSize: 12, fontFamily: Fonts.display, color: '#2E2E2E' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 14,
    rowGap: 6,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: BorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCode: { fontSize: 9, fontFamily: Fonts.display, color: '#2E2E2E' },
});
