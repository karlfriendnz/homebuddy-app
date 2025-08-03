import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing, componentStyles } from '../../styles/global';
import ErrorMessage from '../../components/ui/ErrorMessage';

export default function VerifyEmail() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill email if passed from signup
  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params.email]);

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Resend verification error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <View style={componentStyles.authContainer}>
      <View style={componentStyles.authSafeArea}>
        <View style={componentStyles.authScrollView}>
          {/* Header */}
          <View style={componentStyles.authHeader}>
            <View style={[componentStyles.authLogoContainer, { marginBottom: spacing[6] }]}>
              <Ionicons name="mail-outline" size={spacing[12]} color={colors.primary[500]} />
            </View>
            <Text style={componentStyles.authTitle}>Verify Your Email</Text>
            <Text style={componentStyles.authSubtitle}>
              We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </Text>
          </View>

          {/* Error Message */}
          <ErrorMessage message={error} visible={!!error} />

          {/* Success Message */}
          {success && (
            <View style={[componentStyles.successContainer, { marginBottom: spacing[5] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={spacing[5]} color={colors.success[500]} style={{ marginRight: spacing[2] }} />
                <Text style={componentStyles.successText}>
                  {success}
                </Text>
              </View>
            </View>
          )}

          {/* Form */}
          <View style={componentStyles.authForm}>
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>Email Address</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="mail-outline" size={spacing[5]} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.neutral[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[componentStyles.authButton, (!email.trim() || loading) && componentStyles.authButtonDisabled]} 
              onPress={handleResendVerification}
              disabled={!email.trim() || loading}
            >
              <Text style={componentStyles.authButtonText}>
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[componentStyles.authButton, { backgroundColor: 'transparent', marginTop: spacing[3] }]} 
              onPress={handleBackToLogin}
            >
              <Text style={[componentStyles.authButtonText, { color: colors.primary[500] }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={{ marginTop: spacing[6], paddingHorizontal: spacing[4] }}>
            <Text style={[componentStyles.textSm, componentStyles.textSecondary, { textAlign: 'center' }]}>
              Didn&apos;t receive the email? Check your spam folder or try resending the verification email.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
} 