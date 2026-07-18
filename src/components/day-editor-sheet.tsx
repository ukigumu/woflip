import { useState } from 'react';
import { View } from 'react-native';

import { Caption, Heading } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { Sheet } from '@/components/ui/sheet';
import { TimeRangeField } from '@/components/ui/time-range-field';
import { formatDayLong } from '@/lib/dates';
import { effectiveIntervals } from '@/lib/hours';
import { getShiftTypesById, setDayOverride } from '@/lib/store';
import type { Assignment, Interval } from '@/lib/types';

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
  const typesById = getShiftTypesById();
  const shiftType = typesById[assignment.shiftTypeId];
  const [intervals, setIntervals] = useState<Interval[]>(effectiveIntervals(assignment, typesById));

  function save() {
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
        <TimeRangeField
          key={`${assignment.id}-${i}`}
          value={iv}
          onChange={(next) => setIntervals((prev) => prev.map((p, j) => (j === i ? next : p)))}
        />
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PillButton size="sm" label="Horas del tipo" onPress={resetToType} />
        <View style={{ flex: 1 }} />
        <PillButton size="sm" label="Cancelar" onPress={onDone} />
        <PillButton variant="primary" size="sm" label="Guardar" onPress={save} />
      </View>
    </View>
  );
}
