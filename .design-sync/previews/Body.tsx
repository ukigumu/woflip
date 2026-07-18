import { Body } from 'woflip';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 8, maxWidth: 420 };

export const Parrafo = () => (
  <div style={col}>
    <Body>Marta te propone cambiar su turno de tarde del viernes por tu mañana del sábado.</Body>
  </div>
);

export const Colores = () => (
  <div style={col}>
    <Body>Turno de mañana · 08:00–16:00</Body>
    <Body color="secondary">Nadie más libra ese día.</Body>
  </div>
);
