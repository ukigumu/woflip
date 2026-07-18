import { Caption } from 'woflip';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, padding: 8 };

export const Etiqueta = () => (
  <div style={col}>
    <Caption>Semana del 13 al 19 de julio</Caption>
  </div>
);

export const Colores = () => (
  <div style={col}>
    <Caption>3 compañeros libran hoy</Caption>
    <Caption color="secondary">Actualizado hace 5 min</Caption>
  </div>
);
