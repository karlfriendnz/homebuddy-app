import { StyleSheet, Platform } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Colors
  primary: {
    50: '#f3f0ff',
    100: '#e8e3ff',
    200: '#d1c7ff',
    300: '#b39dff',
    400: '#8b5cf6',
    500: '#511eb9', // Main brand color
    600: '#4c1d95',
    700: '#3d1a7a',
    800: '#2e1460',
    900: '#1f0e47',
  },

  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Semantic Colors
  background: '#ffffff',
  surface: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  border: '#e5e7eb',
  divider: '#f3f4f6',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font Weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// ============================================================================
// LAYOUT
// ============================================================================

export const layout = {
  // Screen padding
  screenPadding: spacing[6],
  
  // Container max width
  maxWidth: 1200,
  
  // Header height
  headerHeight: 60,
  
  // Tab bar height
  tabBarHeight: 80,
  
  // Button heights
  buttonHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },
  
  // Input heights
  inputHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const componentStyles = StyleSheet.create({
  // ============================================================================
  // CONTAINERS
  // ============================================================================
  
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'web' ? 0 : 30, 
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding,
  },
  
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[6],
    ...shadows.base,
  },
  
  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  
  text: {
    color: colors.text.primary,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  
  textXs: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * typography.lineHeight.normal,
  },
  
  textSm: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  
  textLg: {
    fontSize: typography.size.lg,
    lineHeight: typography.size.lg * typography.lineHeight.normal,
  },
  
  textXl: {
    fontSize: typography.size.xl,
    lineHeight: typography.size.xl * typography.lineHeight.normal,
  },
  
  text2xl: {
    fontSize: typography.size['2xl'],
    lineHeight: typography.size['2xl'] * typography.lineHeight.tight,
  },
  
  text3xl: {
    fontSize: typography.size['3xl'],
    lineHeight: typography.size['3xl'] * typography.lineHeight.tight,
  },
  
  // Font weights
  fontNormal: {
    fontWeight: typography.weight.normal,
  },
  
  fontMedium: {
    fontWeight: typography.weight.medium,
  },
  
  fontSemibold: {
    fontWeight: typography.weight.semibold,
  },
  
  fontBold: {
    fontWeight: typography.weight.bold,
  },
  
  // Text colors
  textPrimary: {
    color: colors.text.primary,
  },
  
  textSecondary: {
    color: colors.text.secondary,
  },
  
  textTertiary: {
    color: colors.text.tertiary,
  },
  
  textInverse: {
    color: colors.text.inverse,
  },
  
  textPrimaryColor: {
    color: colors.primary[500],
  },
  
  textSuccess: {
    color: colors.success[500],
  },
  
  textWarning: {
    color: colors.warning[500],
  },
  
  textError: {
    color: colors.error[500],
  },

  // Text alignment styles
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  
  // ============================================================================
  // BUTTONS
  // ============================================================================
  
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight.md,
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary[500],
    ...shadows.primary,
  },
  
  buttonSecondary: {
    backgroundColor: colors.neutral[100],
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
    ...shadows.sm,
  },
  
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  
  buttonTextPrimary: {
    color: colors.text.inverse,
  },
  
  buttonTextSecondary: {
    color: colors.text.primary,
  },
  
  buttonTextOutline: {
    color: colors.primary[500],
  },
  
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  
  // ============================================================================
  // INPUTS
  // ============================================================================
  
  // Type 1: Simple text input (border on input field itself)
  inputSimple: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 6,
    paddingHorizontal: spacing[3],
    height: 44,
    backgroundColor: colors.neutral[50],
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  
  // Type 2: Input with icon (border on container, transparent input)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 6,
    paddingHorizontal: spacing[3],
    height: 44,
    backgroundColor: colors.neutral[50],
  },
  
  inputWithIcon: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    lineHeight: 20,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  
  inputIcon: {
    marginRight: spacing[2],
  },
  
  inputError: {
    borderColor: colors.error[500],
  },
  
  inputDisabled: {
    backgroundColor: colors.neutral[100],
    color: colors.text.tertiary,
  },
  
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  
  // Global label style - semi-bold, 6px above element
  globalLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: 6, // 6px above element
  },
  
  inputErrorText: {
    fontSize: typography.size.sm,
    color: colors.error[500],
    marginTop: spacing[1],
  },
  
  // ============================================================================
  // SPACING UTILITIES
  // ============================================================================
  
  // Margin
  m0: { margin: spacing[0] },
  m1: { margin: spacing[1] },
  m2: { margin: spacing[2] },
  m3: { margin: spacing[3] },
  m4: { margin: spacing[4] },
  m5: { margin: spacing[5] },
  m6: { margin: spacing[6] },
  
  // Margin Top
  mt0: { marginTop: spacing[0] },
  mt1: { marginTop: spacing[1] },
  mt2: { marginTop: spacing[2] },
  mt3: { marginTop: spacing[3] },
  mt4: { marginTop: spacing[4] },
  mt5: { marginTop: spacing[5] },
  mt6: { marginTop: spacing[6] },
  
  // Margin Bottom
  mb0: { marginBottom: spacing[0] },
  mb1: { marginBottom: spacing[1] },
  mb2: { marginBottom: spacing[2] },
  mb3: { marginBottom: spacing[3] },
  mb4: { marginBottom: spacing[4] },
  mb5: { marginBottom: spacing[5] },
  mb6: { marginBottom: spacing[6] },
  
  // Margin Left
  ml0: { marginLeft: spacing[0] },
  ml1: { marginLeft: spacing[1] },
  ml2: { marginLeft: spacing[2] },
  ml3: { marginLeft: spacing[3] },
  ml4: { marginLeft: spacing[4] },
  ml5: { marginLeft: spacing[5] },
  ml6: { marginLeft: spacing[6] },
  
  // Margin Right
  mr0: { marginRight: spacing[0] },
  mr1: { marginRight: spacing[1] },
  mr2: { marginRight: spacing[2] },
  mr3: { marginRight: spacing[3] },
  mr4: { marginRight: spacing[4] },
  mr5: { marginRight: spacing[5] },
  mr6: { marginRight: spacing[6] },
  
  // Padding
  p0: { padding: spacing[0] },
  p1: { padding: spacing[1] },
  p2: { padding: spacing[2] },
  p3: { padding: spacing[3] },
  p4: { padding: spacing[4] },
  p5: { padding: spacing[5] },
  p6: { padding: spacing[6] },
  
  // Padding Top
  pt0: { paddingTop: spacing[0] },
  pt1: { paddingTop: spacing[1] },
  pt2: { paddingTop: spacing[2] },
  pt3: { paddingTop: spacing[3] },
  pt4: { paddingTop: spacing[4] },
  pt5: { paddingTop: spacing[5] },
  pt6: { paddingTop: spacing[6] },
  
  // Padding Bottom
  pb0: { paddingBottom: spacing[0] },
  pb1: { paddingBottom: spacing[1] },
  pb2: { paddingBottom: spacing[2] },
  pb3: { paddingBottom: spacing[3] },
  pb4: { paddingBottom: spacing[4] },
  pb5: { paddingBottom: spacing[5] },
  pb6: { paddingBottom: spacing[6] },
  
  // Padding Left
  pl0: { paddingLeft: spacing[0] },
  pl1: { paddingLeft: spacing[1] },
  pl2: { paddingLeft: spacing[2] },
  pl3: { paddingLeft: spacing[3] },
  pl4: { paddingLeft: spacing[4] },
  pl5: { paddingLeft: spacing[5] },
  pl6: { paddingLeft: spacing[6] },
  
  // Padding Right
  pr0: { paddingRight: spacing[0] },
  pr1: { paddingRight: spacing[1] },
  pr2: { paddingRight: spacing[2] },
  pr3: { paddingRight: spacing[3] },
  pr4: { paddingRight: spacing[4] },
  pr5: { paddingRight: spacing[5] },
  pr6: { paddingRight: spacing[6] },
  
  // ============================================================================
  // FLEX UTILITIES
  // ============================================================================
  
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexCol: { flexDirection: 'column' },
  itemsCenter: { alignItems: 'center' },
  itemsStart: { alignItems: 'flex-start' },
  itemsEnd: { alignItems: 'flex-end' },
  justifyCenter: { justifyContent: 'center' },
  justifyStart: { justifyContent: 'flex-start' },
  justifyEnd: { justifyContent: 'flex-end' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  
  // ============================================================================
  // BORDER UTILITIES
  // ============================================================================
  
  border: { borderWidth: 1, borderColor: colors.border },
  borderTop: { borderTopWidth: 1, borderTopColor: colors.border },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: colors.border },
  borderRight: { borderRightWidth: 1, borderRightColor: colors.border },
  
  // ============================================================================
  // ROUNDED CORNERS
  // ============================================================================
  
  roundedNone: { borderRadius: borderRadius.none },
  roundedSm: { borderRadius: borderRadius.sm },
  rounded: { borderRadius: borderRadius.base },
  roundedMd: { borderRadius: borderRadius.md },
  roundedLg: { borderRadius: borderRadius.lg },
  roundedXl: { borderRadius: borderRadius.xl },
  rounded2xl: { borderRadius: borderRadius['2xl'] },
  rounded3xl: { borderRadius: borderRadius['3xl'] },
  roundedFull: { borderRadius: borderRadius.full },
  
  // Validation styles
  errorContainer: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: 8,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center' as const,
  },
  errorIcon: {
    marginRight: spacing[2],
  },
  

  
  // Success styles
  successContainer: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
    borderRadius: 8,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  successText: {
    color: colors.success[600],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center' as const,
  },

  // ============================================================================
  // AUTHENTICATION FORMS
  // ============================================================================

  // Container styles
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authSafeArea: {
    flex: 1
  },
  authScrollView: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
    paddingBottom: spacing[10],
  },

  // Header styles
  authHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  authLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing[20],
    height: spacing[20],
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    marginBottom: spacing[6],
  },
  authTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  authSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Universal form styles - Expo best practices
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },



  // Link styles
  authLink: {
    alignItems: 'flex-end',
    marginBottom: spacing[6],
  },
  authLinkText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },

  // Divider styles
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  authDividerText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginHorizontal: spacing[4],
  },

  // Sign up/in link styles
  authSignLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authSignLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  authSignLinkButton: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },

  // Terms and conditions styles
  authTermsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  authCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    borderRadius: 4,
    marginRight: spacing[3],
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authCheckboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  authTermsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  authTermsLink: {
    color: colors.primary[500],
    fontWeight: '600',
  },

  // Login screen split-panel styles
  loginContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  loginFormPanel: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
    justifyContent: 'center',
  },
  loginSlideshowPanel: {
    flex: 1,
    backgroundColor: colors.primary[600],
    position: 'relative',
    overflow: 'hidden',
  },
  loginSlideshowImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Removed loginSlideshowOverlay - no longer needed
  loginSlideshowContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginSlideshowTextContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  loginSlideshowTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  loginSlideshowSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  loginSlideshowIndicators: {
    position: 'absolute',
    bottom: spacing[8],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginSlideshowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  loginSlideshowDotActive: {
    backgroundColor: 'white',
  },
  loginSlideshowDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Mobile-specific auth styles
  mobileAuthContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileAuthScrollView: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8], // Reduced from spacing[10] for better mobile layout
    paddingBottom: spacing[8], // Reduced from spacing[10] for better mobile layout
  },
  mobileAuthFormContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center', // Center the form vertically
  },
});

// ============================================================================
// THEME EXPORT
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  componentStyles,
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

// Common values used throughout the app
export const constants = {
  // Border widths
  borderWidth: {
    thin: 1,
    normal: 2,
    thick: 4,
  },
  
  // Common sizes
  size: {
    icon: {
      small: 16,
      medium: 20,
      large: 24,
      xlarge: 48,
    },
    divider: {
      height: 1,
    },
  },
  
  // Common values
  common: {
    borderRadius: 8,
    padding: {
      small: 4,
      medium: 8,
      large: 16,
    },
  },
} as const;

export default theme; 