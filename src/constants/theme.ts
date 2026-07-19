/**
 * Tokens de diseño de Woflip — lenguaje "neo-brutalista cálido":
 * papel crema, bordes ink de 1.5px, sombras duras sin blur y píldoras.
 * En dark la sombra dura desaparece (transparente): las cards van planas,
 * definidas solo por su borde crema. El desplazamiento al pulsar se mantiene.
 */

import { Palette } from './palette';

export { Palette, ShiftPalette } from './palette';

export const Colors = {
  light: {
    text: Palette.ink,
    textSecondary: '#6B6B66',
    background: Palette.paper,
    surface: '#FFFFFF',
    backgroundElement: '#F1EDE7',
    backgroundSelected: '#EFE5FB', // lavanda muy suave (hoy, selección)
    border: Palette.ink,
    shadow: Palette.ink,
    accent: Palette.primary,
    accentDeep: Palette.primaryDeep,
    danger: '#C0392B',
    success: '#2E7D32',
    warning: '#B8860B',
    /** Texto sobre superficies "invertidas" (botón primario ink). */
    onInverse: Palette.paper,
  },
  dark: {
    text: '#F1EDE7',
    textSecondary: '#A8A49C',
    // Fondo elevado un paso: deja aire para que la sombra negra lea como
    // profundidad (una sombra dura necesita ser más oscura que su fondo).
    background: '#2A2825',
    surface: '#34312C',
    backgroundElement: '#3A3731',
    backgroundSelected: '#463F58', // lavanda apagada sobre oscuro
    border: '#F1EDE7',
    shadow: 'transparent',
    accent: Palette.primary,
    accentDeep: Palette.primaryDeep,
    danger: '#E57368',
    success: '#8CD98F',
    warning: '#E4B04A',
    onInverse: Palette.ink,
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

/** Familias tipográficas cargadas en _layout (Google Fonts). */
export const Fonts = {
  /** Titulares, números héroe, marca. */
  display: 'Nunito_800ExtraBold',
  displaySemi: 'Nunito_700Bold',
  /** Cuerpo. */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Escala tipográfica: 5 roles, nada de tamaños ad-hoc. */
export const Type = {
  hero: { fontSize: 34, lineHeight: 38, fontFamily: Fonts.display },
  title: { fontSize: 22, fontFamily: Fonts.display },
  heading: { fontSize: 17, fontFamily: Fonts.bodyBold },
  body: { fontSize: 15, fontFamily: Fonts.body },
  caption: { fontSize: 13, fontFamily: Fonts.body },
} as const;

export type TypeRole = keyof typeof Type;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  card: 18,
  inner: 12,
  pill: 999,
} as const;

/** Grosor de borde firma del estilo (como la web: 1.5px ink). */
export const BorderWidth = 1.5;

/** Hueco inferior que dejan las pantallas para la tab bar flotante propia. */
export const BottomTabInset = 96;
export const MaxContentWidth = 800;
