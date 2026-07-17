import { useState } from 'react';
import { View } from 'react-native';

import { Body, Caption, Heading } from '@/components/ui/app-text';
import { Field } from '@/components/ui/field';
import { PillButton } from '@/components/ui/pill-button';
import { Sheet } from '@/components/ui/sheet';
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

/** Sheet del long-press: horas exactas de un día concreto (override). */
export function DayEditorSheet({ assignment, onDismiss }: Props) {
  return (
    <Sheet visible={assignment !== null} onDismiss={onDismiss}>
      {assignment ? (
        <EditorBody key={assignment.id} assignment={assignment} onDone={onDismiss} />
      ) : null}
    </Sheet>
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
    <View style={{ gap: 14 }}>
      <Heading>{`${shiftType?.label ?? ''} · ${formatDayLong(assignment.date)}`}</Heading>
      <Caption color="secondary">
        Cambia las horas solo de este día. El turno-tipo no se toca.
      </Caption>

      {intervals.map((iv, i) => (
        <View key={`${assignment.id}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Field
            value={iv.start}
            onChangeText={(t) =>
              setIntervals((prev) => prev.map((p, j) => (j === i ? { ...p, start: t } : p)))
            }
            placeholder="08:00"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1 }}
          />
          <Body>–</Body>
          <Field
            value={iv.end}
            onChangeText={(t) =>
              setIntervals((prev) => prev.map((p, j) => (j === i ? { ...p, end: t } : p)))
            }
            placeholder="16:00"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1 }}
          />
        </View>
      ))}

      {error ? <Caption color={colors.danger}>{error}</Caption> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PillButton size="sm" label="Horas del tipo" onPress={resetToType} />
        <View style={{ flex: 1 }} />
        <PillButton size="sm" label="Cancelar" onPress={onDone} />
        <PillButton variant="primary" size="sm" label="Guardar" onPress={save} />
      </View>
    </View>
  );
}
