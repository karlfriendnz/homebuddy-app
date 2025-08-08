
import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, componentStyles, constants } from '../../styles/global';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(({
  label,
  icon,
  error,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  ...textInputProps
}, ref) => {
  return (
    <View style={componentStyles.inputContainer}>
      <Text style={componentStyles.inputLabel}>{label}</Text>
      <View style={[
        componentStyles.inputSimple,
        error ? componentStyles.inputError : null,
      ]}>
        <Ionicons name={icon} size={20} color={colors.neutral[500]} />
        <TextInput
          ref={ref}
          style={componentStyles.text}
          placeholderTextColor={colors.neutral[400]}
          {...textInputProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onPasswordToggle}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={componentStyles.inputErrorText}>{error}</Text> : null}
    </View>
  );
});

export default AuthInput; 