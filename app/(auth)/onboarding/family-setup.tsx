import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
  ImageBackground,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { componentStyles, colors, spacing, borderRadius, typography } from '../../../styles/global';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { BannerImage } from '../../../components/ui';
import { DateOfBirthPicker } from '../../../components/ui/DatePicker';
import { ImageCropper } from '../../../components/ui/ImageCropper';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth: string; // Now required
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role: 'admin' | 'adult' | 'teen' | 'child' | 'relative' | 'pet';
  profile_picture?: string;
  is_temp?: boolean;
}

export default function FamilySetup() {
  const { user } = useAuth();
  const { householdId, householdName } = useLocalSearchParams<{ householdId: string; householdName: string }>();
  
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');
  const [phase, setPhase] = useState<'profile' | 'members'>('profile');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    email?: string;
    phone?: string;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [householdInfo, setHouseholdInfo] = useState<{ id: string; name: string; image_url?: string | null; household_type?: string | null } | null>(null);
  
  // Profile image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  
  // Ref for first name input focus
  const firstNameInputRef = useRef<TextInput>(null);
  
  // Form state for adding new member
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'female',
    role: 'adult',
    profile_picture: '',
  });

  // Initialize with the current user as the first family member and populate form
  useEffect(() => {
    if (user) {
      setFamilyMembers([
        {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          date_of_birth: '', // Will be filled by user
          role: 'admin',
          is_temp: false,
        }
      ]);
      
      // Populate the form with user's data
      setNewMember({
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        nickname: '',
        email: user.email || '',
        phone: '',
        date_of_birth: '',
        gender: 'female',
        role: 'admin',
        profile_picture: '',
      });
    }
  }, [user]);

  // Focus first name input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      firstNameInputRef.current?.focus();
    }, 500); // Small delay to ensure component is fully rendered

    return () => clearTimeout(timer);
  }, []);

  // Fetch household info for header (image, type)
  useEffect(() => {
    const fetchHousehold = async () => {
      if (!householdId) return;
      try {
        const { data, error } = await supabase
          .from('households')
          .select('id, name, image_url, household_type')
          .eq('id', householdId)
          .single();
        if (!error && data) setHouseholdInfo(data as any);
      } catch {}
    };
    fetchHousehold();
  }, [householdId]);

  // Function to send invite email
  const sendInviteEmail = async (email: string, firstName: string, lastName: string, role: string) => {
    try {
      // Generate a unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      // Create invite record in database
      const { error: inviteError } = await supabase
        .from('invites')
        .insert([
          {
            household_id: householdId,
            created_by: user?.id,
            invite_code: inviteCode,
            email: email.toLowerCase().trim(),
            role: role,
            expires_at: expiresAt,
            is_active: true,
          }
        ]);

      if (inviteError) {
        throw new Error(`Failed to create invite: ${inviteError.message}`);
      }

      // Send email via Supabase Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: email,
          firstName: firstName,
          lastName: lastName,
          householdName: householdName && householdName.trim() ? householdName : 'your household',
          inviteCode: inviteCode,
          role: role,
          invitedBy: user?.user_metadata?.first_name || 'a family member',
        },
      });

      if (emailError) {
        throw new Error(`Failed to send email: ${emailError.message}`);
      }

      return true;

    } catch (error) {
      throw error;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // We'll handle cropping ourselves
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCropImageUri(result.assets[0].uri);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = async (croppedImageUri: string) => {
    try {
      // Update the user's avatar URL in Supabase
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: { 
            avatar_url: croppedImageUri,
            profile_picture: croppedImageUri // Also store in profile_picture for consistency
          }
        });
        
        if (error) {
          console.error('Error updating avatar URL:', error);
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        } else {
          console.log('Avatar URL updated successfully');
          
          // Refresh the user session to get updated metadata
          const { data: { session }, error: refreshError } = await supabase.auth.getSession();
          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
          } else {
            console.log('Session refreshed with updated metadata');
          }
        }
      }
      
      // Update the local state for the form
      setNewMember(prev => ({
        ...prev,
        profile_picture: croppedImageUri
      }));
      
      // Update the first family member (current user) in the family members list
      setFamilyMembers(prev => {
        if (prev.length > 0 && prev[0].id === user?.id) {
          const updatedMembers = [...prev];
          updatedMembers[0] = {
            ...updatedMembers[0],
            profile_picture: croppedImageUri
          };
          return updatedMembers;
        }
        return prev;
      });
      
      setShowCropModal(false);
      setCropImageUri(null);
    } catch (error) {
      console.error('Error in handleCropComplete:', error);
      Alert.alert('Error', 'Failed to save profile picture. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageUri(null);
  };

  const savePrimaryProfile = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      setError('Please fix the validation errors before continuing');
      return;
    }

    // Update the primary user's entry in the list (index 0)
    setFamilyMembers(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = {
        id: prev[0].id,
        first_name: newMember.first_name!.trim(),
        last_name: newMember.last_name!.trim(),
        nickname: newMember.nickname?.trim() || undefined,
        email: newMember.email?.trim() || undefined,
        phone: newMember.phone?.trim() || undefined,
        date_of_birth: newMember.date_of_birth || '',
        gender: newMember.gender || 'prefer_not_to_say',
        role: 'admin',
        profile_picture: newMember.profile_picture || undefined,
        is_temp: false,
      } as FamilyMember;
      return updated;
    });

    // Reset form (including image and DOB) and move to members phase
    setNewMember({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      role: 'adult',
      profile_picture: '',
    });
    setCropImageUri(null);
    setShowCropModal(false);
    setValidationErrors({});
    setError('');
    setSuccessMessage('Your profile has been updated. You can now add family members.');

    setPhase('members');
    setActiveTab('list');

    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const addFamilyMember = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      setError('Please fix the validation errors before continuing');
      return;
    }

    const member: FamilyMember = {
      id: editingIndex !== null ? familyMembers[editingIndex].id : `temp_${Date.now()}`,
      first_name: newMember.first_name!.trim(),
      last_name: newMember.last_name!.trim(),
      nickname: newMember.nickname?.trim() || undefined,
      email: newMember.email?.trim() || undefined,
      phone: newMember.phone?.trim() || undefined,
      date_of_birth: newMember.date_of_birth || '',
      gender: newMember.gender || 'prefer_not_to_say',
      role: newMember.role || 'adult',
      profile_picture: newMember.profile_picture || undefined,
      is_temp: true,
    };

    // Send invite email if email is provided
    const memberName = (member.first_name && member.first_name.trim()) || (member.last_name && member.last_name.trim()) ? `${member.first_name || ''} ${member.last_name || ''}`.trim() : 'Family member';
          const displayName = memberName || 'Family member';
      let successMessage = editingIndex !== null 
        ? `Great! ${displayName} has been updated.`
        : `Great! ${displayName} has been added to your family members.`;
    
    if (member.email && householdId && member.role !== 'admin' && member.id !== user?.id) {
      try {
        await sendInviteEmail(member.email, member.first_name, member.last_name, member.role);
        successMessage = `Great! ${displayName} has been added and an invite email has been sent.`;
      } catch (error) {
        // Keep the default success message
      }
    }

    if (editingIndex !== null) {
      // Update existing member
      const updatedMembers = [...familyMembers];
      updatedMembers[editingIndex] = member;
      setFamilyMembers(updatedMembers);
      setEditingIndex(null);
    } else {
      // Add new member
      setFamilyMembers([...familyMembers, member]);
    }
    
    // Reset form (including image and DOB)
    setNewMember({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      role: 'adult',
      profile_picture: '',
    });
    setCropImageUri(null);
    setShowCropModal(false);
    setValidationErrors({});
    
    setError('');
    setSuccessMessage(successMessage);
    
    // Switch to family members tab after save
    setActiveTab('list');
    setPhase('members');

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const removeFamilyMember = (index: number) => {
    const member = familyMembers[index];
    
    if (member.role === 'admin') {
      Alert.alert('Cannot Remove', 'You cannot remove yourself as the household admin.');
      return;
    }
    
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member.first_name} ${member.last_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedMembers = familyMembers.filter((_, i) => i !== index);
            setFamilyMembers(updatedMembers);
          },
        },
      ]
    );
  };

  const editFamilyMember = (index: number) => {
    const member = familyMembers[index];
    
    // Pre-fill the form with member details
    setNewMember({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      gender: member.gender || 'prefer_not_to_say',
      role: member.role,
      profile_picture: member.profile_picture || '',
    });
    
    // Switch to Add tab
    setActiveTab('add');
    
    // Set editing state
    setEditingIndex(index);
  };

  // Start adding a brand new family member with an empty form
  const startAddFamilyMember = () => {
    setActiveTab('add');
    setEditingIndex(null);
    setNewMember({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      role: 'adult',
      profile_picture: '',
    });
    setCropImageUri(null);
    setShowCropModal(false);
    setValidationErrors({});
    setError('');
  };

  const handleContinue = async () => {
    console.log('🚀 Continue to Home button clicked!');
    console.log('📝 Current form data:', newMember);
    console.log('👥 Current family members:', familyMembers);
    
    setLoading(true);
    setError('');

    try {
      // First, check if there's a person being filled in on the form
      const hasFormData = (newMember.first_name && newMember.first_name.trim()) || 
                         (newMember.last_name && newMember.last_name.trim()) || 
                         (newMember.email && newMember.email.trim());
      
      console.log('🔍 Has form data?', hasFormData);
      
      if (hasFormData) {
        // Validate the form data
        if (!newMember.first_name?.trim() || !newMember.last_name?.trim()) {
          setError('Please enter both first name and last name');
          setLoading(false);
          return;
        }

        if (!newMember.date_of_birth?.trim()) {
          setError('Please select a date of birth');
          setLoading(false);
          return;
        }

        // Add the current form data as a family member
        const newFamilyMember: FamilyMember = {
          id: `temp-${Date.now()}`,
          first_name: newMember.first_name?.trim() || '',
          last_name: newMember.last_name?.trim() || '',
          nickname: newMember.nickname?.trim() || '',
          email: newMember.email?.trim() || '',
          phone: newMember.phone?.trim() || '',
          date_of_birth: newMember.date_of_birth || '',
          gender: newMember.gender || 'prefer_not_to_say',
          role: newMember.role || 'adult',
          profile_picture: newMember.profile_picture || '',
          is_temp: true,
        };

        console.log('➕ Adding new family member:', newFamilyMember);
        setFamilyMembers(prev => [...prev, newFamilyMember]);
        
        // Clear the form
        setNewMember({
          first_name: '',
          last_name: '',
          nickname: '',
          email: '',
          phone: '',
          date_of_birth: '',
          gender: 'prefer_not_to_say',
          role: 'adult',
          profile_picture: '',
        });
        
        // Reset editing state
        setEditingIndex(null);
        console.log('🧹 Form cleared and editing state reset');
      }

      // Now validate all family members (including the one we just added)
      const validMembers = familyMembers.filter(member => 
        member.first_name.trim() && member.last_name.trim() && member.date_of_birth.trim()
      );

      console.log('✅ Valid family members:', validMembers);

      if (validMembers.length === 0) {
        console.log('❌ No valid family members found');
        setError('Please add at least one family member with first name, last name, and date of birth');
        setLoading(false);
        return;
      }

      // Send invites to all family members with email addresses
      const membersWithEmails = validMembers.filter(member => member.email && member.role !== 'admin');
      let inviteCount = 0;
      let failedInvites = 0;

      if (membersWithEmails.length > 0) {
        for (const member of membersWithEmails) {
          try {
            await sendInviteEmail(member.email!, member.first_name, member.last_name, member.role);
            inviteCount++;
          } catch (error) {
            failedInvites++;
          }
        }
      }

      // Show completion message with invite status
      const memberCount = validMembers ? validMembers.length : 0;
      let message = `Your household "${householdName && householdName.trim() ? householdName : 'your household'}" is ready with ${memberCount} family member${memberCount > 1 ? 's' : ''}.`;
      
      if (inviteCount > 0) {
        message += `\n\n✅ ${inviteCount} invite${inviteCount > 1 ? 's' : ''} sent successfully!`;
      }
      
      if (failedInvites > 0) {
        message += `\n\n⚠️ ${failedInvites} invite${failedInvites > 1 ? 's' : ''} failed to send.`;
      }

      // Mark household onboarding as completed
      if (householdId) {
        try {
          const { error: updateError } = await supabase
            .from('households')
            .update({ onboarding_completed: true })
            .eq('id', householdId);

          if (updateError) {
            console.error('Error updating household onboarding status:', updateError);
          } else {
            console.log('✅ Household onboarding marked as completed');
          }
        } catch (error) {
          console.error('Error updating household onboarding status:', error);
        }
      }

      console.log('🎉 Family setup complete! Message:', message);
      console.log('📧 Invite count:', inviteCount, 'Failed invites:', failedInvites);
      
      // Navigate immediately to home page
      console.log('🏠 Navigating to homepage...');
      router.replace('/(tabs)?fromOnboarding=true&setupComplete=true');

    } catch (error) {
      console.log('❌ Error in handleContinue:', error);
      setError('An unexpected error occurred');
    } finally {
      console.log('🏁 handleContinue finished, setting loading to false');
      setLoading(false);
    }
  };

  // Validation functions
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'first_name':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        if (value.trim().length > 50) return 'First name must be less than 50 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return undefined;
      
      case 'last_name':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        if (value.trim().length > 50) return 'Last name must be less than 50 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        return undefined;
      
      case 'date_of_birth':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) return 'Please enter a valid date of birth';
        if (age < 13) return 'Must be at least 13 years old';
        return undefined;
      
      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        }
        return undefined;
      
      case 'phone':
        if (value && value.trim()) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) return 'Please enter a valid phone number';
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    setIsValidating(true);
    const errors: typeof validationErrors = {};
    
    // Validate required fields
    const firstNameError = validateField('first_name', newMember.first_name || '');
    if (firstNameError) errors.first_name = firstNameError;
    
    const lastNameError = validateField('last_name', newMember.last_name || '');
    if (lastNameError) errors.last_name = lastNameError;
    
    const dateOfBirthError = validateField('date_of_birth', newMember.date_of_birth || '');
    if (dateOfBirthError) errors.date_of_birth = dateOfBirthError;
    
    // Validate optional fields if they have values
    if (newMember.email) {
      const emailError = validateField('email', newMember.email);
      if (emailError) errors.email = emailError;
    }
    
    if (newMember.phone) {
      const phoneError = validateField('phone', newMember.phone);
      if (phoneError) errors.phone = phoneError;
    }
    
    setValidationErrors(errors);
    setIsValidating(false);
    
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof typeof validationErrors];
      return newErrors;
    });
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'adult', label: 'Adult', description: 'Can manage tasks and events' },
    { value: 'teen', label: 'Teen', description: 'Can view and complete tasks' },
    { value: 'child', label: 'Child', description: 'Limited access, task completion only' },
    { value: 'relative', label: 'Relative', description: 'Extended family member' },
    { value: 'pet', label: 'Pet', description: 'Family pet' },
  ];

  const genderOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const renderAddTab = () => (
    <View>
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={[componentStyles.textLg, componentStyles.fontSemibold, { marginBottom: spacing[4] }]}>
            {phase === 'profile' ? 'Update your profile' : 'Add new member'}
          </Text>
          <Text style={componentStyles.globalLabel}>
            Profile Picture (optional)
          </Text>
          <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { gap: spacing[3] }]}>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                { width: 100, height: 100, borderRadius: 50 },
                { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
                componentStyles.itemsCenter,
                componentStyles.justifyCenter,
                { backgroundColor: colors.neutral[50] }
              ]}
            >
              {(newMember.profile_picture) ? (
                <View style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: 48, 
                  overflow: 'hidden',
                  backgroundColor: colors.neutral[100]
                }}>
                  <Image
                    source={{ uri: newMember.profile_picture }}
                    style={{ 
                      width: 96, 
                      height: 96,
                      resizeMode: 'cover'
                    }}
                    onError={(error) => console.error('Image load error:', error)}
                    onLoad={() => console.log('Profile image loaded successfully')}
                  />
                </View>
              ) : (
                <Text style={[componentStyles.textSecondary, componentStyles.textCenter]}>
                  📷
                </Text>
              )}
            </TouchableOpacity>
            
            {(newMember.profile_picture) && (
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  { backgroundColor: colors.primary[500] },
                  { paddingHorizontal: spacing[3] },
                  { paddingVertical: spacing[2] },
                  { borderRadius: borderRadius.md },
                  componentStyles.itemsCenter,
                  componentStyles.justifyCenter
                ]}
              >
                <Text style={[componentStyles.fontMedium, componentStyles.textInverse, componentStyles.textSm]}>
                  Update image
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <View style={[componentStyles.flexRow, { gap: spacing[3], marginBottom: spacing[3] }]}>
            <View style={componentStyles.flex1}>
              <Text style={componentStyles.globalLabel}>
                First Name *
              </Text>
              <TextInput
                ref={firstNameInputRef}
                style={[
                  componentStyles.inputSimple,
                  { marginLeft: 0 },
                  validationErrors.first_name && { borderColor: colors.error[500] }
                ]}
                value={newMember.first_name || ''}
                onChangeText={(text) => {
                  setNewMember(prev => ({ ...prev, first_name: text }));
                  if (validationErrors.first_name) {
                    clearFieldError('first_name');
                  }
                }}
                placeholder="First name"
                placeholderTextColor={colors.neutral[400]}
                autoFocus={true}
              />
              {validationErrors.first_name && (
                <Text style={[componentStyles.textSm, { color: colors.error[500], marginTop: spacing[1] }]}>
                  {validationErrors.first_name}
                </Text>
              )}
            </View>
            <View style={componentStyles.flex1}>
              <Text style={componentStyles.globalLabel}>
                Last Name *
              </Text>
              <TextInput
                style={[
                  componentStyles.inputSimple,
                  { marginLeft: 0 },
                  validationErrors.last_name && { borderColor: colors.error[500] }
                ]}
                value={newMember.last_name || ''}
                onChangeText={(text) => {
                  setNewMember(prev => ({ ...prev, last_name: text }));
                  if (validationErrors.last_name) {
                    clearFieldError('last_name');
                  }
                }}
                placeholder="Last name"
                placeholderTextColor={colors.neutral[400]}
              />
              {validationErrors.last_name && (
                <Text style={[componentStyles.textSm, { color: colors.error[500], marginTop: spacing[1] }]}>
                  {validationErrors.last_name}
                </Text>
              )}
            </View>
          </View>

          <View>
            <Text style={componentStyles.globalLabel}>
              Nickname (optional)
            </Text>
            <TextInput
              style={[
                componentStyles.inputSimple,
                { marginLeft: 0 }
              ]}
              value={newMember.nickname || ''}
              onChangeText={(text) => setNewMember(prev => ({ ...prev, nickname: text }))}
              placeholder="Nickname"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <View style={{ marginBottom: spacing[3] }}>
            <Text style={componentStyles.globalLabel}>
              Email (optional)
            </Text>
            <TextInput
              style={[
                componentStyles.inputSimple,
                { marginLeft: 0 },
                validationErrors.email && { borderColor: colors.error[500] }
              ]}
              value={newMember.email || ''}
              onChangeText={(text) => {
                setNewMember(prev => ({ ...prev, email: text }));
                if (validationErrors.email) {
                  clearFieldError('email');
                }
              }}
              placeholder="email@example.com"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {validationErrors.email && (
              <Text style={[componentStyles.textSm, { color: colors.error[500], marginTop: spacing[1] }]}>
                {validationErrors.email}
              </Text>
            )}
          </View>

          <View>
            <Text style={componentStyles.globalLabel}>
              Phone Number (optional)
            </Text>
            <TextInput
              style={[
                componentStyles.inputSimple,
                { marginLeft: 0 },
                validationErrors.phone && { borderColor: colors.error[500] }
              ]}
              value={newMember.phone || ''}
              onChangeText={(text) => {
                setNewMember(prev => ({ ...prev, phone: text }));
                if (validationErrors.phone) {
                  clearFieldError('phone');
                }
              }}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="phone-pad"
            />
            {validationErrors.phone && (
              <Text style={[componentStyles.textSm, { color: colors.error[500], marginTop: spacing[1] }]}>
                {validationErrors.phone}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <DateOfBirthPicker
            label="Date of Birth"
            value={newMember.date_of_birth}
            onChange={(date) => {
              setNewMember(prev => ({ ...prev, date_of_birth: date }));
              if (validationErrors.date_of_birth) {
                clearFieldError('date_of_birth');
              }
            }}
            required={true}
            error={validationErrors.date_of_birth}
          />

          <View>
            <Text style={componentStyles.globalLabel}>
              Gender
            </Text>
            <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  onPress={() => setNewMember(prev => ({ ...prev, gender: gender.value as any }))}
                  style={[
                    { paddingHorizontal: spacing[4] },
                    { paddingVertical: spacing[3] },
                    { borderRadius: borderRadius.md },
                    { borderWidth: 1 },
                    { justifyContent: 'center' },
                    newMember.gender === gender.value
                      ? [{ backgroundColor: colors.primary[500] }, { borderColor: colors.primary[500] }]
                      : [{ backgroundColor: colors.neutral[100] }, { borderColor: colors.border }]
                  ]}
                >
                  <Text
                    style={[
                      componentStyles.fontMedium,
                      componentStyles.textSm,
                      newMember.gender === gender.value
                        ? componentStyles.textInverse
                        : componentStyles.textSecondary
                    ]}
                  >
                    {gender.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {phase !== 'profile' && (
          <View style={{ marginBottom: spacing[6] }}>
            <Text style={componentStyles.globalLabel}>
              Role
            </Text>
            <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}> 
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setNewMember(prev => ({ ...prev, role: role.value as any }))}
                  style={[
                    { paddingHorizontal: spacing[4] },
                    { paddingVertical: spacing[3] },
                    { borderRadius: borderRadius.md },
                    { borderWidth: 1 },
                    { justifyContent: 'center' },
                    newMember.role === role.value
                      ? [{ backgroundColor: colors.primary[500] }, { borderColor: colors.primary[500] }]
                      : [{ backgroundColor: colors.neutral[100] }, { borderColor: colors.border }]
                  ]}
                >
                  <Text
                    style={[
                      componentStyles.fontMedium,
                      componentStyles.textSm,
                      newMember.role === role.value
                        ? componentStyles.textInverse
                        : componentStyles.textSecondary
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[componentStyles.textSm, componentStyles.textSecondary, { marginTop: spacing[1] }]}> 
              {roleOptions.find(r => r.value === newMember.role)?.description || ''}
            </Text>
          </View>
        )}

        {successMessage && successMessage.trim() ? (
          <View style={[
            { backgroundColor: colors.success[50] },
            { borderColor: colors.success[200] },
            { borderWidth: 1 },
            { borderRadius: borderRadius.md },
            { padding: spacing[4] },
            { marginTop: spacing[4] }
          ]}>
            <Text style={[
              componentStyles.fontMedium,
              { color: colors.success[700] },
              componentStyles.textCenter
            ]}>
              {successMessage}
            </Text>
          </View>
        ) : null}
      </View>
  );

  const renderListTab = () => (
    <View>
        <Text style={[componentStyles.textLg, componentStyles.fontSemibold, { marginBottom: spacing[4] }]}>
          Family Members ({(familyMembers || []).length})
        </Text>

        {(familyMembers || []).map((member, index) => (
          member && (
          <View
            key={member.id || `member-${index}`}
            style={[
              componentStyles.card,
              { marginBottom: spacing[3] }
            ]}
          >
            <View style={[componentStyles.flexRow, componentStyles.itemsCenter, componentStyles.justifyBetween, { marginBottom: spacing[3] }]}>
              <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { gap: spacing[2] }]}>
                {member.profile_picture ? (
                  <Image
                    source={{ uri: member.profile_picture }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                ) : (
                  <View style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.neutral[200] }, componentStyles.itemsCenter, componentStyles.justifyCenter]}>
                    <Text style={[componentStyles.textSecondary, componentStyles.fontSemibold]}>
                      {(member.first_name || '').charAt(0)}{(member.last_name || '').charAt(0)}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={[componentStyles.fontSemibold, componentStyles.textLg]}>
                    {member.nickname || (member.first_name || member.last_name ? `${member.first_name || ''} ${member.last_name || ''}`.trim() : 'Family Member')}
                  </Text>
                  {member.nickname && (
                    <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                      {member.first_name || member.last_name ? `${member.first_name || ''} ${member.last_name || ''}`.trim() : 'Family Member'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[componentStyles.flexRow, { gap: spacing[2] }]}>
                <TouchableOpacity
                  onPress={() => editFamilyMember(index)}
                  style={[
                    { backgroundColor: colors.primary[500] },
                    { paddingHorizontal: spacing[2] },
                    { paddingVertical: spacing[2] },
                    { borderRadius: borderRadius.md }
                  ]}
                  accessibilityLabel="Edit family member"
                >
                  <IconSymbol name="pencil" size={16} color="white" />
                </TouchableOpacity>
                {member.role !== 'admin' && (
                  <TouchableOpacity
                    onPress={() => removeFamilyMember(index)}
                    style={[
                      { backgroundColor: colors.error[500] },
                      { paddingHorizontal: spacing[2] },
                      { paddingVertical: spacing[2] },
                      { borderRadius: borderRadius.md }
                    ]}
                    accessibilityLabel="Remove family member"
                  >
                    <IconSymbol name="trash" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ gap: spacing[2] }}>
              {member.email && (
                <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                  📧 {member.email}
                </Text>
              )}
              {member.phone && (
                <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                  📞 {member.phone}
                </Text>
              )}
              {member.date_of_birth && (
                <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                  🎂 {new Date(member.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              )}
              <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                👤 {genderOptions.find(g => g.value === member.gender)?.label || 'Not specified'}
              </Text>
              <Text style={[componentStyles.textSecondary, componentStyles.textSm]}>
                🏷️ {roleOptions.find(r => r.value === member.role)?.label || 'Unknown'}
              </Text>
            </View>
          </View>
          )
        ))}

        {(familyMembers || []).length === 0 && (
          <View style={[componentStyles.itemsCenter, { paddingVertical: spacing[8] }]}>
            <Text style={[componentStyles.textSecondary, componentStyles.textLg, componentStyles.textCenter]}>
              No family members added yet
            </Text>
            <Text style={[componentStyles.textSecondary, componentStyles.textCenter, { marginTop: spacing[2] }]}>
              Use the "Add" tab to add your first family member
            </Text>
          </View>
        )}

        {/* Add another family member button below the list */}
        {(familyMembers || []).length > 0 && (
          <View style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
            <TouchableOpacity
              onPress={startAddFamilyMember}
              style={[
                { backgroundColor: colors.primary[500] },
                { padding: spacing[4] },
                { borderRadius: borderRadius.lg },
                componentStyles.itemsCenter
              ]}
            >
              <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions moved to fixed footer (continue button) */}
      </View>
  );

  return (
    <View style={[componentStyles.safeArea, { backgroundColor: colors.neutral[50] }]}>
      {/* Fixed Header - using shared BannerImage */}
      <BannerImage
        imageUrl={householdInfo?.image_url || undefined}
        height={160}
        maxWidth={800}
        radius={borderRadius.md}
        placeholder={(
          <View style={[componentStyles.itemsCenter, { flex: 1, justifyContent: 'center', backgroundColor: colors.background }] }>
            <Text style={[componentStyles.textXl, componentStyles.fontBold, componentStyles.textCenter, { marginBottom: spacing[1] }]}> 
              Welcome to {(householdInfo?.name || (householdName as string) || 'your household') as string}!
            </Text>
            <Text style={[componentStyles.textLg, componentStyles.textSecondary, componentStyles.textCenter]}>
              Let's set up your family members
            </Text>
          </View>
        )}
      />

      {/* Tab Navigation - hidden until members phase */}
      {phase === 'members' && (
      <View style={[componentStyles.flexRow, { 
        marginBottom: spacing[4],
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[200],
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center'
      }]}> 
        <TouchableOpacity
          onPress={() => setActiveTab('list')}
          style={[
            componentStyles.flex1,
            { paddingVertical: spacing[3] },
            { borderBottomWidth: 2 },
            activeTab === 'list' 
              ? { borderBottomColor: colors.primary[500] }
              : { borderBottomColor: colors.neutral[200] }
          ]}
        >
          <Text style={[
            componentStyles.fontSemibold,
            componentStyles.textCenter,
            activeTab === 'list' ? componentStyles.textPrimary : componentStyles.textSecondary
          ]}>
            Family Members ({(familyMembers || []).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('add')}
          style={[
            componentStyles.flex1,
            { paddingVertical: spacing[3] },
            { borderBottomWidth: 2 },
            activeTab === 'add' 
              ? { borderBottomColor: colors.primary[500] }
              : { borderBottomColor: colors.neutral[200] }
          ]}
        >
          <Text style={[
            componentStyles.fontSemibold,
            componentStyles.textCenter,
            activeTab === 'add' ? componentStyles.textPrimary : componentStyles.textSecondary
          ]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>
      )}

      {/* Scrollable Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={componentStyles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <ScrollView
          contentContainerStyle={[
            { 
              paddingHorizontal: spacing[6],
              paddingTop: spacing[4],
              paddingBottom: spacing[20] // Extra padding for fixed buttons
            }
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%', maxWidth: 800, alignSelf: 'center' }}>
            {phase === 'profile' ? renderAddTab() : (activeTab === 'add' ? renderAddTab() : renderListTab())}

            {error && error.trim() ? (
              <View style={{ paddingBottom: spacing[4] }}>
                <Text style={[componentStyles.textError, componentStyles.textCenter]}>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons - show in both phases with appropriate action */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[200],
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        paddingBottom: spacing[6], // Extra padding for safe area
      }}>
        <View style={[componentStyles.flexRow, { gap: spacing[3], width: '100%', maxWidth: 800, alignSelf: 'center' }]}> 
          {phase === 'profile' && (
            <TouchableOpacity
              onPress={savePrimaryProfile}
              disabled={loading}
              style={[
                componentStyles.flex1,
                { backgroundColor: colors.primary[500] },
                { padding: spacing[4] },
                { borderRadius: borderRadius.lg },
                componentStyles.itemsCenter,
                loading && { opacity: 0.5 }
              ]}
            >
              <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>Save & update my profile</Text>
            </TouchableOpacity>
          )}

          {phase === 'members' && activeTab === 'add' && (
            <>
              <TouchableOpacity
                onPress={addFamilyMember}
                disabled={loading}
                style={[
                  componentStyles.flex1,
                  { backgroundColor: colors.primary[500] },
                  { padding: spacing[4] },
                  { borderRadius: borderRadius.lg },
                  componentStyles.itemsCenter,
                  loading && { opacity: 0.5 }
                ]}
              >
                <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
                  {editingIndex !== null ? 'Update family member' : 'Save family member'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('list')}
                style={[
                  componentStyles.flex1,
                  { backgroundColor: colors.neutral[100] },
                  { borderWidth: 1, borderColor: colors.border },
                  { padding: spacing[4] },
                  { borderRadius: borderRadius.lg },
                  componentStyles.itemsCenter
                ]}
              >
                <Text style={[componentStyles.fontSemibold, componentStyles.textPrimary]}>Back to family list</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'members' && activeTab === 'list' && (
            <>
              <TouchableOpacity
                onPress={handleContinue}
                disabled={loading}
                style={[
                  componentStyles.flex1,
                  { backgroundColor: colors.primary[500] },
                  { padding: spacing[4] },
                  { borderRadius: borderRadius.lg },
                  componentStyles.itemsCenter,
                  loading && { opacity: 0.5 }
                ]}
              >
                <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
                  {loading ? 'Setting Up...' : "I've finished adding my family members"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Profile Image Crop Modal */}
      <ImageCropper
        visible={showCropModal}
        imageUri={cropImageUri}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        cropShape="circle"
        cropSize={200}
        title="Crop Profile Picture"
      />
    </View>
  );
} 