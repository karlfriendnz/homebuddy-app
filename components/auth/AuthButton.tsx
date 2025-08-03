
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { colors, componentStyles } from '../../styles/global';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function AuthButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: AuthButtonProps) {
  const buttonStyle = [
    componentStyles.button,
    variant === 'primary' ? componentStyles.buttonPrimary : 
    variant === 'secondary' ? componentStyles.buttonSecondary : 
    componentStyles.buttonOutline,
    disabled || loading ? componentStyles.buttonDisabled : null,
    style,
  ];

  const textStyle = [
    componentStyles.buttonText,
    variant === 'primary' ? componentStyles.buttonTextPrimary : 
    variant === 'secondary' ? componentStyles.buttonTextSecondary : 
    componentStyles.buttonTextOutline,
    disabled || loading ? componentStyles.buttonTextDisabled : null,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.inverse : colors.primary[500]}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
} 