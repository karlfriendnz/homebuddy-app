import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthButton from '../auth/AuthButton';
import { componentStyles, colors, spacing } from '../../styles/global';

interface VerifyEmailStepProps {
  email: string;
  isLoading: boolean;
  onResendVerification: () => void;
  onBackToEmail: () => void;
}

export function VerifyEmailStep({
  email,
  isLoading,
  onResendVerification,
  onBackToEmail
}: VerifyEmailStepProps) {
  return (
    <View>
      <View style={[componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
        <Ionicons name="mail-outline" size={48} color={colors.primary[500]} />
      </View>
      
      <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', marginBottom: spacing[4] }]}>
        Check your email
      </Text>
      
      <Text style={[componentStyles.text, { textAlign: 'center', marginBottom: spacing[6] }]}>
        We've sent a verification link to{' '}
        <Text style={{ fontWeight: '600', color: colors.text.primary }}>
          {email}
        </Text>
      </Text>
      
      <Text style={[componentStyles.textSm, { textAlign: 'center', marginBottom: spacing[6] }]}>
        Click the link in your email to verify your account and continue.
      </Text>

      <AuthButton
        title="Resend Verification Email"
        onPress={onResendVerification}
        loading={isLoading}
        disabled={isLoading}
        variant="outline"
      />

      <View style={[componentStyles.itemsCenter, { marginTop: spacing[4] }]}>
        <TouchableOpacity
          onPress={onBackToEmail}
          style={componentStyles.itemsCenter}
          disabled={isLoading}
        >
          <Text style={[componentStyles.textSm, { color: colors.neutral[600] }]}>
            Use a different email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 