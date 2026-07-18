import { Field } from 'woflip';

const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 8,
  maxWidth: 340,
};

export const ConTexto = () => (
  <div style={col}>
    <Field value="Cafetería La Plaza" onChangeText={() => {}} />
  </div>
);

export const ConPlaceholder = () => (
  <div style={col}>
    <Field placeholder="Nombre del turno (p. ej. Mañana)" onChangeText={() => {}} />
  </div>
);
