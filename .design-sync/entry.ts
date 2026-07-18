// design-sync bundle entry — solo los componentes web-compatibles acordados
// (sheet.tsx usa @expo/ui nativo; los editores y el wizard dependen de él o de
// expo-sqlite, así que quedan fuera). Los tokens se exportan para que el
// design agent pueda usarlos desde window.Woflip.*.
import './shims/stylesheet-seed';

export { Body, Caption, Heading, Hero, Title } from '../src/components/ui/app-text';
export { Avatar } from '../src/components/ui/avatar';
export { Field } from '../src/components/ui/field';
export { HardCard } from '../src/components/ui/hard-card';
export { PillButton } from '../src/components/ui/pill-button';
export { Screen } from '../src/components/ui/screen';
export { Segmented } from '../src/components/ui/segmented';
export { AppTabBar } from '../src/components/ui/tab-bar';
export { TimeRangeField } from '../src/components/ui/time-range-field';
export { DayRow } from '../src/components/day-row';

export { Palette, ShiftPalette } from '../src/constants/palette';
export {
  BorderWidth,
  BottomTabInset,
  Colors,
  Fonts,
  MaxContentWidth,
  Radii,
  Spacing,
  Type,
} from '../src/constants/theme';
export { useTheme } from '../src/hooks/use-theme';
