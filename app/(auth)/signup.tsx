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
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={componentStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={componentStyles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <ScrollView
          contentContainerStyle={[
            componentStyles.mobileAuthScrollView,
            { 
              flexGrow: 1,
              paddingBottom: spacing[20] // Add extra padding at bottom for keyboard
            }
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[componentStyles.mobileAuthFormContainer, { justifyContent: 'center' }]}>
            {/* Logo Space */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary[100],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[6],
              alignSelf: 'center',
            }}>
              <Text style={{
                fontSize: 32,
                color: colors.primary[500],
                fontWeight: 'bold',
              }}>
                🏠
              </Text>
            </View>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: spacing[8] }}>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}>
                Create Account
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                Join HomeBuddy to manage your household together
              </Text>
            </View>

            {/* Error Message */}
            {error ? <ErrorMessage message={error} /> : null}

            {/* Form */}
            <View style={{ width: '100%' }}>
              {/* First Name */}
              <View style={{ marginBottom: spacing[4] }}>
                <Text style={componentStyles.globalLabel}>First Name</Text>
                <TextInput
                  style={componentStyles.inputSimple}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Last Name */}
              <View style={{ marginBottom: spacing[4] }}>
                <Text style={componentStyles.globalLabel}>Last Name</Text>
                <TextInput
                  style={componentStyles.inputSimple}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <View style={{ marginBottom: spacing[4] }}>
                <Text style={componentStyles.globalLabel}>Email</Text>
                <TextInput
                  style={componentStyles.inputSimple}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={componentStyles.inputContainer}>
                <Text style={componentStyles.globalLabel}>Password</Text>
                <View style={componentStyles.inputWithIcon}>
                  <TextInput
                    style={componentStyles.inputWithIcon}
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
              <View style={componentStyles.inputContainer}>
                <Text style={componentStyles.globalLabel}>Confirm Password</Text>
                <View style={componentStyles.inputWithIcon}>
                  <TextInput
                    style={componentStyles.inputWithIcon}
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
                  style={componentStyles.authCheckbox}
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
                style={[
                  componentStyles.buttonPrimary,
                  !isFormValid() && componentStyles.buttonDisabled
                ]}
                onPress={handleSignup}
                disabled={!isFormValid() || loading}
              >
                <Text style={componentStyles.buttonText}>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 