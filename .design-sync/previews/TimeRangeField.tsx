import { TimeRangeField } from 'woflip';

const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 8,
  maxWidth: 340,
};

export const Tramo = () => (
  <div style={col}>
    <TimeRangeField value={{ start: '08:00', end: '16:00' }} onChange={() => {}} />
  </div>
);

export const TramoPartido = () => (
  <div style={col}>
    <TimeRangeField value={{ start: '12:00', end: '16:00' }} onChange={() => {}} />
    <TimeRangeField
      value={{ start: '20:00', end: '00:00' }}
      onChange={() => {}}
      onRemove={() => {}}
    />
  </div>
);
