import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Body } from '@/components/ui/app-text';
import { BorderWidth, Fonts, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HHMM, Interval } from '@/lib/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const HOUR_PILL_WIDTH = 48;
const PILL_GAP = 6;

// '24:00' (seed) se normaliza a 00:00: con end <= start el motor lo lee
// igual (cruza medianoche), ver hours.ts.
function parseTime(t: HHMM): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h: h === 24 ? 0 : h || 0, m: m || 0 };
}

function formatTime(h: number, m: number): HHMM {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Props {
  value: Interval;
  onChange: (next: Interval) => void;
  /** Si se pasa, muestra la ✕ de eliminar tramo. */
  onRemove?: () => void;
}

/**
 * Selector de tramo horario sin teclado: dos chips (inicio–fin) que
 * despliegan un panel de píldoras de hora y minutos al tocarlos.
 */
export function TimeRangeField({ value, onChange, onRemove }: Props) {
  const colors = useTheme();
  const [active, setActive] = useState<'start' | 'end' | null>(null);

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TimeChip
          label={value.start}
          active={active === 'start'}
          onPress={() => setActive(active === 'start' ? null : 'start')}
        />
        <Body>–</Body>
        <TimeChip
          label={value.end}
          active={active === 'end'}
          onPress={() => setActive(active === 'end' ? null : 'end')}
        />
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Eliminar tramo">
            <Text style={{ fontSize: 18, color: colors.danger }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {active ? (
        <TimePanel time={value[active]} onPick={(t) => onChange({ ...value, [active]: t })} />
      ) : null}
    </View>
  );
}

function TimeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Hora ${label}`}
      accessibilityState={{ expanded: active }}
      style={{
        flex: 1,
        borderWidth: BorderWidth,
        borderColor: colors.border,
        borderRadius: Radii.inner,
        backgroundColor: active ? colors.backgroundSelected : colors.surface,
        paddingVertical: 10,
        alignItems: 'center',
      }}>
      <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 15, color: colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TimePanel({ time, onPick }: { time: HHMM; onPick: (t: HHMM) => void }) {
  const colors = useTheme();
  const { h, m } = parseTime(time);
  const scrollRef = useRef<ScrollView>(null);

  // Minutos fuera de los cuartos (overrides antiguos): se añade como opción.
  const minutes = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort((a, b) => a - b);

  return (
    <View
      style={{
        gap: PILL_GAP,
        padding: Spacing.two,
        borderWidth: BorderWidth,
        borderColor: colors.border,
        borderRadius: Radii.inner,
        backgroundColor: colors.backgroundElement,
      }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={() => {
          // Centra aprox. la hora elegida al abrir el panel.
          scrollRef.current?.scrollTo({
            x: Math.max(0, h * (HOUR_PILL_WIDTH + PILL_GAP) - HOUR_PILL_WIDTH * 2),
            animated: false,
          });
        }}
        contentContainerStyle={{ gap: PILL_GAP }}>
        {HOURS.map((hour) => (
          <OptionPill
            key={hour}
            label={String(hour).padStart(2, '0')}
            selected={hour === h}
            width={HOUR_PILL_WIDTH}
            onPress={() => onPick(formatTime(hour, m))}
          />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: PILL_GAP }}>
        {minutes.map((minute) => (
          <OptionPill
            key={minute}
            label={`:${String(minute).padStart(2, '0')}`}
            selected={minute === m}
            grow
            onPress={() => onPick(formatTime(h, minute))}
          />
        ))}
      </View>
    </View>
  );
}

function OptionPill({
  label,
  selected,
  onPress,
  width,
  grow,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  width?: number;
  grow?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        width,
        flex: grow ? 1 : undefined,
        borderWidth: BorderWidth,
        borderColor: colors.border,
        borderRadius: Radii.pill,
        backgroundColor: selected ? colors.text : colors.surface,
        paddingVertical: 8,
        alignItems: 'center',
      }}>
      <Text
        style={{
          fontFamily: Fonts.bodyMedium,
          fontSize: 14,
          color: selected ? colors.onInverse : colors.text,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
