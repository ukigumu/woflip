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
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { formatDayLong } from '@/lib/dates';
import { effectiveIntervals } from '@/lib/hours';
import { getShiftTypesById, setDayOverride } from '@/lib/store';
import type { Assignment, Interval } from '@/lib/types';

const HHMM_RE = /^([01]?\d|2[0-4]):[0-5]\d$/;

interface Props {
  /** Assignment (de trabajo) cuyas horas de ESE día se editan; null = cerrado. */
  assignment: Assignment | null;
  onDismiss: () => void;
}

/** BottomSheet del long-press: horas exactas de un día concreto (override). */
export function DayEditorSheet({ assignment, onDismiss }: Props) {
  return (
    <BottomSheet isPresented={assignment !== null} onDismiss={onDismiss}>
      {assignment ? (
        <EditorBody key={assignment.id} assignment={assignment} onDone={onDismiss} />
      ) : null}
    </BottomSheet>
  );
}

function EditorBody({ assignment, onDone }: { assignment: Assignment; onDone: () => void }) {
  const colors = useTheme();
  const typesById = getShiftTypesById();
  const shiftType = typesById[assignment.shiftTypeId];
  const [intervals, setIntervals] = useState<Interval[]>(effectiveIntervals(assignment, typesById));
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (intervals.some((iv) => !HHMM_RE.test(iv.start) || !HHMM_RE.test(iv.end))) {
      setError('Las horas deben tener formato HH:MM (ej. 08:00)');
      return;
    }
    setDayOverride(assignment.memberId, assignment.date, intervals);
    onDone();
  }

  function resetToType() {
    setDayOverride(assignment.memberId, assignment.date, null);
    onDone();
  }

  return (
    <Column spacing={16} style={{ padding: 20 }}>
      <Text textStyle={{ fontSize: 18, fontWeight: '700' }}>
        {`${shiftType?.label ?? ''} · ${formatDayLong(assignment.date)}`}
      </Text>
      <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
        Cambia las horas solo de este día. El turno-tipo no se toca.
      </Text>

      {intervals.map((iv, i) => (
        <IntervalRow
          key={`${assignment.id}-${i}`}
          interval={iv}
          onChange={(next) => setIntervals((prev) => prev.map((p, j) => (j === i ? next : p)))}
        />
      ))}

      {error ? <Text textStyle={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

      <Row spacing={12}>
        <Button variant="text" label="Horas del tipo" onPress={resetToType} />
        <Spacer />
        <Button variant="text" label="Cancelar" onPress={onDone} />
        <Button variant="filled" label="Guardar" onPress={save} />
      </Row>
    </Column>
  );
}

function IntervalRow({
  interval,
  onChange,
}: {
  interval: Interval;
  onChange: (next: Interval) => void;
}) {
  const start = useNativeState(interval.start);
  const end = useNativeState(interval.end);

  return (
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
    </Row>
  );
}
