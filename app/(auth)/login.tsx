
import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { 
  EmailStep, 
  LoginStep, 
  SignupStep, 
  VerifyEmailStep, 
  PostVerificationStep 
} from '../../components/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768; // Mobile breakpoint

// Slideshow images for HomeBuddy - household management app
// Using local images from the slideshow folder
const slideshowImages = [
  // Plant care image - people tending to plants (your provided image)
  require('../../assets/images/slideshow/slide1.jpg'),
  // Family organizing home
  require('../../assets/images/slideshow/slide2.jpg'),
  // Clean, organized kitchen
  require('../../assets/images/slideshow/slide3.jpg'),
  // Family planning together
  require('../../assets/images/slideshow/slide4.jpg'),
];

// Auth flow types
type AuthFlow = 'email' | 'login' | 'signup' | 'verify-email' | 'post-verification';

// Constants for magic numbers
const MIN_PASSWORD_LENGTH = 8;

export default function AuthScreen() {
  const params = useLocalSearchParams();
  const { user, signOut } = useAuth();
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
  const [emailVerified, setEmailVerified] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);

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

  // Get slideshow content based on current image
  const getSlideshowTitle = () => {
    const titles = [
      'Nurture your space together',
      'Organize your family life',
      'Keep your home spotless',
      'Plan and coordinate tasks'
    ];
    return titles[currentImageIndex] || titles[0];
  };

  const getSlideshowSubtitle = () => {
    const subtitles = [
      'Care for your plants, pets, and home as a team with shared responsibility.',
      'Manage household tasks, schedules, and responsibilities together.',
      'Maintain a clean, organized home with coordinated cleaning routines.',
      'Assign tasks, track progress, and celebrate achievements as a family.'
    ];
    return subtitles[currentImageIndex] || subtitles[0];
  };

  // Auto-advance slideshow (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isMobile, slideshowImages.length]);

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
        // User exists, show login form and hide email field
        setCurrentFlow('login');
        setEmailVerified(true);
        // Focus on password field after a short delay
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
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
      `We&apos;ll send a password reset link to ${email || 'your email'}`,
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
    setEmailVerified(false);
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
      <EmailStep
        email={email}
        emailError={emailError}
        isLoading={isLoading}
        onEmailChange={setEmail}
        onEmailErrorChange={setEmailError}
        onSubmit={handleEmailCheck}
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
    <LoginStep
      email={email}
      emailVerified={emailVerified}
      password={password}
      passwordError={passwordError}
      showPassword={showPassword}
      isLoading={isLoading}
      onPasswordChange={setPassword}
      onPasswordErrorChange={setPasswordError}
      onShowPasswordToggle={() => setShowPassword(!showPassword)}
      onForgotPassword={handleForgotPassword}
      onBackToEmail={handleBackToEmail}
      onLogin={handleLogin}
      passwordInputRef={passwordInputRef}
    />
  );

  // Render signup step
  const renderSignupStep = () => (
    <SignupStep
      firstName={firstName}
      lastName={lastName}
      email={signupEmail}
      password={password}
      confirmPassword={confirmPassword}
      dateOfBirth=""
      acceptTerms={acceptTerms}
      firstNameError=""
      lastNameError=""
      passwordError={passwordError}
      dateOfBirthError=""
      isLoading={isLoading}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onDateOfBirthChange={() => {}}
      onAcceptTermsChange={setAcceptTerms}
      onFirstNameErrorChange={() => {}}
      onLastNameErrorChange={() => {}}
      onPasswordErrorChange={setPasswordError}
      onDateOfBirthErrorChange={() => {}}
      onSignup={handleSignup}
      onBackToEmail={handleBackToEmail}
    />
  );

  // Render email verification step
  const renderVerifyEmailStep = () => (
    <VerifyEmailStep
      email={signupEmail}
      isLoading={isLoading}
      onResendVerification={handleResendVerification}
      onBackToEmail={handleBackToEmail}
    />
  );

  // Get current flow title and subtitle
  const getFlowContent = () => {
    switch (currentFlow) {
      case 'email':
        return {
          title: 'Welcome',
          subtitle: 'Enter your email to continue'
        };
      case 'login':
        return {
          title: emailVerified ? 'Enter Password' : 'Sign In',
          subtitle: emailVerified ? 'Enter your password to continue' : 'Sign in to your HomeBuddy account'
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
          title: 'Welcome',
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
        return <PostVerificationStep />;
      default:
        return renderEmailStep();
    }
  };

  const flowContent = getFlowContent();

  if (isMobile) {
    return (
      <SafeAreaView style={componentStyles.safeArea} >
        <ScrollView 
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 16
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={{
                width: 100,
                height: 100,
                resizeMode: 'contain',
              }}
            />
          </View>

          {/* Welcome Title */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: colors.text.primary,
            }}>
              Welcome Home
            </Text>
          </View>

          {/* Error Message */}
          {error && error.trim() ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.error[500], textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={{ width: '100%' }}>
            {getCurrentForm()}
          </View>
        </ScrollView>
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
                alignItems: 'center'
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
          source={slideshowImages[currentImageIndex]}
          style={[componentStyles.loginSlideshowImage, { resizeMode: 'cover' }]}
        />
        
        {/* Signout Button - Top Right Corner (Only show when user is logged in) */}
        {user && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              zIndex: 10,
            }}
            onPress={async () => {
              try {
                await signOut();
                // After signout, the AuthContext will automatically update
                // and the user will be redirected to the appropriate screen
              } catch (error) {
                setError('Failed to sign out. Please try again.');
              }
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Content Overlay - Removed text */}

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
