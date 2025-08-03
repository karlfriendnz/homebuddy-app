
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authUtils, householdUtils } from '../../lib/supabase-utils';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { colors, componentStyles, spacing, typography } from '../../styles/global';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768; // Mobile breakpoint

// Sample slideshow images - you can replace these with your own
const slideshowImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c33c89424de2d?w=800&h=1200&fit=crop',
];

// Auth flow types
type AuthFlow = 'email' | 'login' | 'signup' | 'verify-email' | 'post-verification';

// Constants for magic numbers
const MIN_PASSWORD_LENGTH = 8;

export default function AuthScreen() {
  const params = useLocalSearchParams();
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('email');
  
  // Form states
  const [email, setEmail] = useState(params.email as string || '');
  const [signupEmail, setSignupEmail] = useState(''); // Store email for signup process
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Auto-advance slideshow (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate email step
  const validateEmailStep = () => {
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Validate login form
  const validateLoginForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } 

    return isValid;
  };

  // Validate signup form
  const validateSignupForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setError('');

    // Validate first name
    if (!firstName.trim()) {
      setError('First name is required');
      isValid = false;
    }
    
    // Validate last name
    if (!lastName.trim()) {
      setError('Last name is required');
      isValid = false;
    }
    
    // Validate stored email (should already be validated from email check step)
    if (!signupEmail || !validateEmail(signupEmail)) {
      setError('Invalid email address');
      isValid = false;
    }
    
    // Validate password
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      isValid = false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      isValid = false;
    }
    
    // Validate terms acceptance
    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      isValid = false;
    }

    return isValid;
  };

  // Handle email check
  const handleEmailCheck = async () => {
    if (!validateEmailStep()) return;

    setIsLoading(true);
    setError('');

    try {
      const userExists = await authUtils.checkUserExists(email.trim());
      
      if (userExists) {
        // User exists, show login form
        setCurrentFlow('login');
      } else {
        // User doesn't exist, show signup form
        // Store the email for signup process and clear the display field
        setSignupEmail(email.trim());
        setEmail('');
        setCurrentFlow('signup');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Email check error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const { user } = await authUtils.signIn(email.trim(), password);
      
      // Check if user has a household
      if (user?.id) {
        const hasHousehold = await householdUtils.userHasHousehold(user.id);
        
        if (hasHousehold) {
          // User has a household, go to main app
          router.replace('/(tabs)');
        } else {
          // User doesn't have a household, go to household choice
          router.replace('/(auth)/onboarding/household-choice');
        }
      } else {
        // Fallback to main app if we can't determine household status
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = (error as { message: string }).message;
        if (errorMsg.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (errorMsg.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account.';
        } else if (errorMsg.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (!validateSignupForm()) return;

    setError('');
    setIsLoading(true);
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
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
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // eslint-disable-next-line no-console
        console.log('Signup successful:', data.user.email);
        setError('');
        
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          // Show verification screen
          setCurrentFlow('verify-email');
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
      setIsLoading(false);
    }
  };

  // Check for authenticated user after email verification
  useEffect(() => {
    const checkAuthAfterVerification = async () => {
      // Check if we have a current session (user might be auto-signed in after verification)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is authenticated, check if email is confirmed
        if (session.user.email_confirmed_at) {
          // Check if user has a household
          const hasHousehold = await householdUtils.userHasHousehold(session.user.id);
          
          if (hasHousehold) {
            // User has a household, redirect to main app
            router.replace('/(tabs)');
          } else {
            // User doesn't have a household, redirect to household choice
            router.replace('/(auth)/onboarding/household-choice');
          }
        }
      }
    };

    // Check auth status when component mounts or when returning from verification
    checkAuthAfterVerification();

    // Listen for auth state changes (when user returns from email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in, check if email is confirmed
        if (session.user.email_confirmed_at) {
          // Check if user has a household
          const hasHousehold = await householdUtils.userHasHousehold(session.user.id);
          
          if (hasHousehold) {
            // User has a household, redirect to main app
            router.replace('/(tabs)');
          } else {
            // User doesn't have a household, redirect to household choice
            router.replace('/(auth)/onboarding/household-choice');
          }
        }
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address first.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `We&apos;ll send a password reset link to ${email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            try {
              await authUtils.resetPassword(email.trim());
              Alert.alert(
                'Reset Link Sent',
                'Check your email for the password reset link.'
              );
            } catch {
              Alert.alert('Error', 'Failed to send reset link. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle back to email step
  const handleBackToEmail = () => {
    setCurrentFlow('email');
    setPassword('');
    setPasswordError('');
    setError('');
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setError('');
        Alert.alert('Email Sent', 'Verification email has been resent.');
      }
    } catch (error) {
      setError('Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render email step
  const renderEmailStep = () => (
    <View style={componentStyles.flex1}>
      <AuthInput
        label="Email"
        icon="mail-outline"
        placeholder="Enter your email address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        autoFocus={true}
        editable={!isLoading}
        error={emailError}
      />

      <View style={{ marginTop: spacing[6] }}>
        <AuthButton
          title="Continue"
          onPress={handleEmailCheck}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  // Render login step
  const renderLoginStep = () => (
    <View style={componentStyles.flex1}>
      <AuthInput
        label="Email"
        icon="mail-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!isLoading}
        error={emailError}
      />

      <AuthInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        editable={!isLoading}
        error={passwordError}
        showPasswordToggle
        onPasswordToggle={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        style={[componentStyles.itemsEnd, componentStyles.mb6]}
        disabled={isLoading}
      >
        <Text style={[componentStyles.textSm, { color: colors.primary[500], fontWeight: typography.weight.medium }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <AuthButton
        title="Sign In"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
      />

      <TouchableOpacity
        onPress={handleBackToEmail}
        style={[componentStyles.itemsCenter, { marginTop: spacing[4] }]}
        disabled={isLoading}
      >
        <Text style={[componentStyles.textSm, { color: colors.neutral[600] }]}>
          Use a different email
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render signup step
  const renderSignupStep = () => (
    <View style={componentStyles.flex1}>
      <AuthInput
        label="First Name"
        icon="person-outline"
        placeholder="Enter your first name"
        value={firstName}
        onChangeText={(text) => {
          setFirstName(text);
          if (error && error.includes('First name')) setError('');
        }}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        editable={!isLoading}
      />

      <AuthInput
        label="Last Name"
        icon="person-outline"
        placeholder="Enter your last name"
        value={lastName}
        onChangeText={(text) => {
          setLastName(text);
          if (error && error.includes('Last name')) setError('');
        }}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="family-name"
        editable={!isLoading}
      />

      <AuthInput
        label="Password"
        icon="lock-closed-outline"
        placeholder={`Create a password (min ${MIN_PASSWORD_LENGTH} characters)`}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        editable={!isLoading}
        error={passwordError}
        showPasswordToggle
        onPasswordToggle={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <AuthInput
        label="Confirm Password"
        icon="lock-closed-outline"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (passwordError) setPasswordError('');
        }}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        editable={!isLoading}
        error={passwordError}
        showPasswordToggle
        onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        showPassword={showConfirmPassword}
      />

      {/* Terms and Conditions */}
      <View style={componentStyles.authTermsContainer}>
        <TouchableOpacity 
          style={[componentStyles.authCheckbox, acceptTerms && componentStyles.authCheckboxChecked]}
          onPress={() => {
            setAcceptTerms(!acceptTerms);
            if (error && error.includes('terms')) setError('');
          }}
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

      <AuthButton
        title="Create Account"
        onPress={handleSignup}
        loading={isLoading}
        disabled={isLoading}
      />

      <TouchableOpacity
        onPress={handleBackToEmail}
        style={[componentStyles.itemsCenter, { marginTop: spacing[4] }]}
        disabled={isLoading}
      >
        <Text style={[componentStyles.textSm, { color: colors.neutral[600] }]}>
          Use a different email
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render email verification step
  const renderVerifyEmailStep = () => (
    <View style={componentStyles.flex1}>
      <View style={[componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
        <Ionicons name="mail-outline" size={48} color={colors.primary[500]} />
      </View>
      
      <Text style={[componentStyles.textXl, componentStyles.fontBold, { textAlign: 'center', marginBottom: spacing[4] }]}>
        Check your email
      </Text>
      
      <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', marginBottom: spacing[6] }]}>
        We&apos;ve sent a verification link to:
      </Text>
      
      <Text style={[componentStyles.textLg, componentStyles.fontBold, { textAlign: 'center', marginBottom: spacing[8] }]}>
        {signupEmail}
      </Text>
      
      <Text style={[componentStyles.textSm, componentStyles.textSecondary, { textAlign: 'center', marginBottom: spacing[6] }]}>
        Click the link in your email to verify your account and continue.
      </Text>

      <AuthButton
        title="Resend Email"
        onPress={handleResendVerification}
        loading={isLoading}
        disabled={isLoading}
      />

      <TouchableOpacity
        onPress={handleBackToEmail}
        style={[componentStyles.itemsCenter, { marginTop: spacing[4] }]}
        disabled={isLoading}
      >
        <Text style={[componentStyles.textSm, { color: colors.neutral[600] }]}>
          Use a different email
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Get current flow title and subtitle
  const getFlowContent = () => {
    switch (currentFlow) {
      case 'email':
        return {
          title: 'Welcome Back',
          subtitle: 'Enter your email to continue'
        };
      case 'login':
        return {
          title: 'Sign In',
          subtitle: 'Sign in to your HomeBuddy account'
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Join HomeBuddy and get organized'
        };
      case 'verify-email':
        return {
          title: 'Verify Email',
          subtitle: 'Check your email to continue'
        };
      case 'post-verification':
        return {
          title: 'Setting Up Your Account',
          subtitle: 'Please wait while we set up your account'
        };
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Enter your email to continue'
        };
    }
  };

  // Get current form content
  const getCurrentForm = () => {
    switch (currentFlow) {
      case 'email':
        return renderEmailStep();
      case 'login':
        return renderLoginStep();
      case 'signup':
        return renderSignupStep();
      case 'verify-email':
        return renderVerifyEmailStep();
      case 'post-verification':
        return (
          <View style={componentStyles.flex1}>
            <View style={[componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary[500]} />
            </View>
            <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center' }]}>
              Email verified! Setting up your account...
            </Text>
          </View>
        );
      default:
        return renderEmailStep();
    }
  };

  const flowContent = getFlowContent();

  // Mobile layout (single column)
  if (isMobile) {
    return (
      <SafeAreaView style={componentStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={componentStyles.flex1}
        >
          <ScrollView
            contentContainerStyle={[
              componentStyles.flex1,
              componentStyles.p6,
              { paddingTop: spacing[10], paddingBottom: spacing[10] }
            ]}
            showsVerticalScrollIndicator={false}
          >
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
                {flowContent.title}
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                {flowContent.subtitle}
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} visible={!!error} />

            {/* Form */}
            <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
              {getCurrentForm()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Desktop layout (split panel)
  return (
    <View style={componentStyles.loginContainer}>
      {/* Left Panel - Auth Form */}
      <View style={componentStyles.loginFormPanel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={componentStyles.flex1}
        >
          <ScrollView
            contentContainerStyle={[
              componentStyles.flex1,
              { 
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100%'
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Space */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary[100],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[6],
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
                {flowContent.title}
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                {flowContent.subtitle}
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} visible={!!error} />

            {/* Form */}
            <View style={{ width: '100%', maxWidth: 400 }}>
              {getCurrentForm()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Right Panel - Image Slideshow (Desktop Only) */}
      <View style={componentStyles.loginSlideshowPanel}>
        {/* Current Image */}
        <Image
          source={{ uri: slideshowImages[currentImageIndex] }}
          style={componentStyles.loginSlideshowImage}
        />
        
        {/* Overlay */}
        <View style={componentStyles.loginSlideshowOverlay} />
        
        {/* Content Overlay */}
        <View style={componentStyles.loginSlideshowContent}>
          <View style={componentStyles.loginSlideshowTextContainer}>
            <Text style={componentStyles.loginSlideshowTitle}>
              Turn your home into a haven
            </Text>
            <Text style={componentStyles.loginSlideshowSubtitle}>
              Organize tasks, manage your household, and create a more harmonious living space with HomeBuddy.
            </Text>
          </View>
        </View>

        {/* Slideshow Indicators */}
        <View style={componentStyles.loginSlideshowIndicators}>
          {slideshowImages.map((_, index) => (
            <View
              key={index}
              style={[
                componentStyles.loginSlideshowDot,
                index === currentImageIndex 
                  ? componentStyles.loginSlideshowDotActive 
                  : componentStyles.loginSlideshowDotInactive
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
