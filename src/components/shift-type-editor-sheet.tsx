import {
  BottomSheet,
  Button,
  Column,
  Row,
  Spacer,
  Text,
  TextInput,
  useNativeState,
} from '@expo/ui';
import { useRef, useState } from 'react';

import { Palette, ShiftPalette } from '@/constants/palette';
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

/** BottomSheet de edición de un turno-tipo (label, tramos y color). */
export function ShiftTypeEditorSheet({ shiftType, onDismiss }: Props) {
  return (
    <BottomSheet isPresented={shiftType !== null} onDismiss={onDismiss}>
      {shiftType ? (
        // key: remonta el editor (y sus useNativeState) al cambiar de turno.
        <EditorBody key={shiftType.id} shiftType={shiftType} onDone={onDismiss} />
      ) : null}
    </BottomSheet>
  );
}

function EditorBody({ shiftType, onDone }: { shiftType: ShiftType; onDone: () => void }) {
  const colors = useTheme();
  const label = useNativeState(shiftType.label);
  // Copia editable de los valores (los TextInput notifican por onChangeText).
  const labelRef = useRef(shiftType.label);
  const [intervals, setIntervals] = useState<Interval[]>(shiftType.intervals);
  const [color, setColor] = useState(shiftType.color);
  const [error, setError] = useState<string | null>(null);

  const isWork = shiftType.kind === 'work';

  function save() {
    const trimmed = labelRef.current.trim();
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
    <Column spacing={16} style={{ padding: 20 }}>
      <Text textStyle={{ fontSize: 18, fontWeight: '700' }}>{`Editar ${shiftType.code}`}</Text>

      <Column spacing={6}>
        <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>Nombre</Text>
        <TextInput
          value={label}
          onChangeText={(t) => {
            labelRef.current = t;
          }}
          placeholder="Nombre del turno"
        />
      </Column>

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
        <Button
          variant="text"
          label="＋ Añadir tramo"
          onPress={() =>
            setIntervals((prev) => [...prev, { start: '20:00', end: '24:00' }])
          }
        />
      ) : null}

      <Column spacing={6}>
        <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>Color</Text>
        <Row spacing={10}>
          {COLOR_CHOICES.map((c) => (
            <Column
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 1,
                borderColor: color === c ? colors.border : colors.textSecondary,
              }}
            />
          ))}
        </Row>
      </Column>

      {error ? <Text textStyle={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

      <Row spacing={12}>
        <Button variant="text" label="Cancelar" onPress={onDone} />
        <Spacer />
        <Button variant="filled" label="Guardar" onPress={save} />
      </Row>
    </Column>
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
  const start = useNativeState(interval.start);
  const end = useNativeState(interval.end);

  return (
    <Column spacing={6}>
      <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{`Tramo ${index + 1}`}</Text>
      <Row spacing={10}>
        <TextInput
          value={start}
          onChangeText={(t) => onChange({ ...interval, start: t })}
          placeholder="08:00"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text>–</Text>
        <TextInput
          value={end}
          onChangeText={(t) => onChange({ ...interval, end: t })}
          placeholder="16:00"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showRemove ? <Button variant="text" label="✕" onPress={onRemove} /> : null}
      </Row>
    </Column>
  );
}
