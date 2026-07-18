import { Heading } from 'woflip';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 8 };

export const Encabezado = () => (
  <div style={col}>
    <Heading>Quién libra hoy</Heading>
  </div>
);

export const Colores = () => (
  <div style={col}>
    <Heading>Turnos de la semana</Heading>
    <Heading color="secondary">Sin datos todavía</Heading>
  </div>
);
