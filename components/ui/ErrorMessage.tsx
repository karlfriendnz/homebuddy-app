import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentStyles, colors } from '../../styles/global';

interface ErrorMessageProps {
  message: string;
  visible?: boolean;
}

export default function ErrorMessage({ message, visible = true }: ErrorMessageProps) {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={componentStyles.errorContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons 
          name="alert-circle" 
          size={20} 
          color={colors.error[600]} 
          style={componentStyles.errorIcon}
        />
        <Text style={componentStyles.errorText}>{message}</Text>
      </View>
    </View>
  );
} 