import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { PropsWithChildren } from 'react';

import { Type, type TypeRole } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** 'secondary' usa textSecondary; cualquier string es un color literal. */
  color?: 'text' | 'secondary' | (string & {});
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

function makeRole(role: TypeRole) {
  return function RoleText({ children, color = 'text', style, numberOfLines }: PropsWithChildren<Props>) {
    const colors = useTheme();
    const resolved =
      color === 'text' ? colors.text : color === 'secondary' ? colors.textSecondary : color;
    return (
      <Text numberOfLines={numberOfLines} style={[Type[role], { color: resolved }, style]}>
        {children}
      </Text>
    );
  };
}

/** Escala tipográfica de la app: Nunito para display, Inter para cuerpo. */
export const Hero = makeRole('hero');
export const Title = makeRole('title');
export const Heading = makeRole('heading');
export const Body = makeRole('body');
export const Caption = makeRole('caption');
