import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';
import { useAuth } from '../../contexts/AuthContext';
import { trackScreen } from '../../lib/posthog';
import { supabase } from '../../lib/supabase';
import { globalSignOut } from '../../lib/auth-utils';
import { ImageCropper } from '../../components/ui/ImageCropper';
import { GlobalHeader } from '../../components/ui';
import BottomNavigation from '../../components/ui/BottomNavigation';
import AuthGuard from '../../components/auth/AuthGuard';
import * as ImagePicker from 'expo-image-picker';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [userHousehold, setUserHousehold] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userHouseholds, setUserHouseholds] = React.useState<Array<{ role: string; household: any }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [showDeleteHouseholdModal, setShowDeleteHouseholdModal] = React.useState(false);
  const [deleteHouseholdPassword, setDeleteHouseholdPassword] = React.useState('');
  const [deleteHouseholdLoading, setDeleteHouseholdLoading] = React.useState(false);
  const [deleteAllMembers, setDeleteAllMembers] = React.useState(false);

  
  // Profile picture state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [cropImageUri, setCropImageUri] = React.useState<string | null>(null);
  


  React.useEffect(() => {
    trackScreen('Settings Screen');
  }, [user]);

  // Get user's households and roles
  React.useEffect(() => {
    const getUserHouseholds = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get all household memberships for this user
        const { data: memberships, error } = await supabase
          .from('household_members')
          .select(`
            role,
            household:households (
              id,
              name,
              household_type,
              created_by,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: true });

        if (error) {
          console.error('Error fetching households:', error);
        }

        const safeMemberships = Array.isArray(memberships) ? memberships : (memberships ? [memberships] : []);
        setUserHouseholds(safeMemberships as Array<{ role: string; household: any }>);

        // Maintain existing single-household dependent features by selecting the first membership, if any
        if (safeMemberships.length > 0) {
          setUserHousehold(safeMemberships[0].household);
          setUserRole(safeMemberships[0].role);
        }
      } catch (error) {
        console.error('Error getting user household:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserHouseholds();
  }, [user]);

  const handleSignOut = async () => {
    try {
      // Show loading state
      console.log('Signing out...');
      
      // Use context signOut to ensure app state clears
      await signOut();
      
      console.log('Sign out successful, redirecting to login...');
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Even if there's an error, try to redirect to login
      console.log('Redirecting to login despite error...');
      router.replace('/(auth)/login');
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone and will permanently delete all your data including:\n\n• Your account\n• Your household memberships\n• All your tasks and events\n• Your profile information\n\nThis action is irreversible.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Profile',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) {
                Alert.alert('Error', 'User not found');
                return;
              }

              // Delete user profile from our database first
              const { error: profileError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

              if (profileError) {
                console.error('Error deleting user profile:', profileError);
                Alert.alert(
                  'Error',
                  'Failed to delete profile. Please try again.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Note: Auth user deletion requires admin privileges
              // The user will need to contact support to completely delete their auth account
              // For now, we'll just delete their profile data and sign them out

              // Sign out the user
              await signOut();
              router.replace('/(auth)/login');
              
              Alert.alert(
                'Profile Deleted',
                'Your profile data has been successfully deleted. You have been signed out. To completely delete your account, please contact support.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Delete profile error:', error);
              Alert.alert(
                'Error',
                'An error occurred while deleting your profile. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = async () => {
    if (!userHousehold) {
      Alert.alert('Error', 'No household found');
      return;
    }

    // Show the custom modal instead of Alert
    setShowDeleteHouseholdModal(true);
  };

  const confirmDeleteHousehold = async () => {
    if (!deleteHouseholdPassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm');
      return;
    }

    setDeleteHouseholdLoading(true);

    try {
      if (!user || !userHousehold) {
        Alert.alert('Error', 'User or household not found');
        return;
      }

      // Check if user is admin of this household
      if (userRole !== 'admin') {
        Alert.alert('Error', 'Only household admins can delete the household');
        return;
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: deleteHouseholdPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        setDeleteHouseholdPassword('');
        setDeleteHouseholdLoading(false);
        return;
      }

      // Always delete household members first to avoid FK constraint issues
      const { error: membersError } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', userHousehold.id);

      if (membersError) {
        console.error('Error deleting household members:', membersError);
        Alert.alert(
          'Error',
          'Failed to delete household members. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Delete the household and ensure at least one row was deleted
      const { data: deletedRows, error: householdError } = await supabase
        .from('households')
        .delete()
        .eq('id', userHousehold.id)
        .select('id');

      if (householdError || !deletedRows || deletedRows.length === 0) {
        console.error('Error deleting household or no row deleted:', householdError);
        Alert.alert(
          'Error',
          'Failed to delete household. Please ensure you are the household admin and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Close modal and redirect
      setShowDeleteHouseholdModal(false);
      setDeleteHouseholdPassword('');
      setDeleteHouseholdLoading(false);
      setDeleteAllMembers(false);
      
      // Redirect to household choice page since user no longer has a household
      router.replace('/(auth)/onboarding/household-choice');
      
      const message = deleteAllMembers 
        ? `The household "${userHousehold.name || 'your household'}" and all its members have been successfully deleted.`
        : `The household "${userHousehold.name || 'your household'}" has been successfully deleted.`;
      
      Alert.alert(
        'Household Deleted',
        message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Delete household error:', error);
      Alert.alert(
        'Error',
        'An error occurred while deleting the household. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDeleteHouseholdLoading(false);
    }
  };

  const cancelDeleteHousehold = () => {
    setShowDeleteHouseholdModal(false);
    setDeleteHouseholdPassword('');
    setDeleteHouseholdLoading(false);
  };

  // Profile picture functions
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
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
      
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





  // All settings items in one list
  const settingsItems: SettingsItem[] = [
    {
      id: 'household-settings',
      title: 'Household Settings',
      subtitle: 'Manage your household and family members',
      icon: 'home',
      onPress: () => {
        router.push('/settings/household');
      },
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Update your personal information',
      icon: 'person',
      onPress: () => {
        router.push('/settings/profile');
      },
    },
    {
      id: 'create-household',
      title: 'Create New Household',
      subtitle: 'Start a new household',
      icon: 'add-circle',
      onPress: () => {
        router.push('/(auth)/onboarding/household-choice');
      },
      color: colors.primary[500],
    },
    // Map each membership to a row
    ...userHouseholds.map((m) => ({
      id: `household-${m.household?.id}`,
      title: m.household?.name || 'Untitled Household',
      subtitle: `Role: ${m.role || 'member'}`,
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        Alert.alert('Household Info', `${m.household?.name || 'Household'}\nType: ${m.household?.household_type || 'n/a'}\nRole: ${m.role}`);
      },
    } as SettingsItem)),
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: 'notifications',
      onPress: () => {
        Alert.alert('Coming Soon', 'Notification settings will be available soon!');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      onPress: () => {
        Alert.alert('Coming Soon', 'Help & support will be available soon!');
      },
    },
    {
      id: 'about',
      title: 'About HomeBuddy',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle',
      onPress: () => {
        Alert.alert(
          'About HomeBuddy',
          'HomeBuddy v1.0.0\n\nYour family\'s home management companion.\n\nMade with ❤️ for families everywhere.',
          [{ text: 'OK' }]
        );
      },
    },
    {
      id: 'signout',
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      onPress: () => {
        if (Platform.OS === 'web') {
          const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true;
          if (confirmed) handleSignOut();
        } else {
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
            ]
          );
        }
      },
      color: colors.error[500],
    },
    {
      id: 'delete-profile',
      title: 'Delete Profile',
      subtitle: 'Permanently delete your account and all data',
      icon: 'trash',
      onPress: handleDeleteProfile,
      color: colors.error[600],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.onPress}
      style={[
        componentStyles.flexRow,
        componentStyles.itemsCenter,
        componentStyles.justifyBetween,
        { 
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[6],
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral[200],
          backgroundColor: colors.background,
        }
      ]}
    >
      <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { flex: 1 }]}>
        <View style={[
          { 
            width: spacing[10], 
            height: spacing[10], 
            borderRadius: spacing[5],
            backgroundColor: item.color || colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing[4]
          }
        ]}>
          <Ionicons 
            name={item.icon} 
            size={spacing[5]} 
            color={item.color || colors.primary[500]} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
            componentStyles.textLg,
            componentStyles.fontSemibold,
            { color: item.color || colors.text.primary, marginBottom: spacing[1] }
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[componentStyles.textSm, componentStyles.textSecondary]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={spacing[5]} 
        color={colors.neutral[400]} 
      />
    </TouchableOpacity>
  );

  // Show loading screen while fetching user household data
  if (loading) {
    return (
      <View style={[componentStyles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <AuthGuard>
      <View style={componentStyles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Global Header */}
          <GlobalHeader 
            title="Settings"
            showBackButton={false}
            showHelp={true}
          />

          {/* Settings Items */}
          <View style={{ marginBottom: spacing[6] }}>
            {settingsItems.map(renderSettingsItem)}
          </View>

          {/* User Info */}
          <View style={[
            componentStyles.itemsCenter,
            { 
              paddingHorizontal: spacing[6], 
              paddingBottom: spacing[8] 
            }
          ]}>
            <Text style={[componentStyles.textSm, componentStyles.textSecondary]}>
              Signed in as
            </Text>
            <Text style={[
              componentStyles.text, 
              componentStyles.fontMedium, 
              componentStyles.textPrimary
            ]}>
              {user?.email || ''}
            </Text>
          </View>
        </ScrollView>

      {/* Delete Household Confirmation Modal */}
      {showDeleteHouseholdModal && (
        <View style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: spacing[4],
            padding: spacing[6],
            margin: spacing[6],
            maxWidth: 400,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            {/* Header */}
            <View style={[componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
              <View style={{
                width: spacing[12],
                height: spacing[12],
                borderRadius: spacing[6],
                backgroundColor: colors.error[100],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing[4],
              }}>
                <Ionicons name="warning" size={spacing[6]} color={colors.error[500]} />
              </View>
              <Text style={[
                componentStyles.textXl,
                componentStyles.fontBold,
                { color: colors.error[600], marginBottom: spacing[2] }
              ]}>
                Delete Household
              </Text>
              <Text style={[
                componentStyles.textLg,
                componentStyles.textSecondary,
                { textAlign: 'center' }
              ]}>
                This action cannot be undone
              </Text>
            </View>

            {/* Warning Message */}
            <View style={{
              backgroundColor: colors.error[50],
              borderLeftWidth: 4,
              borderLeftColor: colors.error[500],
              padding: spacing[4],
              marginBottom: spacing[6],
            }}>
              <Text style={[
                componentStyles.textLg,
                componentStyles.fontMedium,
                { color: colors.error[700], marginBottom: spacing[2] }
              ]}>
                ⚠️ Warning: This will permanently delete:
              </Text>
              <Text style={[componentStyles.textSm, { color: colors.error[600] }]}>
                • The entire household "{userHousehold?.name || 'your household'}"{'\n'}
                • All household members{'\n'}
                • All tasks and events{'\n'}
                • All household data{'\n'}
                • This action is irreversible
              </Text>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: spacing[6] }}>
              <Text style={[
                componentStyles.textLg,
                componentStyles.fontMedium,
                { color: colors.text.primary, marginBottom: spacing[2] }
              ]}>
                Enter your password to confirm:
              </Text>
              <TextInput
                style={[
                  componentStyles.inputSimple,
                  { borderColor: colors.neutral[300] }
                ]}
                placeholder="Enter your password"
                value={deleteHouseholdPassword}
                onChangeText={setDeleteHouseholdPassword}
                secureTextEntry={true}
                autoFocus={true}
                editable={!deleteHouseholdLoading}
              />
            </View>

            {/* Buttons */}
            <View style={[componentStyles.flexRow, { gap: spacing[3] }]}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: spacing[3],
                  borderRadius: spacing[2],
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  backgroundColor: colors.background,
                }}
                onPress={cancelDeleteHousehold}
                disabled={deleteHouseholdLoading}
              >
                <Text style={[
                  componentStyles.textLg,
                  componentStyles.fontMedium,
                  { color: colors.text.primary, textAlign: 'center' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: spacing[3],
                  borderRadius: spacing[2],
                  backgroundColor: colors.error[500],
                }}
                onPress={confirmDeleteHousehold}
                disabled={deleteHouseholdLoading || !deleteHouseholdPassword.trim()}
              >
                <Text style={[
                  componentStyles.textLg,
                  componentStyles.fontMedium,
                  { color: 'white', textAlign: 'center' }
                ]}>
                  {deleteHouseholdLoading ? 'Deleting...' : 'Delete Household'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
    </AuthGuard>
  );
}
