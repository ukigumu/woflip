import { Body, Caption, Screen, Title } from 'woflip';

// Screen es flex:1 — necesita un padre con alto fijo para no colapsar.
const marco: React.CSSProperties = {
  height: 420,
  width: 390,
  display: 'flex',
  overflow: 'hidden',
  borderRadius: 12,
};

export const ConScroll = () => (
  <div style={marco}>
    <Screen>
      <Title>Hoy</Title>
      <Body>Turno de mañana · 08:00–16:00</Body>
      <Body color="secondary">Luego libras hasta el sábado.</Body>
      <Caption color="secondary">32,5 h este mes</Caption>
    </Screen>
  </div>
);

export const SinScroll = () => (
  <div style={marco}>
    <Screen scroll={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
        <Title>Semana</Title>
        <Body color="secondary">Contenido fijo, sin scroll (scroll=false).</Body>
      </div>
    </Screen>
  </div>
);
