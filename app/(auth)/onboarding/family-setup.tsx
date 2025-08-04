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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { componentStyles, colors, spacing, borderRadius, typography } from '../../../styles/global';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import DatePicker from '../../../components/ui/DatePicker';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role: 'admin' | 'adult' | 'teen' | 'child' | 'relative' | 'pet';
  profile_picture?: string;
  is_temp?: boolean;
}

export default function FamilySetup() {
  const { user } = useAuth();
  const { householdId, householdName } = useLocalSearchParams<{ householdId: string; householdName: string }>();
  
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
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
    gender: 'prefer_not_to_say',
    role: 'adult',
    profile_picture: '',
  });

  // Initialize with the current user as the first family member
  useEffect(() => {
    if (user) {
      setFamilyMembers([
        {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: 'admin',
          is_temp: false,
        }
      ]);
    }
  }, [user]);

  // Focus first name input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      firstNameInputRef.current?.focus();
    }, 500); // Small delay to ensure component is fully rendered

    return () => clearTimeout(timer);
  }, []);

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewMember(prev => ({
        ...prev,
        profile_picture: result.assets[0].uri
      }));
    }
  };

  const addFamilyMember = async () => {
    if (!newMember.first_name?.trim() || !newMember.last_name?.trim()) {
      setError('First name and last name are required');
      return;
    }

    const member: FamilyMember = {
      id: editingIndex !== null ? familyMembers[editingIndex].id : `temp_${Date.now()}`,
      first_name: newMember.first_name.trim(),
      last_name: newMember.last_name.trim(),
      nickname: newMember.nickname?.trim() || undefined,
      email: newMember.email?.trim() || undefined,
      phone: newMember.phone?.trim() || undefined,
      date_of_birth: newMember.date_of_birth || undefined,
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
    
    if (member.email && householdId) {
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
    
    // Reset form
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
    
    setError('');
    setSuccessMessage(successMessage);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
    
    // Don't switch tabs, stay on add tab
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

  const handleContinue = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate family members
      const validMembers = familyMembers.filter(member => 
        member.first_name.trim() && member.last_name.trim()
      );

      if (validMembers.length === 0) {
        setError('Please add at least one family member');
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

      Alert.alert(
        'Family Setup Complete!',
        message,
        [
          {
            text: 'Continue to HomeBuddy',
            onPress: () => {
              router.replace('/(tabs)?fromOnboarding=true');
            }
          }
        ]
      );

    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Family Setup',
      'You can always add family members later from the household settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip for Now',
          onPress: () => router.replace('/(tabs)?fromOnboarding=true')
        }
      ]
    );
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
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const renderAddTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ paddingBottom: spacing[6] }}>
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[2] }]}>
            Profile Picture (optional)
          </Text>
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
            {newMember.profile_picture ? (
              <Image
                source={{ uri: newMember.profile_picture }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <Text style={[componentStyles.textSecondary, componentStyles.textCenter]}>
                📷
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <View style={[componentStyles.flexRow, { gap: spacing[3], marginBottom: spacing[3] }]}>
            <View style={componentStyles.flex1}>
              <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
                First Name *
              </Text>
              <TextInput
                ref={firstNameInputRef}
                style={[
                  { borderWidth: 1 },
                  { borderColor: colors.border },
                  { padding: spacing[3] },
                  { borderRadius: borderRadius.md },
                  componentStyles.text
                ]}
                value={newMember.first_name || ''}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, first_name: text }))}
                placeholder="First name"
                autoFocus={true}
              />
            </View>
            <View style={componentStyles.flex1}>
              <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
                Last Name *
              </Text>
              <TextInput
                style={[
                  { borderWidth: 1 },
                  { borderColor: colors.border },
                  { padding: spacing[3] },
                  { borderRadius: borderRadius.md },
                  componentStyles.text
                ]}
                value={newMember.last_name || ''}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, last_name: text }))}
                placeholder="Last name"
              />
            </View>
          </View>

          <View>
            <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
              Nickname (optional)
            </Text>
            <TextInput
              style={[
                { borderWidth: 1 },
                { borderColor: colors.border },
                { padding: spacing[3] },
                { borderRadius: borderRadius.md },
                componentStyles.text
              ]}
              value={newMember.nickname || ''}
              onChangeText={(text) => setNewMember(prev => ({ ...prev, nickname: text }))}
              placeholder="Nickname"
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <Text style={[componentStyles.fontSemibold, componentStyles.textLg, { marginBottom: spacing[3] }]}>
            Contact Information
          </Text>
          
          <View style={{ marginBottom: spacing[3] }}>
            <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
              Email (optional)
            </Text>
            <TextInput
              style={[
                { borderWidth: 1 },
                { borderColor: colors.border },
                { padding: spacing[3] },
                { borderRadius: borderRadius.md },
                componentStyles.text
              ]}
              value={newMember.email || ''}
              onChangeText={(text) => setNewMember(prev => ({ ...prev, email: text }))}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
              Phone Number (optional)
            </Text>
            <TextInput
              style={[
                { borderWidth: 1 },
                { borderColor: colors.border },
                { padding: spacing[3] },
                { borderRadius: borderRadius.md },
                componentStyles.text
              ]}
              value={newMember.phone || ''}
              onChangeText={(text) => setNewMember(prev => ({ ...prev, phone: text }))}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing[4] }}>
          <Text style={[componentStyles.fontSemibold, componentStyles.textLg, { marginBottom: spacing[3] }]}>
            Personal Information
          </Text>
          
          <DatePicker
            label="Date of Birth (optional)"
            value={newMember.date_of_birth}
            onChange={(date) => setNewMember(prev => ({ ...prev, date_of_birth: date }))}
            placeholder="Select date of birth"
          />

          <View>
            <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[2] }]}>
              Gender
            </Text>
            <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  onPress={() => setNewMember(prev => ({ ...prev, gender: gender.value as any }))}
                  style={[
                    { paddingHorizontal: spacing[3] },
                    { paddingVertical: spacing[2] },
                    { borderRadius: borderRadius.md },
                    { borderWidth: 1 },
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

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={[componentStyles.fontSemibold, componentStyles.textLg, { marginBottom: spacing[3] }]}>
            Role
          </Text>
          <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}>
            {roleOptions.map((role) => (
              <TouchableOpacity
                key={role.value}
                onPress={() => setNewMember(prev => ({ ...prev, role: role.value as any }))}
                style={[
                  { paddingHorizontal: spacing[3] },
                  { paddingVertical: spacing[2] },
                  { borderRadius: borderRadius.md },
                  { borderWidth: 1 },
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

        <TouchableOpacity
          onPress={addFamilyMember}
          style={[
            { backgroundColor: colors.primary[500] },
            { padding: spacing[4] },
            { borderRadius: borderRadius.lg },
            componentStyles.itemsCenter
          ]}
        >
          <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
            {editingIndex !== null ? 'Update Family Member' : 'Add Family Member'}
          </Text>
        </TouchableOpacity>

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
    </ScrollView>
  );

  const renderListTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ paddingBottom: spacing[6] }}>
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
      </View>
    </ScrollView>
  );

  return (
    <View style={componentStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={componentStyles.flex1}
      >
        <View style={[
          componentStyles.flex1,
          { 
            maxWidth: 700, 
            width: '100%', 
            alignSelf: 'center',
            paddingHorizontal: 30
          }
        ]}>
          <View style={[componentStyles.itemsCenter, { paddingTop: spacing[10], paddingBottom: spacing[6] }]}>
            <Text style={[componentStyles.textXl, componentStyles.fontBold, componentStyles.textCenter, { marginBottom: spacing[2] }]}>
              Welcome to {householdName && householdName.trim() ? householdName : 'your household'}!
            </Text>
            <Text style={[componentStyles.textLg, componentStyles.textSecondary, componentStyles.textCenter]}>
              Let's set up your family members
            </Text>
          </View>

          <View style={[componentStyles.flexRow, { marginBottom: spacing[4] }]}>
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
          </View>

          <View style={componentStyles.flex1}>
            {activeTab === 'add' ? renderAddTab() : renderListTab()}
          </View>

          {error && error.trim() ? (
            <View style={{ paddingBottom: spacing[4] }}>
              <Text style={[componentStyles.textError, componentStyles.textCenter]}>
                {error}
              </Text>
            </View>
          ) : null}

          <View style={[componentStyles.flexRow, { gap: spacing[3], paddingBottom: spacing[6] }]}>
            <TouchableOpacity
              onPress={handleSkip}
              style={[
                componentStyles.flex1,
                { backgroundColor: colors.neutral[200] },
                { padding: spacing[4] },
                { borderRadius: borderRadius.lg },
                componentStyles.itemsCenter
              ]}
            >
              <Text style={[componentStyles.fontSemibold, componentStyles.textSecondary]}>
                Skip for Now
              </Text>
            </TouchableOpacity>
            
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
                {loading ? 'Setting Up...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
} 