// Shim web de @hugeicons/react-native para el bundle de design-sync: el
// paquete real renderiza vía react-native-svg, cuyo build depende de la
// resolución .web.js de Metro. Los datos de @hugeicons/core-free-icons son
// pares [tag, attrs] con atributos camelCase — React DOM los pinta tal cual.
import { createElement } from 'react';

export function HugeiconsIcon({
  icon,
  size = 24,
  color = 'currentColor',
  strokeWidth,
  style,
  ...rest
}) {
  const children = (icon || []).map(([tag, attrs]) => {
    const a = { ...attrs };
    if (strokeWidth != null) a.strokeWidth = strokeWidth;
    return createElement(tag, a);
  });
  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      style: { color, flexShrink: 0, ...style },
      ...rest,
    },
    children,
  );
}
