import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthInput from '../auth/AuthInput';
import AuthButton from '../auth/AuthButton';
import { DateOfBirthPicker } from '../ui/DatePicker';
import { componentStyles, colors, spacing, typography } from '../../styles/global';

interface SignupStepProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  firstNameError: string;
  lastNameError: string;
  passwordError: string;
  dateOfBirthError: string;
  isLoading: boolean;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onDateOfBirthChange: (date: string) => void;
  onAcceptTermsChange: (accepted: boolean) => void;
  onFirstNameErrorChange: (error: string) => void;
  onLastNameErrorChange: (error: string) => void;
  onPasswordErrorChange: (error: string) => void;
  onDateOfBirthErrorChange: (error: string) => void;
  onSignup: () => void;
  onBackToEmail: () => void;
}

export function SignupStep({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  dateOfBirth,
  acceptTerms,
  firstNameError,
  lastNameError,
  passwordError,
  dateOfBirthError,
  isLoading,
  onFirstNameChange,
  onLastNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDateOfBirthChange,
  onAcceptTermsChange,
  onFirstNameErrorChange,
  onLastNameErrorChange,
  onPasswordErrorChange,
  onDateOfBirthErrorChange,
  onSignup,
  onBackToEmail
}: SignupStepProps) {
  const router = useRouter();

  return (
    <View>
      <View style={[componentStyles.flexRow, { gap: spacing[3] }]}>
        <View style={componentStyles.flex1}>
          <AuthInput
            label="First Name"
            icon="person-outline"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={(text: string) => {
              onFirstNameChange(text);
              if (firstNameError) onFirstNameErrorChange('');
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            error={firstNameError}
          />
        </View>
        <View style={componentStyles.flex1}>
          <AuthInput
            label="Last Name"
            icon="person-outline"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={(text: string) => {
              onLastNameChange(text);
              if (lastNameError) onLastNameErrorChange('');
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            error={lastNameError}
          />
        </View>
      </View>

      <View style={[componentStyles.authInputContainer, { marginBottom: spacing[4] }]}>
        <Text style={componentStyles.authInputLabel}>Email</Text>
        <View style={[componentStyles.authInput, { backgroundColor: colors.neutral[100] }]}>
          <Ionicons name="mail-outline" size={20} color={colors.neutral[500]} />
          <Text style={[componentStyles.authInputText, { color: colors.text.primary }]}>
            {email}
          </Text>
        </View>
      </View>

      <AuthInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="Create a password"
        value={password}
        onChangeText={(text: string) => {
          onPasswordChange(text);
          if (passwordError) onPasswordErrorChange('');
        }}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        error={passwordError}
      />

      <AuthInput
        label="Confirm Password"
        icon="lock-closed-outline"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={(text: string) => {
          onConfirmPasswordChange(text);
          if (passwordError) onPasswordErrorChange('');
        }}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        error={passwordError}
      />

      <DateOfBirthPicker
        label="Date of Birth"
        value={dateOfBirth}
        onChange={onDateOfBirthChange}
        error={dateOfBirthError}
        required
      />

      <TouchableOpacity
        onPress={() => onAcceptTermsChange(!acceptTerms)}
        style={[componentStyles.flexRow, { alignItems: 'center', marginBottom: spacing[4] }]}
        disabled={isLoading}
      >
        <View style={[
          { width: 20, height: 20, borderWidth: 2, borderColor: colors.border, marginRight: spacing[2] },
          acceptTerms && { backgroundColor: colors.primary[500], borderColor: colors.primary[500] }
        ]}>
          {acceptTerms && (
            <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
          )}
        </View>
        <Text style={[componentStyles.textSm, { color: colors.text.secondary, flex: 1 }]}>
          I accept the{' '}
          <Text style={{ color: colors.primary[500] }}>
            Terms and Conditions
          </Text>
          {' '}and{' '}
          <Text style={{ color: colors.primary[500] }}>
            Privacy Policy
          </Text>
        </Text>
      </TouchableOpacity>

      <AuthButton
        title="Create Account"
        onPress={onSignup}
        loading={isLoading}
        disabled={isLoading}
      />

      <View style={[componentStyles.itemsCenter, { marginTop: spacing[4] }]}>
        <TouchableOpacity
          onPress={onBackToEmail}
          style={[componentStyles.itemsCenter, { marginBottom: spacing[2] }]}
          disabled={isLoading}
        >
          <Text style={[componentStyles.textSm, { color: colors.neutral[600] }]}>
            Use a different email
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={componentStyles.itemsCenter}
          disabled={isLoading}
        >
          <Text style={[componentStyles.textSm, { color: colors.primary[500] }]}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 