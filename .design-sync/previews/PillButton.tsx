import { PillButton } from 'woflip';

const fila: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 14,
  padding: 8,
};

export const Variantes = () => (
  <div style={fila}>
    <PillButton label="Guardar cambios" variant="primary" onPress={() => {}} />
    <PillButton label="Proponer cambio" variant="accent" onPress={() => {}} />
    <PillButton label="Cancelar" variant="ghost" onPress={() => {}} />
    <PillButton label="Salir del grupo" variant="danger" onPress={() => {}} />
  </div>
);

export const Tamanos = () => (
  <div style={fila}>
    <PillButton label="Copiar semana anterior" variant="accent" size="md" onPress={() => {}} />
    <PillButton label="Hoy" variant="ghost" size="sm" onPress={() => {}} />
  </div>
);

export const ConIcono = () => (
  <div style={fila}>
    <PillButton icon="arrow-left" accessibilityLabel="Semana anterior" variant="ghost" onPress={() => {}} />
    <PillButton icon="arrow-right" label="Siguiente" variant="primary" onPress={() => {}} />
  </div>
);
