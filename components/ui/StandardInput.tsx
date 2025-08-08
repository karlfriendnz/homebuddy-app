import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../styles/global';

interface StandardInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
  variant?: 'default' | 'error' | 'success';
}

const StandardInput = forwardRef<TextInput, StandardInputProps>(({
  label,
  icon,
  error,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  variant = 'default',
  ...textInputProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  // Determine border color based on variant and focus state
  const getBorderColor = () => {
    if (isFocused) {
      return colors.primary[500]; // Focus state gets primary color
    }
    
    switch (variant) {
      case 'error':
        return colors.error[500];
      case 'success':
        return colors.success[500];
      default:
        return error ? colors.error[500] : colors.neutral[200];
    }
  };

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label && (
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text.primary,
          marginBottom: spacing[2],
        }}>
          {label}
        </Text>
      )}
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: 6,
        paddingHorizontal: spacing[3],
        height: 44, // Standard height
        backgroundColor: colors.background,
        // Web-specific focus styles
        ...(Platform.OS === 'web' && {
          transition: 'border-color 0.2s ease',
        }),
      }}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={18} 
            color={colors.neutral[500]} 
            style={{ marginRight: spacing[2] }}
          />
        )}
        
        <TextInput
          ref={ref}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text.primary,
            lineHeight: 20,
            // Web-specific styles to remove focus outline and ensure proper height
            ...(Platform.OS === 'web' && {
              outline: 'none',
              border: 'none',
              background: 'transparent',
              height: '100%',
              padding: 0,
              margin: 0,
              minHeight: 'auto',
              boxSizing: 'border-box',
            }),
          }}
          placeholderTextColor={colors.neutral[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
      
      {error && (
        <Text style={{
          fontSize: 12,
          color: colors.error[500],
          marginTop: spacing[1],
        }}>
          {error}
        </Text>
      )}
    </View>
  );
});

export default StandardInput;
