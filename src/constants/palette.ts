/**
 * Paleta de marca Woflip — "neo-brutalismo cálido" heredado de la web de
 * Woblip (papel crema + ink) con ancla lavanda propia (color del icono).
 * Módulo puro sin dependencias de react-native (importable desde src/lib).
 */

export const Palette = {
  primary: '#D7BDF6', // lavanda marca
  primaryDeep: '#B392E8', // lavanda profunda: acentos
  paper: '#FAF9F5', // papel crema (como la web Woblip)
  ink: '#2E2E2E', // negro suave: texto, bordes y sombras duras
  sun: '#FFD983', // amarillo sol
  coral: '#FFB3A7', // coral
  mint: '#C1F6BD', // verde Woblip (éxito / puente de marca)
  sky: '#C9D9FF', // azul periwinkle
} as const;

// Colores por código de turno (M/T/P/L). Son "pegatinas": mismos colores en
// light y dark, siempre con texto ink encima. L es descanso: tono neutro.
export const ShiftPalette = {
  M: { bg: Palette.sun, text: Palette.ink }, // Mañana
  T: { bg: Palette.primary, text: Palette.ink }, // Tarde
  P: { bg: Palette.coral, text: Palette.ink }, // Partido
  L: { bg: '#E8E6DD', text: '#6B6B66' }, // Libre
} as const;
