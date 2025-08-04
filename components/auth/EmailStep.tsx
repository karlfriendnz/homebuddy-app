import React from 'react';
import { View } from 'react-native';
import AuthInput from '../auth/AuthInput';

interface EmailStepProps {
  email: string;
  emailError: string;
  isLoading: boolean;
  onEmailChange: (text: string) => void;
  onEmailErrorChange: (error: string) => void;
  onSubmit: () => void;
}

export function EmailStep({
  email,
  emailError,
  isLoading,
  onEmailChange,
  onEmailErrorChange,
  onSubmit
}: EmailStepProps) {
  return (
    <View>
      <AuthInput
        label="Email"
        icon="mail-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text: string) => {
          onEmailChange(text);
          if (emailError) onEmailErrorChange('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!isLoading}
        error={emailError}
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />
    </View>
  );
} 