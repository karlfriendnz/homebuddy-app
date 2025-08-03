
import React from 'react';
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

export default function AuthInput({
  label,
  icon,
  error,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  ...textInputProps
}: AuthInputProps) {
  return (
    <View style={componentStyles.mb5}>
      <Text style={componentStyles.inputLabel}>{label}</Text>
      <View style={[
        componentStyles.flexRow,
        componentStyles.itemsCenter,
        componentStyles.input,
        error ? componentStyles.inputError : null,
        { minHeight: 34 } // Reduced to 34px overall height
      ]}>
        <Ionicons name={icon} size={constants.size.icon.medium} color={colors.neutral[500]} />
        <TextInput
          style={[
            componentStyles.flex1, 
            componentStyles.ml3,
            { 
              paddingVertical: 2, // 2px vertical padding
              paddingHorizontal: 0, // No horizontal padding since we have ml3
              minHeight: 30, // Reduced to fit within 34px container
              textAlignVertical: 'center' // Center text vertically
            }
          ]}
          placeholderTextColor={colors.neutral[400]}
          multiline={false} // Ensure single line input
          {...textInputProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onPasswordToggle} style={componentStyles.p1}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={constants.size.icon.medium}
              color={colors.neutral[500]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={componentStyles.inputErrorText}>{error}</Text> : null}
    </View>
  );
} 