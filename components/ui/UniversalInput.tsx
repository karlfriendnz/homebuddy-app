import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, componentStyles } from '../../styles/global';

interface UniversalInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
}

const UniversalInput = forwardRef<TextInput, UniversalInputProps>(({
  label,
  icon,
  error,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  style,
  ...textInputProps
}, ref) => {

  return (
    <View style={styles.container}>
      {label && <Text style={componentStyles.globalLabel}>{label}</Text>}
      
      {icon ? (
        // Type 2: Input with icon (border on container, transparent input)
        <View style={[
          componentStyles.inputContainer,
          error && componentStyles.inputError,
        ]}>
          <Ionicons 
            name={icon} 
            size={18} 
            color={colors.neutral[500]} 
            style={componentStyles.inputIcon}
          />
          
          <TextInput
            ref={ref}
            style={[componentStyles.inputWithIcon, style]}
            placeholderTextColor={colors.neutral[400]}
            {...textInputProps}
          />
          
          {showPasswordToggle && (
            <TouchableOpacity onPress={onPasswordToggle} style={{ marginLeft: spacing[2] }}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={18}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Type 1: Simple text input (border on input field itself)
        <TextInput
          ref={ref}
          style={[
            componentStyles.inputSimple,
            error && componentStyles.inputError,
            style,
          ]}
          placeholderTextColor={colors.neutral[400]}
          {...textInputProps}
        />
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[500],
    marginTop: spacing[1],
  },
});

export default UniversalInput;
