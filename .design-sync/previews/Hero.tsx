import { Caption, Hero } from 'woflip';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, padding: 8 };

export const NumeroHeroe = () => (
  <div style={col}>
    <Hero>32,5 h</Hero>
    <Caption color="secondary">trabajadas este mes</Caption>
  </div>
);

export const Colores = () => (
  <div style={col}>
    <Hero>Libras hoy</Hero>
    <Hero color="secondary">08:00–16:00</Hero>
  </div>
);
