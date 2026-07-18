import { Title } from 'woflip';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 8 };

export const Titular = () => (
  <div style={col}>
    <Title>Esta semana</Title>
  </div>
);

export const Colores = () => (
  <div style={col}>
    <Title>32,5 h este mes</Title>
    <Title color="secondary">Semana del 13 al 19</Title>
  </div>
);
