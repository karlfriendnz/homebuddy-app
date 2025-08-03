import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { componentStyles, colors, spacing, borderRadius, typography } from '../../../styles/global';
import { useAuth } from '../../../contexts/AuthContext';

// Constants for magic numbers
const INVITE_EXPIRY_DAYS = 30;
const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_BASE = 36;
const INVITE_CODE_START = 2;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768; // Mobile breakpoint

// Sample slideshow images - you can replace these with your own
const slideshowImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c33c89424de2d?w=800&h=1200&fit=crop',
];

export default function HouseholdChoice() {
  const { user, loading: authLoading } = useAuth();
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [householdType, setHouseholdType] = useState<'family' | 'flat' | 'other'>('family');
  const [householdImage, setHouseholdImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check if user is authenticated and email is verified
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.replace('/login');
        return;
      }

      if (!user.email_confirmed_at) {
        // User is authenticated but email not verified, redirect to verification screen
        router.replace('/(auth)/verify-email');
        return;
      }
    }
  }, [user, authLoading]);

  // Auto-advance slideshow (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  const uploadImageToSupabase = async (uri: string, userId: string): Promise<string> => {
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `household-images/${fileName}`;

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('household-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('household-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleCreateHousehold = async () => {
    setError('');
    setLoading(true);

    if (!householdName.trim()) {
      setError('Please enter a household name');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      let imageUrl = null;
      
      // Upload image if provided
      if (householdImage) {
        try {
          imageUrl = await uploadImageToSupabase(householdImage, user.id);
        } catch (uploadError) {
          // eslint-disable-next-line no-console
          console.error('Upload error:', uploadError);
          setError('Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([
          {
            name: householdName.trim(),
            created_by: user.id,
            household_type: householdType,
            image_url: imageUrl,
          }
        ])
        .select()
        .single();

      if (householdError) {
        setError(householdError.message);
        setLoading(false);
        return;
      }

      // Add user as household member with admin role
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: 'admin',
            joined_at: new Date().toISOString(),
          }
        ]);

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // Create invite code for the household
      const inviteCode = generateInviteCode();
      const { error: inviteError } = await supabase
        .from('invites')
        .insert([
          {
            household_id: household.id,
            created_by: user.id,
            invite_code: inviteCode,
            role: 'member',
            expires_at: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          }
        ]);

      if (inviteError) {
        setError(inviteError.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        'Household Created!',
        `Your household "${householdName}" has been created successfully.`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Create household error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    setError('');
    setLoading(true);

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Find invite by invite code
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*, households(*)')
        .eq('invite_code', inviteCode.trim())
        .eq('is_active', true)
        .single();

      if (inviteError || !invite) {
        setError('Invalid invite code');
        setLoading(false);
        return;
      }

      // Check if invite has expired
      if (new Date(invite.expires_at) < new Date()) {
        setError('This invite code has expired');
        setLoading(false);
        return;
      }

      const household = invite.households;

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', household.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setError('You are already a member of this household');
        setLoading(false);
        return;
      }

      // Add user as household member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: invite.role,
            invited_by: invite.created_by,
            invite_accepted_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          }
        ]);

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // Mark invite as used
      const { error: updateInviteError } = await supabase
        .from('invites')
        .update({
          used_by: user.id,
          used_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', invite.id);

      if (updateInviteError) {
        // eslint-disable-next-line no-console
        console.error('Error updating invite:', updateInviteError);
        // Don't fail the whole operation if invite update fails
      }

      Alert.alert(
        'Joined Household!',
        `You have successfully joined "${household.name}".`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Join household error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(INVITE_CODE_BASE).substring(INVITE_CODE_START, INVITE_CODE_START + INVITE_CODE_LENGTH).toUpperCase();
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setHouseholdImage(result.assets[0].uri);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError('Failed to sign out. Please try again.');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Sign out error:', error);
      setError('An unexpected error occurred during sign out.');
    }
  };

  const resetChoice = () => {
    setChoice(null);
    setHouseholdName('');
    setInviteCode('');
    setHouseholdType('family');
    setHouseholdImage(null);
    setError('');
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={[componentStyles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>Loading...</Text>
      </View>
    );
  }

  // Show loading screen if user is not authenticated or email not verified
  if (!user || !user.email_confirmed_at) {
    return (
      <View style={[componentStyles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>Loading...</Text>
      </View>
    );
  }

  // Mobile layout (single column)
  if (isMobile) {
    return (
      <View style={componentStyles.safeArea}>
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
                Welcome to HomeBuddy!
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                Choose how you'd like to get started
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} visible={!!error} />

            {/* Choice Selection */}
            {!choice && (
              <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                {/* Create New Household Option */}
                <TouchableOpacity 
                  style={[componentStyles.card, { marginBottom: spacing[4] }]}
                  onPress={() => setChoice('create')}
                >
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter]}>
                    <View style={[componentStyles.roundedFull, { 
                      backgroundColor: colors.primary[100], 
                      width: spacing[12], 
                      height: spacing[12], 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: spacing[4]
                    }]}>
                      <Ionicons name="add-circle-outline" size={spacing[6]} color={colors.primary[500]} />
                    </View>
                    <View style={componentStyles.flex1}>
                      <Text style={[componentStyles.textLg, componentStyles.fontSemibold, componentStyles.textPrimary]}>
                        Create New Household
                      </Text>
                      <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[1] }]}>
                        Start fresh with your own household
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                  </View>
                </TouchableOpacity>

                {/* Join Existing Household Option */}
                <TouchableOpacity 
                  style={componentStyles.card}
                  onPress={() => setChoice('join')}
                >
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter]}>
                    <View style={[componentStyles.roundedFull, { 
                      backgroundColor: colors.success[100], 
                      width: spacing[12], 
                      height: spacing[12], 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: spacing[4]
                    }]}>
                      <Ionicons name="people-outline" size={spacing[6]} color={colors.success[500]} />
                    </View>
                    <View style={componentStyles.flex1}>
                      <Text style={[componentStyles.textLg, componentStyles.fontSemibold, componentStyles.textPrimary]}>
                        Join Existing Household
                      </Text>
                      <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[1] }]}>
                        Join a household with an invite code
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={spacing[5]} color={colors.neutral[400]} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Create Household Form */}
            {choice === 'create' && (
              <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                  <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                    <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                  </TouchableOpacity>
                  <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Create New Household</Text>
                </View>

                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Name</Text>
                  <View style={componentStyles.authInput}>
                    <Ionicons name="home-outline" size={spacing[5]} color={colors.neutral[500]} />
                    <TextInput
                      style={componentStyles.authInputText}
                      placeholder="Enter household name"
                      placeholderTextColor={colors.neutral[400]}
                      value={householdName}
                      onChangeText={setHouseholdName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Household Type Selector */}
                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Type</Text>
                  <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
                    {([
                      { type: 'family', icon: 'people', label: 'Family' },
                      { type: 'flat', icon: 'home', label: 'Flat' },
                      { type: 'other', icon: 'ellipsis-horizontal', label: 'Other' }
                    ] as const).map(({ type, icon, label }) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: spacing[3],
                            paddingHorizontal: spacing[4],
                            borderRadius: borderRadius.md,
                            borderWidth: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing[1],
                          },
                          householdType === type
                            ? { backgroundColor: colors.primary[500], borderColor: colors.primary[500] }
                            : { backgroundColor: colors.background, borderColor: colors.neutral[300] }
                        ]}
                        onPress={() => setHouseholdType(type)}
                      >
                        <Ionicons 
                          name={icon as keyof typeof Ionicons.glyphMap} 
                          size={spacing[4]} 
                          color={householdType === type ? colors.text.inverse : colors.neutral[500]} 
                        />
                        <Text style={[
                          componentStyles.textSm,
                          componentStyles.fontMedium,
                          householdType === type
                            ? { color: colors.text.inverse }
                            : { color: colors.text.primary }
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Household Image Uploader */}
                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Image (Optional)</Text>
                  <TouchableOpacity
                    style={[
                      {
                        width: '100%',
                        height: 120,
                        borderRadius: borderRadius.md,
                        borderWidth: 2,
                        borderColor: colors.neutral[300],
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.neutral[50],
                      },
                      householdImage && { borderStyle: 'solid', borderColor: colors.primary[500] }
                    ]}
                    onPress={pickImage}
                  >
                    {householdImage ? (
                      <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: householdImage }}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: borderRadius.md - 2,
                          }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: spacing[1],
                            right: spacing[1],
                            backgroundColor: colors.error[500],
                            borderRadius: borderRadius.full,
                            width: spacing[6],
                            height: spacing[6],
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => setHouseholdImage(null)}
                        >
                          <Ionicons name="close" size={spacing[4]} color={colors.text.inverse} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[componentStyles.flexCol, componentStyles.itemsCenter]}>
                        <Ionicons name="camera-outline" size={spacing[8]} color={colors.neutral[400]} />
                        <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[2] }]}>
                          Tap to add photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[componentStyles.authButton, (!householdName.trim() || loading) && componentStyles.authButtonDisabled]} 
                  onPress={handleCreateHousehold}
                  disabled={!householdName.trim() || loading}
                >
                  <Text style={componentStyles.authButtonText}>
                    {loading ? 'Creating...' : 'Create Household'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Join Household Form */}
            {choice === 'join' && (
              <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                  <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                    <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                  </TouchableOpacity>
                  <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Join Household</Text>
                </View>

                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Invite Code</Text>
                  <View style={componentStyles.authInput}>
                    <Ionicons name="key-outline" size={20} color={colors.neutral[500]} />
                    <TextInput
                      style={componentStyles.authInputText}
                      placeholder="Enter 6-digit invite code"
                      placeholderTextColor={colors.neutral[400]}
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[componentStyles.authButton, (!inviteCode.trim() || loading) && componentStyles.authButtonDisabled]} 
                  onPress={handleJoinHousehold}
                  disabled={!inviteCode.trim() || loading}
                >
                  <Text style={componentStyles.authButtonText}>
                    {loading ? 'Joining...' : 'Join Household'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Desktop layout (split panel)
  return (
    <View style={componentStyles.loginContainer}>
      {/* Left Panel - Household Choice Form */}
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
                Welcome to HomeBuddy!
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                Choose how you'd like to get started
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} visible={!!error} />

            {/* Choice Selection */}
            {!choice && (
              <View style={{ width: '100%', maxWidth: 400 }}>
                {/* Create New Household Option */}
                <TouchableOpacity 
                  style={[componentStyles.card, { marginBottom: spacing[4] }]}
                  onPress={() => setChoice('create')}
                >
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter]}>
                    <View style={[componentStyles.roundedFull, { 
                      backgroundColor: colors.primary[100], 
                      width: spacing[12], 
                      height: spacing[12], 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: spacing[4]
                    }]}>
                      <Ionicons name="add-circle-outline" size={spacing[6]} color={colors.primary[500]} />
                    </View>
                    <View style={componentStyles.flex1}>
                      <Text style={[componentStyles.textLg, componentStyles.fontSemibold, componentStyles.textPrimary]}>
                        Create New Household
                      </Text>
                      <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[1] }]}>
                        Start fresh with your own household
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                  </View>
                </TouchableOpacity>

                {/* Join Existing Household Option */}
                <TouchableOpacity 
                  style={componentStyles.card}
                  onPress={() => setChoice('join')}
                >
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter]}>
                    <View style={[componentStyles.roundedFull, { 
                      backgroundColor: colors.success[100], 
                      width: spacing[12], 
                      height: spacing[12], 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: spacing[4]
                    }]}>
                      <Ionicons name="people-outline" size={spacing[6]} color={colors.success[500]} />
                    </View>
                    <View style={componentStyles.flex1}>
                      <Text style={[componentStyles.textLg, componentStyles.fontSemibold, componentStyles.textPrimary]}>
                        Join Existing Household
                      </Text>
                      <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[1] }]}>
                        Join a household with an invite code
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={spacing[5]} color={colors.neutral[400]} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Create Household Form */}
            {choice === 'create' && (
              <View style={{ width: '100%', maxWidth: 400 }}>
                <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                  <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                    <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                  </TouchableOpacity>
                  <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Create New Household</Text>
                </View>

                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Name</Text>
                  <View style={componentStyles.authInput}>
                    <Ionicons name="home-outline" size={spacing[5]} color={colors.neutral[500]} />
                    <TextInput
                      style={componentStyles.authInputText}
                      placeholder="Enter household name"
                      placeholderTextColor={colors.neutral[400]}
                      value={householdName}
                      onChangeText={setHouseholdName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Household Type Selector */}
                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Type</Text>
                  <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
                    {([
                      { type: 'family', icon: 'people', label: 'Family' },
                      { type: 'flat', icon: 'home', label: 'Flat' },
                      { type: 'other', icon: 'ellipsis-horizontal', label: 'Other' }
                    ] as const).map(({ type, icon, label }) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: spacing[3],
                            paddingHorizontal: spacing[4],
                            borderRadius: borderRadius.md,
                            borderWidth: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing[1],
                          },
                          householdType === type
                            ? { backgroundColor: colors.primary[500], borderColor: colors.primary[500] }
                            : { backgroundColor: colors.background, borderColor: colors.neutral[300] }
                        ]}
                        onPress={() => setHouseholdType(type)}
                      >
                        <Ionicons 
                          name={icon as keyof typeof Ionicons.glyphMap} 
                          size={spacing[4]} 
                          color={householdType === type ? colors.text.inverse : colors.neutral[500]} 
                        />
                        <Text style={[
                          componentStyles.textSm,
                          componentStyles.fontMedium,
                          householdType === type
                            ? { color: colors.text.inverse }
                            : { color: colors.text.primary }
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Household Image Uploader */}
                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Household Image (Optional)</Text>
                  <TouchableOpacity
                    style={[
                      {
                        width: '100%',
                        height: 120,
                        borderRadius: borderRadius.md,
                        borderWidth: 2,
                        borderColor: colors.neutral[300],
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.neutral[50],
                      },
                      householdImage && { borderStyle: 'solid', borderColor: colors.primary[500] }
                    ]}
                    onPress={pickImage}
                  >
                    {householdImage ? (
                      <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: householdImage }}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: borderRadius.md - 2,
                          }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: spacing[1],
                            right: spacing[1],
                            backgroundColor: colors.error[500],
                            borderRadius: borderRadius.full,
                            width: spacing[6],
                            height: spacing[6],
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => setHouseholdImage(null)}
                        >
                          <Ionicons name="close" size={spacing[4]} color={colors.text.inverse} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[componentStyles.flexCol, componentStyles.itemsCenter]}>
                        <Ionicons name="camera-outline" size={spacing[8]} color={colors.neutral[400]} />
                        <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[2] }]}>
                          Tap to add photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[componentStyles.authButton, (!householdName.trim() || loading) && componentStyles.authButtonDisabled]} 
                  onPress={handleCreateHousehold}
                  disabled={!householdName.trim() || loading}
                >
                  <Text style={componentStyles.authButtonText}>
                    {loading ? 'Creating...' : 'Create Household'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Join Household Form */}
            {choice === 'join' && (
              <View style={{ width: '100%', maxWidth: 400 }}>
                <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                  <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                    <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                  </TouchableOpacity>
                  <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Join Household</Text>
                </View>

                <View style={componentStyles.authInputContainer}>
                  <Text style={componentStyles.authInputLabel}>Invite Code</Text>
                  <View style={componentStyles.authInput}>
                    <Ionicons name="key-outline" size={20} color={colors.neutral[500]} />
                    <TextInput
                      style={componentStyles.authInputText}
                      placeholder="Enter 6-digit invite code"
                      placeholderTextColor={colors.neutral[400]}
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[componentStyles.authButton, (!inviteCode.trim() || loading) && componentStyles.authButtonDisabled]} 
                  onPress={handleJoinHousehold}
                  disabled={!inviteCode.trim() || loading}
                >
                  <Text style={componentStyles.authButtonText}>
                    {loading ? 'Joining...' : 'Join Household'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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