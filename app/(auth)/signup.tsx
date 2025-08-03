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
import { supabase } from '../../lib/supabase';
import { householdUtils } from '../../lib/supabase-utils';
import * as Notifications from 'expo-notifications';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { componentStyles, colors, spacing } from '../../styles/global';

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

  // Get push token on component mount (only on mobile platforms)
  useEffect(() => {
    const getPushToken = async () => {
      // Only get push token on iOS and Android, not on web
      if (Platform.OS === 'web') {
        return;
      }

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
        throw error;
      }

      if (data.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            push_token: pushToken,
            email_verified: false,
            onboarding_completed: false,
            is_active: true,
          });

        if (profileError) {
          // eslint-disable-next-line no-console
          console.error('Error creating user profile:', profileError);
          // Don't throw here as the auth user was created successfully
        }

        // Navigate to email verification
        router.replace('/(auth)/verify-email');
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={componentStyles.authContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={componentStyles.authHeader}>
          <Text style={componentStyles.textXl}>Create Account</Text>
          <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>
            Join HomeBuddy to manage your household together
          </Text>
        </View>

        <View style={componentStyles.authForm}>
          {error ? <ErrorMessage message={error} /> : null}

          {/* First Name */}
          <View style={componentStyles.authInputContainer}>
            <Text style={componentStyles.authInputLabel}>First Name</Text>
            <TextInput
              style={componentStyles.authInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Last Name */}
          <View style={componentStyles.authInputContainer}>
            <Text style={componentStyles.authInputLabel}>Last Name</Text>
            <TextInput
              style={componentStyles.authInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email */}
          <View style={componentStyles.authInputContainer}>
            <Text style={componentStyles.authInputLabel}>Email</Text>
            <TextInput
              style={componentStyles.authInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={componentStyles.authInputContainer}>
            <Text style={componentStyles.authInputLabel}>Password</Text>
            <View style={componentStyles.authInput}>
              <TextInput
                style={componentStyles.authInputText}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
              <Text style={componentStyles.textError}>
                Password must be at least {MIN_PASSWORD_LENGTH} characters
              </Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={componentStyles.authInputContainer}>
            <Text style={componentStyles.authInputLabel}>Confirm Password</Text>
            <View style={componentStyles.authInput}>
              <TextInput
                style={componentStyles.authInputText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={componentStyles.textError}>
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Terms and Conditions */}
          <View style={componentStyles.authTermsContainer}>
            <TouchableOpacity
              style={componentStyles.authTermsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              {acceptTerms && (
                <Ionicons name="checkmark" size={16} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
            <Text style={[componentStyles.textSm, { flex: 1, marginLeft: spacing[2] }]}>
              I agree to the{' '}
              <Text style={{ color: colors.primary[500] }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: colors.primary[500] }}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              componentStyles.authButton,
              !isFormValid() && componentStyles.authButtonDisabled
            ]}
            onPress={handleSignup}
            disabled={!isFormValid() || loading}
          >
            <Text style={componentStyles.authButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={componentStyles.authSignLinkContainer}>
            <Text style={componentStyles.authSignLinkText}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={componentStyles.authSignLinkButton}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 