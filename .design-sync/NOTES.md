# design-sync notes — WoFlip

- Este repo es una app Expo (SDK 57, RN 0.86), NO una librería: no hay `dist/` ni Storybook. El bundle se genera desde un entry manual que exporta `src/components/`, compilado con alias `react-native` → `react-native-web`.
- Alcance acordado con el usuario (2026-07-18): **solo componentes web-compatibles**.
  - Excluidos: `ui/sheet.tsx` (BottomSheet de `@expo/ui`, SwiftUI/Compose nativo — irrenderizable en web), `day-editor-sheet.tsx` y `shift-type-editor-sheet.tsx` (dependen de Sheet y de `lib/store`), `swap-request-wizard.tsx` (depende de `lib/store` → `expo-sqlite`).
  - Incluidos: `ui/app-text`, `ui/avatar`, `ui/field`, `ui/hard-card`, `ui/pill-button`, `ui/screen`, `ui/segmented`, `ui/tab-bar`, `ui/time-range-field`, `day-row`.
  - `screen.tsx` menciona `@expo/ui` solo en un comentario — sí es web-compatible.
- Dependencias con superficie web a vigilar: `react-native-reanimated` (tab-bar, day-row), `react-native-safe-area-context` (screen, tab-bar), `@hugeicons/react-native` + `react-native-svg` (pill-button, tab-bar), `expo-image` (avatar).
- Tokens: `src/constants/theme.ts` y `src/constants/palette.ts`. Tema vía hook `useTheme` (`src/hooks/use-theme`).
- Fuentes: Google Fonts Inter y Nunito vía `@expo-google-fonts/*`.
- Package manager: pnpm 10 (`pnpm i --frozen-lockfile`), node >= 22.

## Cómo se compila (no hay dist/)
- Entry manual `.design-sync/entry.ts` pasado con `--entry ./.design-sync/entry.ts` — NO usar el synth-entry del conversor: haría `export *` de todo `src/` y arrastraría `@expo/ui` y `expo-sqlite`.
- Comando: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/entry.ts --out ./ds-bundle`.
- Alias en `.design-sync/tsconfig.sync.json` (el plugin de paths del conversor los aplica a todo el grafo): `react-native` → react-native-web; shims propios en `.design-sync/shims/` para `react-native-reanimated` (importa Flow interno de RN que esbuild no parsea; el shim salta al estado final de la animación forzando re-render al asignar `.value`), `@hugeicons/react-native` (el real usa react-native-svg, cuyo build web depende de la resolución `.web.js` de Metro; el shim pinta <svg> DOM con los datos [tag, attrs] de core-free-icons), `react-native-safe-area-context` (insets 0) y `expo-image` (→ Image de RNW; en la app solo se usa `source={{uri}}`).
- Fuentes: `.design-sync/fonts.css` con @font-face apuntando a los .ttf de `@expo-google-fonts/*` en node_modules, vía `extraFonts`.
- `shims/stylesheet-seed.js` es el PRIMER import de `entry.ts` y debe seguir siéndolo: siembra `<style id="react-native-stylesheet">` al final del body para que RNW lo adopte ahí. Sin él, RNW lo crea al principio del head y el render-check del conversor (`[id^="r"]`) lo confunde con el primer mount → falso `[RENDER] root empty` en TODAS las tarjetas.
- `cfg.overrides`: Screen y AppTabBar en `cardMode: column` (historias más anchas que la celda del grid).

## Estados no capturables (previews)
- TimeRangeField: el panel de píldoras hora/minuto solo aparece tras click en un chip (estado interno `active`) — sin celda para ese estado.
- PillButton pressed (hundimiento de sombra) y hover: no capturables estáticamente.

## Known render warns
- `[CSS_RUNTIME]` — esperado: react-native-web inyecta estilos en runtime; no hay CSS estático del paquete.

## Re-sync risks
- Los shims duplican superficie de API: si la app empieza a usar props nuevas de reanimated/hugeicons/expo-image/safe-area (p. ej. `withRepeat`, `contentFit`), el shim correspondiente en `.design-sync/shims/` hay que ampliarlo a mano — el build fallará (export ausente) o renderizará mal.
- `entry.ts` es una enumeración manual: un componente nuevo en `src/components/` NO entra al bundle hasta añadirlo ahí y a `componentSrcMap`.
- Los datos de turnos en previews (tipos M/T/P/L) espejan el seed de la app; si cambia el seed, las previews no lo detectan.
- Upgrade de RN/Expo puede mover los entry points aliaseados en `tsconfig.sync.json` (rutas dist/ concretas de react-native-web).
