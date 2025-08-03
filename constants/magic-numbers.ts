// Common magic numbers used throughout the app
export const MAGIC_NUMBERS = {
  // Time constants
  DAYS_IN_MONTH: 30,
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MILLISECONDS_IN_SECOND: 1000,
  
  // Invite code constants
  INVITE_CODE_LENGTH: 6,
  INVITE_CODE_BASE: 36,
  INVITE_CODE_START: 2,
  
  // Password constants
  MIN_PASSWORD_LENGTH: 8,
  
  // Icon sizes
  ICON_SIZE_SMALL: 20,
  ICON_SIZE_MEDIUM: 24,
  ICON_SIZE_LARGE: 48,
  
  // Spacing values (mapped to spacing array indices)
  SPACING_1: 1,
  SPACING_2: 2,
  SPACING_3: 3,
  SPACING_4: 4,
  SPACING_5: 5,
  SPACING_6: 6,
  SPACING_7: 7,
  SPACING_10: 10,
  SPACING_12: 12,
  SPACING_20: 20,
  
  // Color indices
  COLOR_100: 100,
  COLOR_400: 400,
  COLOR_500: 500,
  COLOR_600: 600,
} as const; 