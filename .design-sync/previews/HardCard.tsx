import { Body, Caption, HardCard, Heading, ShiftPalette } from 'woflip';

const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 8,
  maxWidth: 340,
};

const pad: React.CSSProperties = {
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

export const Basica = () => (
  <div style={col}>
    <HardCard>
      <div style={pad}>
        <Heading>Este mes</Heading>
        <Body color="secondary">142 h · 18 días trabajados</Body>
      </div>
    </HardCard>
  </div>
);

export const Sticker = () => (
  <div style={col}>
    <HardCard color={ShiftPalette.M.bg} shadowOffset={4}>
      <div style={pad}>
        <Heading>Mañana</Heading>
        <Caption>08:00–16:00</Caption>
      </div>
    </HardCard>
    <HardCard color={ShiftPalette.P.bg} shadowOffset={4}>
      <div style={pad}>
        <Heading>Partido</Heading>
        <Caption>12:00–16:00 · 20:00–00:00</Caption>
      </div>
    </HardCard>
  </div>
);

export const Pulsable = () => (
  <div style={col}>
    <HardCard onPress={() => {}} accessibilityRole="button" accessibilityLabel="Ver detalle">
      <div style={pad}>
        <Body>Ofrecer mi turno del sábado</Body>
      </div>
    </HardCard>
  </div>
);
