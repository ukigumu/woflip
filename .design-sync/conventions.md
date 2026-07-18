# Woflip — convenciones de uso

Componentes React Native Web de la app Woflip (organización de turnos de hostelería). Lenguaje visual: **neo-brutalismo cálido** — fondo papel crema, bordes ink de 1.5px, sombras duras sin blur, píldoras.

## Sin provider

No hay wrapper obligatorio: los componentes funcionan sueltos. El tema (light/dark) sigue `prefers-color-scheme` automáticamente vía el hook `useTheme`.

## Idioma de estilo: props y objetos de estilo, NUNCA clases CSS

Este sistema no tiene clases de utilidad ni CSS por clase. Los componentes se estilan por props; el glue propio (layouts que tú escribas) va con estilos inline/flexbox usando los tokens JS:

- `Colors.light` / `Colors.dark` — semánticos: `text`, `textSecondary`, `background`, `surface`, `backgroundElement`, `backgroundSelected`, `border`, `shadow`, `accent`, `accentDeep`, `danger`, `success`, `warning`, `onInverse`.
- `Palette` — marca: `primary` (lavanda #D7BDF6), `primaryDeep`, `paper` (#FAF9F5), `ink` (#2E2E2E), `sun`, `coral`, `mint`, `sky`.
- `ShiftPalette` — colores por código de turno: `M` (sol), `T` (lavanda), `P` (coral), `L` (neutro), cada uno `{bg, text}`.
- `Fonts` — familias: `display` (Nunito_800ExtraBold), `displaySemi` (Nunito_700Bold), `body` (Inter_400Regular), `bodyMedium` (Inter_600SemiBold), `bodyBold` (Inter_700Bold). Las @font-face vienen en `styles.css`; usa siempre `Fonts.*`, nunca strings sueltos.
- `Type` — escala tipográfica por rol (hero/title/heading/body/caption); mejor usa los componentes `Hero/Title/Heading/Body/Caption`.
- `Spacing`, `Radii`, `BorderWidth` (1.5), `MaxContentWidth` — layout. Sombra dura: offset 3–4px del color `shadow`, sin blur.

## Dónde está la verdad

Lee `styles.css` (fuentes) y el `.d.ts` + `.prompt.md` de cada componente. Los tokens JS de arriba son exports reales del bundle (`Palette`, `Colors`, `Fonts`, `Type`, `Spacing`, `Radii`, `ShiftPalette`, `useTheme`).

## Ejemplo idiomático

```jsx
import { Screen, Title, Caption, DayRow, PillButton, ShiftPalette } from 'woflip';

const tipos = {
  m: { id: 'm', code: 'M', label: 'Mañana', kind: 'work',
       intervals: [{ start: '08:00', end: '16:00' }], color: ShiftPalette.M.bg, sortOrder: 0 },
};

export default function Semana() {
  return (
    <Screen>
      <Title>Esta semana</Title>
      <Caption color="secondary">32,5 h · Semana del 13 al 19</Caption>
      <DayRow date="2026-07-13" assignment={{ id: 'me:2026-07-13', memberId: 'me', date: '2026-07-13', shiftTypeId: 'm' }}
        shiftTypesById={tipos} isToday onCycle={() => {}} onEditHours={() => {}} />
      <PillButton label="Copiar semana anterior" variant="accent" onPress={() => {}} />
    </Screen>
  );
}
```

## Gotchas de composición

- Para apilar varios `Body`/`Caption`/`Title` dentro de un `<div>` propio, el contenedor necesita `display:'flex', flexDirection:'column'` — los Text de react-native-web no se apilan en un div plano.
- Imágenes con data-URI svg (p. ej. en `Avatar photoUri`): siempre en base64 (`data:image/svg+xml;base64,…`); la forma utf8 renderiza un bloque negro.

## Límites conocidos

- Las animaciones (DayRow, AppTabBar) son estáticas en web: saltan al estado final.
- `AppTabBar` se posiciona `position:absolute; bottom` — colócalo dentro de un contenedor `position:relative` con altura.
- No hay bottom-sheet en este bundle (el de la app es SwiftUI/Compose nativo): para modales/sheets compón con `HardCard` sobre un overlay propio.
