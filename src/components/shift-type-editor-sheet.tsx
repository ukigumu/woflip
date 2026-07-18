import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Caption, Title } from '@/components/ui/app-text';
import { Field } from '@/components/ui/field';
import { PillButton } from '@/components/ui/pill-button';
import { Sheet } from '@/components/ui/sheet';
import { TimeRangeField } from '@/components/ui/time-range-field';
import { Palette, ShiftPalette } from '@/constants/palette';
import { BorderWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveShiftType } from '@/lib/store';
import type { Interval, ShiftType } from '@/lib/types';

/** Colores elegibles para un turno-tipo (paleta sticker de la marca). */
const COLOR_CHOICES = [
  ShiftPalette.M.bg, // sol
  ShiftPalette.T.bg, // lavanda
  ShiftPalette.P.bg, // coral
  ShiftPalette.L.bg, // gris cálido
  Palette.mint,
  Palette.sky,
];

interface Props {
  /** Turno-tipo a editar; null = sheet cerrado. */
  shiftType: ShiftType | null;
  onDismiss: () => void;
}

/** Sheet de edición de un turno-tipo (label, tramos y color). */
export function ShiftTypeEditorSheet({ shiftType, onDismiss }: Props) {
  return (
    <Sheet visible={shiftType !== null} onDismiss={onDismiss}>
      {shiftType ? (
        // key: remonta el editor (estado limpio) al cambiar de turno.
        <EditorBody key={shiftType.id} shiftType={shiftType} onDone={onDismiss} />
      ) : null}
    </Sheet>
  );
}

function EditorBody({ shiftType, onDone }: { shiftType: ShiftType; onDone: () => void }) {
  const colors = useTheme();
  const [label, setLabel] = useState(shiftType.label);
  const [intervals, setIntervals] = useState<Interval[]>(shiftType.intervals);
  const [color, setColor] = useState(shiftType.color);
  const [error, setError] = useState<string | null>(null);

  const isWork = shiftType.kind === 'work';

  function save() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío');
      return;
    }
    saveShiftType({ ...shiftType, label: trimmed, intervals, color });
    onDone();
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <Title>{`Editar ${shiftType.code}`}</Title>

      <View style={{ gap: Spacing.two }}>
        <Caption color="secondary">Nombre</Caption>
        <Field value={label} onChangeText={setLabel} placeholder="Nombre del turno" />
      </View>

      {isWork
        ? intervals.map((iv, i) => (
            <View key={`${shiftType.id}-${i}`} style={{ gap: Spacing.two }}>
              <Caption color="secondary">{`Tramo ${i + 1}`}</Caption>
              <TimeRangeField
                value={iv}
                onChange={(next) =>
                  setIntervals((prev) => prev.map((p, j) => (j === i ? next : p)))
                }
                onRemove={
                  intervals.length > 1
                    ? () => setIntervals((prev) => prev.filter((_, j) => j !== i))
                    : undefined
                }
              />
            </View>
          ))
        : null}

      {isWork && intervals.length < 3 ? (
        <View style={{ flexDirection: 'row' }}>
          <PillButton
            size="sm"
            label="＋ Añadir tramo"
            onPress={() => setIntervals((prev) => [...prev, { start: '20:00', end: '24:00' }])}
          />
        </View>
      ) : null}

      <View style={{ gap: Spacing.two }}>
        <Caption color="secondary">Color</Caption>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {COLOR_CHOICES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              hitSlop={4}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: c,
                borderWidth: color === c ? 3 : BorderWidth,
                borderColor: colors.border,
                opacity: color === c ? 1 : 0.75,
              }}
            />
          ))}
        </View>
      </View>

      {error ? <Caption color={colors.danger}>{error}</Caption> : null}

      <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two }}>
        <PillButton label="Cancelar" onPress={onDone} style={{ flex: 1 }} />
        <PillButton variant="primary" label="Guardar" onPress={save} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
