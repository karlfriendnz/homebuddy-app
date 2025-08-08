/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import Colors from '../constants/Colors';
import { useColorScheme } from 'react-native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  // Add safety checks
  if (!Colors || !Colors[theme]) {
    console.error('Colors or theme not available:', { Colors, theme });
    return '#000000'; // Fallback color
  }

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
