import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { componentStyles, colors, spacing } from '../../styles/global';
import { useAuth } from '../../contexts/AuthContext';
import { trackScreen } from '@/lib/posthog';
import { supabase } from '../../lib/supabase';

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
  const [loading, setLoading] = React.useState(true);
  const [showDeleteHouseholdModal, setShowDeleteHouseholdModal] = React.useState(false);
  const [deleteHouseholdPassword, setDeleteHouseholdPassword] = React.useState('');
  const [deleteHouseholdLoading, setDeleteHouseholdLoading] = React.useState(false);
  const [deleteAllMembers, setDeleteAllMembers] = React.useState(false);

  React.useEffect(() => {
    trackScreen('Settings Screen');
  }, [user]);

  // Get user's household and role
  React.useEffect(() => {
    const getUserHousehold = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's household membership
        const { data: membership, error } = await supabase
          .from('household_members')
          .select(`
            role,
            household:households (
              id,
              name,
              household_type,
              created_by
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching household:', error);
        }

        if (membership) {
          setUserHousehold(membership.household);
          setUserRole(membership.role);
        }
      } catch (error) {
        console.error('Error getting user household:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserHousehold();
  }, [user]);

  const handleSignOut = async () => {
    // For web, we'll skip the confirmation dialog and sign out directly
    // since Alert.alert doesn't work well on web
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Sign Out Error',
        'There was an error signing out. Please try again.',
        [{ text: 'OK' }]
      );
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

      // If user wants to delete all members, do that first
      if (deleteAllMembers) {
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
      }

      // Delete the household (this will cascade delete all related data)
      const { error: householdError } = await supabase
        .from('households')
        .delete()
        .eq('id', userHousehold.id);

      if (householdError) {
        console.error('Error deleting household:', householdError);
        Alert.alert(
          'Error',
          'Failed to delete household. Please try again.',
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
        ? `The household "${userHousehold.name}" and all its members have been successfully deleted.`
        : `The household "${userHousehold.name}" has been successfully deleted.`;
      
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

  const settingsItems: SettingsItem[] = [
    {
      id: 'household',
      title: 'Household Settings',
      subtitle: 'Manage your household and family members',
      icon: 'people',
      onPress: () => {
        Alert.alert('Coming Soon', 'Household settings will be available soon!');
      },
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Update your personal information',
      icon: 'person',
      onPress: () => {
        Alert.alert('Coming Soon', 'Profile settings will be available soon!');
      },
    },
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
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: 'shield-checkmark',
      onPress: () => {
        Alert.alert('Coming Soon', 'Privacy settings will be available soon!');
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
    // Only show delete household option for admins
    ...(userRole === 'admin' && userHousehold ? [{
      id: 'delete-household',
      title: 'Delete Household',
      subtitle: `Delete "${userHousehold.name}" and all its data`,
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      onPress: handleDeleteHousehold,
      color: colors.error[700],
    }] : []),
    {
      id: 'signout',
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      onPress: handleSignOut,
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
    <View style={componentStyles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[
          componentStyles.itemsCenter,
          { 
            paddingTop: spacing[8], 
            paddingBottom: spacing[6], 
            paddingHorizontal: spacing[6] 
          }
        ]}>
          <View style={[
            componentStyles.roundedFull,
            { 
              backgroundColor: colors.primary[100], 
              width: spacing[16], 
              height: spacing[16], 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: spacing[4]
            }
          ]}>
            <Ionicons name="settings" size={spacing[8]} color={colors.primary[500]} />
          </View>
          
          <Text style={[
            componentStyles.textXl, 
            componentStyles.fontBold, 
            componentStyles.textPrimary, 
            { marginBottom: spacing[2] }
          ]}>
            Settings
          </Text>
          
          <Text style={[
            componentStyles.textLg, 
            componentStyles.textSecondary, 
            { textAlign: 'center' }
          ]}>
            Manage your HomeBuddy preferences
          </Text>
        </View>

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
            {user?.email}
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
                • The entire household "{userHousehold?.name}"{'\n'}
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
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  borderRadius: spacing[2],
                  padding: spacing[3],
                  fontSize: 16,
                  backgroundColor: colors.background,
                }}
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
    </View>
  );
}
