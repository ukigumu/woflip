import { DayRow, ShiftPalette } from 'woflip';

// Turnos-tipo del seed de la app: M/T/P/L con los colores sticker.
const tipos = {
  m: {
    id: 'm',
    code: 'M',
    label: 'Mañana',
    kind: 'work',
    intervals: [{ start: '08:00', end: '16:00' }],
    color: ShiftPalette.M.bg,
    sortOrder: 0,
  },
  t: {
    id: 't',
    code: 'T',
    label: 'Tarde',
    kind: 'work',
    intervals: [{ start: '16:00', end: '00:00' }],
    color: ShiftPalette.T.bg,
    sortOrder: 1,
  },
  p: {
    id: 'p',
    code: 'P',
    label: 'Partido',
    kind: 'work',
    intervals: [
      { start: '12:00', end: '16:00' },
      { start: '20:00', end: '00:00' },
    ],
    color: ShiftPalette.P.bg,
    sortOrder: 2,
  },
  l: {
    id: 'l',
    code: 'L',
    label: 'Libre',
    kind: 'rest',
    intervals: [],
    color: ShiftPalette.L.bg,
    sortOrder: 3,
  },
};

const asg = (date: string, shiftTypeId: string, overrideIntervals?: unknown) => ({
  id: `me:${date}`,
  memberId: 'me',
  date,
  shiftTypeId,
  ...(overrideIntervals ? { overrideIntervals } : {}),
});

const col: React.CSSProperties = { maxWidth: 420, padding: 8 };
const noop = () => {};

export const SemanaTipo = () => (
  <div style={col}>
    <DayRow date="2026-07-13" assignment={asg('2026-07-13', 'm')} shiftTypesById={tipos} isToday={false} onCycle={noop} onEditHours={noop} />
    <DayRow date="2026-07-14" assignment={asg('2026-07-14', 't')} shiftTypesById={tipos} isToday={true} onCycle={noop} onEditHours={noop} />
    <DayRow date="2026-07-15" assignment={asg('2026-07-15', 'p')} shiftTypesById={tipos} isToday={false} onCycle={noop} onEditHours={noop} />
    <DayRow date="2026-07-16" assignment={asg('2026-07-16', 'l')} shiftTypesById={tipos} isToday={false} onCycle={noop} onEditHours={noop} />
  </div>
);

export const SinAsignar = () => (
  <div style={col}>
    <DayRow date="2026-07-17" assignment={undefined} shiftTypesById={tipos} isToday={false} onCycle={noop} onEditHours={noop} />
  </div>
);

export const HorasEditadas = () => (
  <div style={col}>
    <DayRow
      date="2026-07-18"
      assignment={asg('2026-07-18', 'm', [{ start: '09:00', end: '15:00' }])}
      shiftTypesById={tipos}
      isToday={false}
      onCycle={noop}
      onEditHours={noop}
    />
  </div>
);
