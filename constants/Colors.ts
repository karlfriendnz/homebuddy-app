/**
 * HomeBuddy Color System
 * This file provides color constants that align with our global design system.
 * For comprehensive styling, use the global styles from '../../styles/global'
 */

import { colors } from '../styles/global';

// Legacy color constants for backward compatibility
const tintColorLight = colors.primary[500];
const tintColorDark = colors.text.inverse;

export default {
  light: {
    text: colors.text.primary,
    background: colors.background,
    icon: colors.neutral[500],
    tabIconDefault: colors.neutral[500],
  },
  dark: {
    text: colors.text.inverse,
    background: colors.neutral[900],
    icon: colors.neutral[400],
    tabIconDefault: colors.neutral[400],
  },
};

// Export our global colors for easy access
export { colors };