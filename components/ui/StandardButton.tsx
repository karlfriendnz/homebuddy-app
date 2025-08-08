import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, typography } from '../../styles/global';

interface StandardButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

const StandardButton: React.FC<StandardButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...props
}) => {
  // Get button styles based on variant
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    // Size variations
    const sizeStyles = {
      sm: { height: 36, paddingHorizontal: spacing[3] },
      md: { height: 44, paddingHorizontal: spacing[4] }, // Same as inputs
      lg: { height: 52, paddingHorizontal: spacing[5] },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary[500],
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.neutral[100],
        borderWidth: 1,
        borderColor: colors.neutral[200],
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  // Get text styles based on variant
  const getTextStyle = () => {
    const baseStyle = {
      fontSize: 16,
      fontWeight: '600' as const,
    };

    const variantTextStyles = {
      primary: { color: colors.text.inverse },
      secondary: { color: colors.text.primary },
      outline: { color: colors.primary[500] },
      ghost: { color: colors.primary[500] },
    };

    return {
      ...baseStyle,
      ...variantTextStyles[variant],
    };
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        isDisabled && { opacity: 0.6 },
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
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default StandardButton;
