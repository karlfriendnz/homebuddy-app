import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  Platform,
  StyleSheet,
} from 'react-native';
import { colors, spacing } from '../../styles/global';

interface UniversalButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

const UniversalButton: React.FC<UniversalButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.text.inverse : colors.primary[500]} 
        />
      ) : (
        <Text style={[
          styles.buttonText,
          styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  // Size variants
  buttonSm: {
    height: 36,
    paddingHorizontal: spacing[3],
  },
  buttonMd: {
    height: 44,
    paddingHorizontal: spacing[4],
  },
  buttonLg: {
    height: 52,
    paddingHorizontal: spacing[5],
  },
  // Style variants
  buttonPrimary: {
    backgroundColor: colors.primary[500],
    borderWidth: 0,
  },
  buttonSecondary: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  // Text styles
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
  buttonTextGhost: {
    color: colors.primary[500],
  },
});

export default UniversalButton;
