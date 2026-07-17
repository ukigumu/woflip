import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Caption, Heading } from '@/components/ui/app-text';
import { Field } from '@/components/ui/field';
import { PillButton } from '@/components/ui/pill-button';
import { Sheet } from '@/components/ui/sheet';
import { Palette, ShiftPalette } from '@/constants/palette';
import { BorderWidth } from '@/constants/theme';
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

const HHMM_RE = /^([01]?\d|2[0-4]):[0-5]\d$/;

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
    if (isWork && intervals.some((iv) => !HHMM_RE.test(iv.start) || !HHMM_RE.test(iv.end))) {
      setError('Las horas deben tener formato HH:MM (ej. 08:00)');
      return;
    }
    saveShiftType({ ...shiftType, label: trimmed, intervals, color });
    onDone();
  }

  return (
    <View style={{ gap: 14 }}>
      <Heading>{`Editar ${shiftType.code}`}</Heading>

      <View style={{ gap: 6 }}>
        <Caption color="secondary">Nombre</Caption>
        <Field value={label} onChangeText={setLabel} placeholder="Nombre del turno" />
      </View>

      {isWork
        ? intervals.map((iv, i) => (
            <IntervalEditor
              key={`${shiftType.id}-${i}`}
              index={i}
              interval={iv}
              showRemove={intervals.length > 1}
              onChange={(next) =>
                setIntervals((prev) => prev.map((p, j) => (j === i ? next : p)))
              }
              onRemove={() => setIntervals((prev) => prev.filter((_, j) => j !== i))}
            />
          ))
        : null}

      {isWork && intervals.length < 3 ? (
        <View style={{ flexDirection: 'row' }}>
          <PillButton
            size="sm"
            label="＋ Añadir tramo"
            onPress={() =>
              setIntervals((prev) => [...prev, { start: '20:00', end: '24:00' }])
            }
          />
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Caption color="secondary">Color</Caption>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {COLOR_CHOICES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
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

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PillButton size="sm" label="Cancelar" onPress={onDone} />
        <PillButton variant="primary" label="Guardar" onPress={save} />
      </View>
    </View>
  );
}

function IntervalEditor({
  index,
  interval,
  showRemove,
  onChange,
  onRemove,
}: {
  index: number;
  interval: Interval;
  showRemove: boolean;
  onChange: (next: Interval) => void;
  onRemove: () => void;
}) {
  const colors = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Caption color="secondary">{`Tramo ${index + 1}`}</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Field
          value={interval.start}
          onChangeText={(t) => onChange({ ...interval, start: t })}
          placeholder="08:00"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1 }}
        />
        <Body>–</Body>
        <Field
          value={interval.end}
          onChangeText={(t) => onChange({ ...interval, end: t })}
          placeholder="16:00"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1 }}
        />
        {showRemove ? (
          <Pressable onPress={onRemove} hitSlop={8}>
            <Text style={{ fontSize: 18, color: colors.danger }}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
