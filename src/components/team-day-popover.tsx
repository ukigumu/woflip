import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Body, Caption } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { BorderWidth, Fonts, Palette, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong } from '@/lib/dates';
import { effectiveIntervals, formatIntervals } from '@/lib/hours';
import { getAssignment, getShiftTypesById } from '@/lib/store';
import type { TeamWeekCell } from '@/lib/team-week';
import type { ISODate } from '@/lib/types';

/** Rect de la celda pulsada en coordenadas de ventana (measureInWindow). */
export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TeamDayDetail {
  memberId: string;
  name: string;
  isMe: boolean;
  date: ISODate;
  cell: TeamWeekCell;
  anchor: AnchorRect;
}

interface Props {
  /** Día pulsado en la rejilla de equipo; null = cerrado. */
  detail: TeamDayDetail | null;
  onDismiss: () => void;
}

const POPOVER_WIDTH = 240;
const GAP = 6;
const MARGIN = 8;

/** Popover anclado a una celda de la rejilla: debajo del día, o encima si no cabe. */
export function TeamDayPopover({ detail, onDismiss }: Props) {
  return (
    <Modal
      visible={detail !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      {detail ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar detalle"
          onPress={onDismiss}
          style={{ flex: 1 }}>
          <Bubble key={`${detail.memberId}:${detail.date}`} detail={detail} />
        </Pressable>
      ) : null}
    </Modal>
  );
}

function Bubble({ detail }: { detail: TeamDayDetail }) {
  const window = useWindowDimensions();
  const { anchor } = detail;
  // Altura real vía onLayout: hasta medir, se pinta invisible para no saltar.
  const [height, setHeight] = useState<number | null>(null);

  const left = Math.min(
    Math.max(anchor.x + anchor.width / 2 - POPOVER_WIDTH / 2, MARGIN),
    window.width - POPOVER_WIDTH - MARGIN,
  );
  const below = anchor.y + anchor.height + GAP;
  const placeAbove = height !== null && below + height > window.height - MARGIN;
  const top = placeAbove && height !== null ? anchor.y - GAP - height : below;

  return (
    <Pressable
      onPress={(event) => event.stopPropagation()}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={{
        position: 'absolute',
        left,
        top,
        width: POPOVER_WIDTH,
        opacity: height === null ? 0 : 1,
      }}>
      <HardCard shadowOffset={4} radius={Radii.inner} contentStyle={{ padding: 12, gap: 8 }}>
        <DetailBody detail={detail} />
      </HardCard>
    </Pressable>
  );
}

function DetailBody({ detail }: { detail: TeamDayDetail }) {
  const colors = useTheme();
  const { memberId, name, isMe, date, cell } = detail;
  if (cell.state === 'unknown') return null;

  return (
    <>
      <Caption color="secondary">{`${isMe ? 'Tú' : name} · ${formatDayLong(date)}`}</Caption>

      {cell.state === 'work' ? (
        <>
          <View style={styles.detailRow}>
            <View
              style={[styles.swatch, { backgroundColor: Palette.sky, borderColor: colors.border }]}
            />
            <Body>Trabaja</Body>
          </View>
          <Caption color="secondary">
            El turno exacto solo se ve si el compañero comparte su horario.
          </Caption>
        </>
      ) : (
        <VisibleShiftRow memberId={memberId} date={date} cell={cell} />
      )}
    </>
  );
}

/** Turno visible (propio, compartido o de descanso): etiqueta y, si trabaja, horas. */
function VisibleShiftRow({
  memberId,
  date,
  cell,
}: {
  memberId: string;
  date: ISODate;
  cell: Extract<TeamWeekCell, { state: 'rest' | 'workVisible' }>;
}) {
  const colors = useTheme();
  const typesById = getShiftTypesById();
  const assignment = getAssignment(memberId, date);
  const type = assignment ? typesById[assignment.shiftTypeId] : undefined;
  const hours =
    cell.state === 'workVisible' && assignment
      ? formatIntervals(effectiveIntervals(assignment, typesById))
      : '';

  return (
    <View style={styles.detailRow}>
      <View style={[styles.swatch, { backgroundColor: cell.color, borderColor: colors.border }]}>
        <Text style={styles.swatchCode}>{cell.code}</Text>
      </View>
      <Body>{hours ? `${type?.label ?? cell.code} · ${hours}` : (type?.label ?? cell.code)}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
