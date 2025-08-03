import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { householdUtils } from '../lib/supabase-utils';
import * as Notifications from 'expo-notifications';
import ErrorMessage from '../components/ui/ErrorMessage';
import { componentStyles, colors, spacing } from '../styles/global';

// Constants for magic numbers
const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const params = useLocalSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(params.email as string || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill email if passed as parameter
  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params.email]);

  // Get push token on component mount
  useEffect(() => {
    const getPushToken = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            return;
          }
        }

        const token = await Notifications.getExpoPushTokenAsync();
        setPushToken(token.data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Error getting push token:', error);
      }
    };

    getPushToken();
  }, []);

  const isFormValid = () => {
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      password.length >= MIN_PASSWORD_LENGTH &&
      password === confirmPassword &&
      acceptTerms
    );
  };

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    if (!isFormValid()) {
      setError('Please fill in all fields correctly and accept the terms');
      setLoading(false);
      return;
    }
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            push_token: pushToken,
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // eslint-disable-next-line no-console
        console.log('Signup successful:', data.user.email);
        setError('');
        
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          // Redirect to verification screen with email
          router.push({
            pathname: '/(auth)/verify-email',
            params: { email: data.user.email }
          });
        } else {
          // Email already confirmed, check if user has a household
          const hasHousehold = await householdUtils.userHasHousehold(data.user.id);
          
          if (hasHousehold) {
            // User has a household, redirect to main app
            router.replace('/(tabs)');
          } else {
            // User doesn't have a household, redirect to household choice
            router.replace('/(auth)/onboarding/household-choice');
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Signup error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={componentStyles.authContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={componentStyles.authSafeArea}
      >
        <ScrollView
          contentContainerStyle={componentStyles.authScrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={componentStyles.authHeader}>
            <View style={componentStyles.authLogoContainer}>
              <Ionicons name="home" size={spacing[12]} color={colors.primary[500]} />
            </View>
            <Text style={componentStyles.authTitle}>Create Account</Text>
            <Text style={componentStyles.authSubtitle}>Join HomeBuddy and get organized</Text>
          </View>

          {/* Form */}
          <View style={componentStyles.authForm}>
            {/* Error Message */}
            <ErrorMessage message={error} visible={!!error} />
            
            {/* First Name Input */}
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>First Name</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="person-outline" size={20} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.neutral[400]}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="given-name"
                />
              </View>
            </View>

            {/* Last Name Input */}
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>Last Name</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="person-outline" size={20} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.neutral[400]}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="family-name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>Email</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="mail-outline" size={spacing[5]} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Enter your email"
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

            {/* Password Input */}
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>Password</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="lock-closed-outline" size={spacing[5]} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Create a password (min 8 characters)"
                  placeholderTextColor={colors.neutral[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: spacing[1] }}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={spacing[5]} 
                    color={colors.neutral[500]} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={componentStyles.authInputContainer}>
              <Text style={componentStyles.authInputLabel}>Confirm Password</Text>
              <View style={componentStyles.authInput}>
                <Ionicons name="lock-closed-outline" size={spacing[5]} color={colors.neutral[500]} />
                <TextInput
                  style={componentStyles.authInputText}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.neutral[400]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: spacing[1] }}>
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={spacing[5]} 
                    color={colors.neutral[500]} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={componentStyles.authTermsContainer}>
              <TouchableOpacity 
                style={[componentStyles.authCheckbox, acceptTerms && componentStyles.authCheckboxChecked]}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                {acceptTerms && (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text style={componentStyles.authTermsText}>
                I agree to the{' '}
                <Text style={componentStyles.authTermsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={componentStyles.authTermsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={[componentStyles.authButton, (!isFormValid() || loading) && componentStyles.authButtonDisabled]} 
              onPress={handleSignup}
              disabled={!isFormValid() || loading}
            >
              <Text style={componentStyles.authButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={componentStyles.authDivider}>
              <View style={componentStyles.authDividerLine} />
              <Text style={componentStyles.authDividerText}>or</Text>
              <View style={componentStyles.authDividerLine} />
            </View>

            {/* Sign In Link */}
            <View style={componentStyles.authSignLinkContainer}>
              <Text style={componentStyles.authSignLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/')}>
                <Text style={componentStyles.authSignLinkButton}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
} 