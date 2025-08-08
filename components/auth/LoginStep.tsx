import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UniversalInput, UniversalButton } from '../ui';
import { componentStyles, colors, spacing, typography } from '../../styles/global';

interface LoginStepProps {
  email: string;
  emailVerified: boolean;
  password: string;
  passwordError: string;
  showPassword: boolean;
  isLoading: boolean;
  onPasswordChange: (text: string) => void;
  onPasswordErrorChange: (error: string) => void;
  onShowPasswordToggle: () => void;
  onForgotPassword: () => void;
  onBackToEmail: () => void;
  onLogin: () => void;
  passwordInputRef: React.RefObject<any>;
}

export function LoginStep({
  email,
  emailVerified,
  password,
  passwordError,
  showPassword,
  isLoading,
  onPasswordChange,
  onPasswordErrorChange,
  onShowPasswordToggle,
  onForgotPassword,
  onBackToEmail,
  onLogin,
  passwordInputRef
}: LoginStepProps) {
  const router = useRouter();

  return (
    <View>
      {/* Show email display when verified */}
      {emailVerified && (
        <View style={{ marginBottom: spacing[4] }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: spacing[2],
          }}>
            Email
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.neutral[200],
            borderRadius: 6,
            paddingHorizontal: spacing[3],
            height: 44,
            backgroundColor: colors.neutral[100],
          }}>
            <Ionicons name="mail-outline" size={18} color={colors.neutral[500]} style={{ marginRight: spacing[2] }} />
            <Text style={{
              flex: 1,
              fontSize: 16,
              color: colors.text.primary,
              lineHeight: 20,
            }}>
              {email}
            </Text>
          </View>
        </View>
      )}

      <UniversalInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text: string) => {
          onPasswordChange(text);
          if (passwordError) onPasswordErrorChange('');
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        editable={!isLoading}
        error={passwordError}
        showPasswordToggle
        onPasswordToggle={onShowPasswordToggle}
        showPassword={showPassword}
        ref={passwordInputRef}
        onSubmitEditing={onLogin}
        returnKeyType="done"
      />

      <TouchableOpacity
        onPress={onForgotPassword}
        style={[componentStyles.itemsEnd, componentStyles.mb6]}
        disabled={isLoading}
      >
        <Text style={[componentStyles.textSm, { color: colors.primary[500], fontWeight: typography.weight.medium }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <UniversalButton
        title="Sign In"
        onPress={onLogin}
        loading={isLoading}
        disabled={isLoading}
        style={{ marginTop: spacing[4] }}
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
          onPress={() => router.push('/(auth)/signup')}
          style={componentStyles.itemsCenter}
          disabled={isLoading}
        >
          <Text style={[componentStyles.textSm, { color: colors.primary[500] }]}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 