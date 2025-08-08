import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { safeImageManipulate } from '../../../lib/image-utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { UniversalInput, UniversalButton, ErrorMessage } from '../../../components/ui';
import { componentStyles, colors, spacing, borderRadius, typography } from '../../../styles/global';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadHouseholdImage } from '../../../lib/image-upload';
import AuthGuard from '../../../components/auth/AuthGuard';
import { globalSignOut } from '../../../lib/auth-utils';

// Constants for magic numbers
const INVITE_EXPIRY_DAYS = 30;
const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_BASE = 36;
const INVITE_CODE_START = 2;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isMobile = screenWidth < 768; // Mobile breakpoint

  // Sample slideshow images - you can replace these with your own
  const slideshowImages = [
    require('../../../assets/images/slideshow/slide1.jpg'),
    require('../../../assets/images/slideshow/slide2.jpg'),
    require('../../../assets/images/slideshow/slide3.jpg'),
  ];

export default function HouseholdChoice() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [householdType, setHouseholdType] = useState<'family' | 'flat' | 'other'>('family');
  const [householdImage, setHouseholdImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nextFadeAnim = useRef(new Animated.Value(0)).current;
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  const [cropImagePosition, setCropImagePosition] = useState({ x: 0, y: 0 });
  const [cropImageScale, setCropImageScale] = useState(1);
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropContainerSize, setCropContainerSize] = useState({ width: 0, height: 0 });
  const [cropImageNaturalSize, setCropImageNaturalSize] = useState({ width: 0, height: 0 });

  // Check if user email is verified (AuthGuard handles authentication)
  useEffect(() => {
    if (!authLoading && user && !user.email_confirmed_at) {
      // User is authenticated but email not verified, redirect to verification screen
      router.replace('/(auth)/verify-email');
    }
  }, [user, authLoading]);

  // Simple slideshow with preloaded local images (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const fadeDuration = 800; // 0.8 seconds for gentle fade
      const pauseDuration = 4000; // 4 seconds pause between transitions
      const totalDuration = fadeDuration + pauseDuration;
      
      const interval = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % slideshowImages.length;
        setNextImageIndex(nextIndex);
        
        // Gentle cross-fade animation
        Animated.parallel([
          // Fade out current image over 0.8 seconds
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: fadeDuration,
            useNativeDriver: true,
          }),
          // Fade in next image over 0.8 seconds
          Animated.timing(nextFadeAnim, {
            toValue: 1,
            duration: fadeDuration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Update current image and reset animations
          setCurrentImageIndex(nextIndex);
          fadeAnim.setValue(1);
          nextFadeAnim.setValue(0);
        });
      }, totalDuration);

      return () => clearInterval(interval);
    }
  }, [isMobile, slideshowImages.length, currentImageIndex, fadeAnim, nextFadeAnim]);



  const handleCreateHousehold = async () => {
    setError('');
    setLoading(true);

    if (!householdName.trim()) {
      setError('Please enter a household name');
      setLoading(false);
      return;
    }

    if (!householdImage) {
      setError('Please add a household image');
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

      // Create household first (without image)
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([
          {
            name: householdName.trim(),
            created_by: user.id,
            household_type: householdType,
            image_url: null, // Will be updated after image upload
          }
        ])
        .select()
        .single();

      if (householdError) {
        setError(householdError.message);
        setLoading(false);
        return;
      }

      // Upload image if provided
      if (householdImage) {
        const uploadResult = await uploadHouseholdImage(
          householdImage,
          user.id,
          household.id,
          householdName.trim()
        );
        
        if (!uploadResult.success) {
          setError(`Failed to upload image: ${uploadResult.error}`);
          setLoading(false);
          return;
        }
      }

      // Add user as household member with admin role
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: 'admin'
            // Don't set joined_at - let the database handle it
          }
        ])
        .select();

      if (memberError) {
        setError(`Failed to create household member: ${memberError.message}`);
        setLoading(false);
        return;
      }

      // Create invite code for the household
      const inviteCode = generateInviteCode();
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { error: inviteError } = await supabase
        .from('invites')
        .insert([
          {
            household_id: household.id,
            created_by: user.id,
            invite_code: inviteCode,
            role: 'adult', // Use valid user_role enum value
            expires_at: expiresAt, // 30 days
          }
        ]);

      if (inviteError) {
        setError(`Failed to create invite: ${inviteError.message}`);
        setLoading(false);
        return;
      }

      // Navigate to family setup screen
      router.replace({
        pathname: '/(auth)/onboarding/family-setup',
        params: {
          householdId: household.id,
          householdName: householdName
        }
      });

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

      // Successfully joined household, redirect to main app
      router.replace('/(tabs)');

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
        setError('Permission needed: Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // We'll handle cropping in our own interface
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setCropImageUri(imageUri);
        setShowCropModal(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error picking image:', error);
      setError('Failed to pick image. Please try again.');
    }
  };

  const handleCropConfirm = async () => {
    if (cropImageUri) {
      setIsCropping(true);
      try {
        // Compute pixel crop rect relative to natural image
        const containerWidth = cropContainerSize.width;
        const containerHeight = cropContainerSize.height;
        const imgW = cropImageNaturalSize.width;
        const imgH = cropImageNaturalSize.height;

        if (!containerWidth || !containerHeight || !imgW || !imgH) {
          setHouseholdImage(cropImageUri);
        } else {
          // Fit image in container with contain mode, then apply user scale and pan
          const fitScale = Math.min(containerWidth / imgW, containerHeight / imgH);
          const displayedWidth = imgW * fitScale * cropImageScale;
          const displayedHeight = imgH * fitScale * cropImageScale;
          const centeredLeft = (containerWidth - displayedWidth) / 2;
          const centeredTop = (containerHeight - displayedHeight) / 2;
          const imgLeft = centeredLeft + cropImagePosition.x;
          const imgTop = centeredTop + cropImagePosition.y;

          // Overlay with 470x200 aspect ratio (width:height)
          const targetAspect = 470 / 200;
          const overlayScale = 0.9; // use 90% of the limiting dimension for comfortable margins
          // Start by limiting by width
          let overlayWidth = containerWidth * overlayScale;
          let overlayHeight = overlayWidth / targetAspect;
          if (overlayHeight > containerHeight * overlayScale) {
            // Height is limiting; recalc based on height
            overlayHeight = containerHeight * overlayScale;
            overlayWidth = overlayHeight * targetAspect;
          }
          const overlayLeft = (containerWidth - overlayWidth) / 2;
          const overlayTop = (containerHeight - overlayHeight) / 2;

          // Map overlay->image pixels
          const originXFloat = ((overlayLeft - imgLeft) / displayedWidth) * imgW;
          const originYFloat = ((overlayTop - imgTop) / displayedHeight) * imgH;
          const cropWidthFloat = (overlayWidth / displayedWidth) * imgW;
          const cropHeightFloat = (overlayHeight / displayedHeight) * imgH;

          const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
          const originX = Math.floor(clamp(originXFloat, 0, Math.max(0, imgW - 1)));
          const originY = Math.floor(clamp(originYFloat, 0, Math.max(0, imgH - 1)));
          const width = Math.floor(clamp(cropWidthFloat, 1, imgW - originX));
          const height = Math.floor(clamp(cropHeightFloat, 1, imgH - originY));

                const result = await safeImageManipulate(
        cropImageUri,
        [
          {
            crop: { originX, originY, width, height },
          },
        ],
        {
          compress: 0.8,
          format: 'jpeg',
        }
      );
          setHouseholdImage(result.uri);
        }
        setImagePosition({ x: 0, y: 0 });
        setImageScale(1);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error cropping image:', error);
        setError('Failed to crop image. Please try again.');
        // Fallback to original image
        setHouseholdImage(cropImageUri);
      } finally {
        setIsCropping(false);
      }
    }
    setShowCropModal(false);
    setCropImageUri(null);
    setCropImagePosition({ x: 0, y: 0 });
    setCropImageScale(1);
    setIsCropDragging(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageUri(null);
    setCropImagePosition({ x: 0, y: 0 });
    setCropImageScale(1);
    setIsCropDragging(false);
  };

  // Load natural image dimensions when opening cropper
  useEffect(() => {
    if (!cropImageUri) return;
    Image.getSize(
      cropImageUri,
      (width: number, height: number) => {
        setCropImageNaturalSize({ width, height });
      },
      () => {
        setCropImageNaturalSize({ width: 0, height: 0 });
      }
    );
  }, [cropImageUri]);

  const handleCropMouseDown = (event: any) => {
    if (Platform.OS === 'web') {
      setIsCropDragging(true);
      setCropDragStart({
        x: event.clientX - cropImagePosition.x,
        y: event.clientY - cropImagePosition.y,
      });
    }
  };

  const handleCropMouseMove = (event: any) => {
    if (Platform.OS === 'web' && isCropDragging) {
      setCropImagePosition({
        x: event.clientX - cropDragStart.x,
        y: event.clientY - cropDragStart.y,
      });
    }
  };

  const handleCropMouseUp = () => {
    if (Platform.OS === 'web') {
      setIsCropDragging(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && showCropModal) {
      if (isCropDragging) {
        document.addEventListener('mousemove', handleCropMouseMove);
        document.addEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = 'grabbing';
      } else {
        document.removeEventListener('mousemove', handleCropMouseMove);
        document.removeEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = 'default';
      }
    }

    return () => {
      if (Platform.OS === 'web') {
        document.removeEventListener('mousemove', handleCropMouseMove);
        document.removeEventListener('mouseup', handleCropMouseUp);
        document.body.style.cursor = 'default';
      }
    };
  }, [isCropDragging, showCropModal]);

  const handleSignOut = async () => {
    try {
      console.log('🔄 Household choice sign out initiated...');
      await globalSignOut('/(auth)/login');
      console.log('✅ Household choice sign out complete');
    } catch (error) {
      console.error('❌ Household choice sign out error:', error);
      setError('An unexpected error occurred during sign out.');
    }
  };

  const resetChoice = () => {
    setChoice(null);
    setHouseholdName('');
    setInviteCode('');
    setHouseholdType('family');
    setHouseholdImage(null);
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
    setError('');
    setShowCropModal(false);
    setCropImageUri(null);
    setCropImagePosition({ x: 0, y: 0 });
    setCropImageScale(1);
    setIsCropDragging(false);
    setIsCropping(false);
  };





  // Mobile layout (single column)
  if (isMobile) {
    return (
      <AuthGuard>
        <View style={componentStyles.safeArea}>


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
                <View style={{ width: '100%' }}>
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
                        <Text style={{ fontSize: spacing[6], color: colors.primary[500] }}>🏠</Text>
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
                <View style={{ width: '100%' }}>
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                    <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                      <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                    </TouchableOpacity>
                    <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Create New Household</Text>
                  </View>

                  <UniversalInput
                    label="Household Name *"
                    icon="home-outline"
                    placeholder="Enter household name"
                    value={householdName}
                    onChangeText={setHouseholdName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />

                  {/* Household Type Selector */}
                  <View style={{ marginBottom: spacing[4] }}>
                    <Text style={componentStyles.globalLabel}>
                      Household Type
                    </Text>
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
                              minHeight: 48,
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
                  <View style={{ marginBottom: spacing[4] }}>
                    <Text style={componentStyles.globalLabel}>
                      Household Image *
                    </Text>
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
                          overflow: 'hidden',
                        },
                        householdImage && { borderStyle: 'solid', borderColor: colors.primary[500] }
                      ]}
                      onPress={pickImage}
                    >
                      {householdImage ? (
                        <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                  {Platform.OS === 'web' ? (
                          <Animated.View
                            style={{
                              width: '100%',
                              height: '100%',
                              transform: [
                                { translateX: imagePosition.x },
                                { translateY: imagePosition.y },
                                { scale: imageScale },
                              ],
                            }}
                          >
                            <Image
                              source={{ uri: householdImage }}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: borderRadius.md - 2,
                                resizeMode: 'cover',
                              }}
                            />
                          </Animated.View>
                        ) : (
                            <Image
                              source={{ uri: householdImage }}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: borderRadius.md - 2,
                                resizeMode: 'cover',
                              }}
                            />
                          )}
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
                              zIndex: 10,
                            }}
                            onPress={() => {
                              setHouseholdImage(null);
                              setImagePosition({ x: 0, y: 0 });
                              setImageScale(1);
                            }}
                          >
                            <Ionicons name="close" size={spacing[4]} color={colors.text.inverse} />
                          </TouchableOpacity>
                          {Platform.OS === 'web' && (
                            <TouchableOpacity
                              style={{
                                position: 'absolute',
                                bottom: spacing[1],
                                left: spacing[1],
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: borderRadius.sm,
                                paddingHorizontal: spacing[2],
                                paddingVertical: spacing[1],
                              }}
                              onPress={() => {
                                setCropImageUri(householdImage);
                                setShowCropModal(true);
                              }}
                            >
                              <Text style={{
                                color: colors.text.inverse,
                                fontSize: 12,
                                fontWeight: '500',
                              }}>
                                Crop Image
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <View style={[componentStyles.flexCol, componentStyles.itemsCenter]}>
                          <Ionicons name="camera-outline" size={spacing[8]} color={colors.neutral[400]} />
                          <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[2] }]}>
                            Tap to add photo (required)
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <UniversalButton
                    title={loading ? 'Creating...' : 'Continue'}
                    onPress={handleCreateHousehold}
                    loading={loading}
                    disabled={!householdName.trim() || !householdImage || loading}
                    style={{ marginTop: spacing[4] }}
                  />
                </View>
              )}

              {/* Join Household Form */}
              {choice === 'join' && (
                <View style={{ width: '100%' }}>
                  <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
                    <TouchableOpacity onPress={resetChoice} style={{ marginRight: spacing[3] }}>
                      <Ionicons name="arrow-back" size={spacing[6]} color={colors.primary[500]} />
                    </TouchableOpacity>
                    <Text style={[componentStyles.text2xl, componentStyles.fontSemibold]}>Join Household</Text>
                  </View>

                  <UniversalInput
                    label="Invite Code"
                    icon="key-outline"
                    placeholder="Enter 6-digit invite code"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                  />

                  <UniversalButton
                    title={loading ? 'Joining...' : 'Join Household'}
                    onPress={handleJoinHousehold}
                    loading={loading}
                    disabled={!inviteCode.trim() || loading}
                    style={{ marginTop: spacing[4] }}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Sign Out Button - Bottom */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: colors.error[500],
            borderRadius: borderRadius.md,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          onPress={handleSignOut}
        >
          <Text style={{
            color: colors.text.inverse,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
      </AuthGuard>
    );
  }

  // Desktop layout (split panel)
  return (
    <AuthGuard>
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
                      <Ionicons name="home-outline" size={spacing[6]} color={colors.primary[500]} />
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

                <UniversalInput
                  label="Household Name *"
                  icon="home-outline"
                  placeholder="Enter household name"
                  value={householdName}
                  onChangeText={setHouseholdName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />

                {/* Household Type Selector */}
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={componentStyles.globalLabel}>Household Type</Text>
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
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={componentStyles.globalLabel}>Household Image *</Text>
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
                        overflow: 'hidden',
                      },
                      householdImage && { borderStyle: 'solid', borderColor: colors.primary[500] }
                    ]}
                    onPress={pickImage}
                  >
                    {householdImage ? (
                      <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {Platform.OS === 'web' ? (
                          <Animated.View
                            style={{
                              width: '100%',
                              height: '100%',
                              transform: [
                                { translateX: imagePosition.x },
                                { translateY: imagePosition.y },
                                { scale: imageScale },
                              ],
                            }}
                            /* removed leftover web drag handler */
                          >
                            <Image
                              source={{ uri: householdImage }}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: borderRadius.md - 2,
                                resizeMode: 'cover',
                              }}
                            />
                          </Animated.View>
                        ) : (
                          <Image
                            source={{ uri: householdImage }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: borderRadius.md - 2,
                              resizeMode: 'cover',
                            }}
                          />
                        )}
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
                            zIndex: 10,
                          }}
                          onPress={() => {
                            setHouseholdImage(null);
                            setImagePosition({ x: 0, y: 0 });
                            setImageScale(1);
                            /* removed leftover drag state */
                          }}
                        >
                          <Ionicons name="close" size={spacing[4]} color={colors.text.inverse} />
                        </TouchableOpacity>
                        {Platform.OS === 'web' && (
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              bottom: spacing[1],
                              left: spacing[1],
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              borderRadius: borderRadius.sm,
                              paddingHorizontal: spacing[2],
                              paddingVertical: spacing[1],
                            }}
                            onPress={() => {
                              setCropImageUri(householdImage);
                              setShowCropModal(true);
                            }}
                          >
                            <Text style={{
                              color: colors.text.inverse,
                              fontSize: 12,
                              fontWeight: '500',
                            }}>
                              Crop Image
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <View style={[componentStyles.flexCol, componentStyles.itemsCenter]}>
                        <Ionicons name="camera-outline" size={spacing[8]} color={colors.neutral[400]} />
                        <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[2] }]}> 
                          Tap to add photo (required)
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <UniversalButton
                  title={loading ? 'Creating...' : 'Continue'}
                  onPress={handleCreateHousehold}
                  loading={loading}
                  disabled={!householdName.trim() || !householdImage || loading}
                  variant="primary"
                  style={{ marginTop: spacing[4] }}
                />
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

                <UniversalInput
                  label="Invite Code"
                  icon="key-outline"
                  placeholder="Enter 6-digit invite code"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                />

                <UniversalButton
                  title={loading ? 'Joining...' : 'Join Household'}
                  onPress={handleJoinHousehold}
                  loading={loading}
                  disabled={!inviteCode.trim() || loading}
                  variant="primary"
                  style={{ marginTop: spacing[4] }}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Right Panel - Image Slideshow (Desktop Only) */}
      <View style={componentStyles.loginSlideshowPanel}>
        {/* Pre-render all images and control opacity */}
        {slideshowImages.map((imageSource, index) => (
          <Animated.View 
            key={index}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              opacity: index === currentImageIndex ? fadeAnim : 
                      index === nextImageIndex ? nextFadeAnim : 0
            }}
          >
            <Image
              source={imageSource}
              style={[componentStyles.loginSlideshowImage, { resizeMode: 'cover' }]}
            />
          </Animated.View>
        ))}
        
        {/* Sign Out Button - Top Right */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: colors.error[500],
            borderRadius: borderRadius.md,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 10,
          }}
          onPress={handleSignOut}
        >
          <Text style={{
            color: colors.text.inverse,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Sign Out
          </Text>
        </TouchableOpacity>

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

      {/* Image Cropping Modal */}
      <Modal
        visible={showCropModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCropCancel}
      >
        <View
          style={[
            componentStyles.flex1,
            { backgroundColor: colors.background },
            Platform.OS === 'web' ? { alignItems: 'center', justifyContent: 'center' } : null
          ]}
        >
          <View style={[
            Platform.OS === 'web'
              ? { width: 800, height: 800, maxWidth: '100%', maxHeight: '100%' }
              : { flex: 1 }
          ]}>
            {/* Header */}
            <View style={[componentStyles.flexRow, componentStyles.itemsCenter, componentStyles.justifyBetween, { 
              paddingHorizontal: spacing[4], 
              paddingVertical: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }]}>
              <TouchableOpacity onPress={handleCropCancel}>
                <Text style={[componentStyles.text, { color: colors.primary[500] }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[componentStyles.textLg, componentStyles.fontSemibold]}>Crop Image</Text>
              <TouchableOpacity onPress={handleCropConfirm} disabled={isCropping}>
                <Text style={[componentStyles.text, { color: isCropping ? colors.neutral[400] : colors.primary[500] }]}>
                  {isCropping ? 'Cropping...' : 'Done'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Image Cropping Area */}
            <View style={[componentStyles.flex1, { padding: spacing[4] }]}>
              {cropImageUri && (
                <View style={[componentStyles.flex1, { 
                  backgroundColor: colors.neutral[100],
                  borderRadius: borderRadius.lg,
                  overflow: 'hidden',
                  position: 'relative',
                }]}>
                  <View
                    style={{ width: '100%', height: '100%' }}
                    {...(Platform.OS === 'web' ? { onMouseDown: handleCropMouseDown } : {})}
                    {...(Platform.OS === 'web' ? { onWheel: (e: any) => {
                      e.preventDefault?.();
                      const delta = e.deltaY || e.nativeEvent?.deltaY || 0;
                      const next = Math.max(0.2, Math.min(5, cropImageScale * (delta > 0 ? 0.95 : 1.05)));
                      setCropImageScale(next);
                    } } : {})}
                    onLayout={(e) => {
                      const { width, height } = e.nativeEvent.layout;
                      setCropContainerSize({ width, height });
                    }}
                  >
                    <Animated.View
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: [
                          { translateX: cropImagePosition.x },
                          { translateY: cropImagePosition.y },
                          { scale: cropImageScale },
                        ],
                      }}
                    >
                      <Image
                        source={{ uri: cropImageUri }}
                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                      />
                    </Animated.View>
                  </View>

                  {/* Crop Overlay with 470x200 aspect ratio */}
                  {(() => {
                    const contW = cropContainerSize.width || 0;
                    const contH = cropContainerSize.height || 0;
                    const aspect = 470 / 200;
                    const scale = 0.9;
                    let oW = contW * scale;
                    let oH = oW / aspect;
                    if (oH > contH * scale) {
                      oH = contH * scale;
                      oW = oH * aspect;
                    }
                    const oLeft = (contW - oW) / 2;
                    const oTop = (contH - oH) / 2;
                    return (
                      <View style={{
                        position: 'absolute',
                        top: oTop,
                        left: oLeft,
                        width: oW,
                        height: oH,
                        borderWidth: 2,
                        borderColor: colors.primary[500],
                        backgroundColor: 'rgba(0, 0, 0, 0.3)'
                      }}>
                        <View style={{
                          position: 'absolute',
                          top: -1,
                          left: -1,
                          right: -1,
                          bottom: -1,
                          borderWidth: 1,
                          borderColor: colors.text.inverse,
                          backgroundColor: 'transparent',
                        }} />
                      </View>
                    );
                  })()}

                  {/* Instructions */}
                  <View style={{
                    position: 'absolute',
                    bottom: spacing[10],
                    left: spacing[4],
                    right: spacing[4],
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: borderRadius.md,
                    padding: spacing[3],
                  }}>
                    <Text style={{
                      color: colors.text.inverse,
                      fontSize: 14,
                      textAlign: 'center',
                      fontWeight: '500',
                    }}>
                      Drag to position. Use mouse wheel or controls to zoom.
                    </Text>
                  </View>

                  {/* Zoom Controls */}
                  <View style={{
                    position: 'absolute',
                    bottom: spacing[3],
                    right: spacing[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[2],
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[2],
                    borderRadius: borderRadius.md,
                  }}>
                    <TouchableOpacity
                      onPress={() => setCropImageScale(Math.max(0.2, cropImageScale * 0.9))}
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: borderRadius.sm,
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[1],
                      }}
                    >
                      <Text style={{ color: colors.text.primary, fontWeight: '600' }}>-</Text>
                    </TouchableOpacity>
                    {Platform.OS === 'web' && (
                      <View style={{ width: 160 }}>
                        {/* @ts-ignore web-only input */}
                        <input
                          type="range"
                          min={0.2}
                          max={5}
                          step={0.01}
                          value={cropImageScale}
                          onChange={(e: any) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isNaN(val)) setCropImageScale(val);
                          }}
                          style={{ width: '100%' }}
                        />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => setCropImageScale(Math.min(5, cropImageScale * 1.1))}
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: borderRadius.sm,
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[1],
                      }}
                    >
                      <Text style={{ color: colors.text.primary, fontWeight: '600' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </AuthGuard>
  );
} 