import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { componentStyles, colors, spacing } from '../../styles/global';
import FamilyMemberForm from '../../components/forms/FamilyMemberForm';
import { GlobalHeader } from '../../components/ui';
import BottomNavigation from '../../components/ui/BottomNavigation';
import AuthGuard from '../../components/auth/AuthGuard';

interface ProfileForm {
  first_name: string;
  last_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profile_picture?: string;
}

export default function ProfileSettings() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form with user data
  const [initialData, setInitialData] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    profile_picture: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setFetchingProfile(false);
        return;
      }

      setFetchingProfile(true);
      try {
        // Fetch user profile from the users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        }

        // Combine data from auth metadata and users table
        const profileData = {
          first_name: userProfile?.first_name || user.user_metadata?.first_name || '',
          last_name: userProfile?.last_name || user.user_metadata?.last_name || '',
          nickname: userProfile?.nickname || user.user_metadata?.nickname || '',
          email: user.email || '',
          phone: userProfile?.phone || user.user_metadata?.phone || '',
          date_of_birth: userProfile?.date_of_birth || user.user_metadata?.date_of_birth || '',
          gender: userProfile?.gender || user.user_metadata?.gender || 'prefer_not_to_say',
          profile_picture: (userProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.profile_picture || '').startsWith('blob:') ? '' : (userProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.profile_picture || ''),
        };
        

        

        setInitialData(profileData);
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        // Fallback to auth metadata only
        setInitialData({
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          nickname: user.user_metadata?.nickname || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          date_of_birth: user.user_metadata?.date_of_birth || '',
          gender: user.user_metadata?.gender || 'prefer_not_to_say',
          profile_picture: (user.user_metadata?.avatar_url || user.user_metadata?.profile_picture || '').startsWith('blob:') ? '' : (user.user_metadata?.avatar_url || user.user_metadata?.profile_picture || ''),
        });
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleUpdateProfile = async (formData: ProfileForm) => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          avatar_url: formData.profile_picture,
          profile_picture: formData.profile_picture,
        }
      });

      if (authError) {
        throw authError;
      }

      // Update user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          avatar_url: formData.profile_picture,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      setSuccessMessage('Profile updated successfully!');
      
      // Show success message briefly
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      
      // Show error message briefly
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = async (imageUri: string) => {
    if (!user) return;

    try {
      // Immediately update the user's avatar in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: imageUri,
          profile_picture: imageUri,
        }
      });

      if (authError) {
        console.error('Error updating avatar:', authError);
        setError('Failed to update profile picture. Please try again.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Also update the users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          avatar_url: imageUri,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating avatar in users table:', profileError);
      }

      
      
      // Update the local state to reflect the change
      setInitialData(prev => ({
        ...prev,
        profile_picture: imageUri,
      }));

    } catch (error) {
      console.error('Error in handleImageUpdate:', error);
      setError('Failed to update profile picture. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBack = () => {
    router.push('/settings');
  };

  return (
    <AuthGuard>
      <View style={componentStyles.safeArea}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingBottom: spacing[20], // Add extra padding for bottom navigation
              minHeight: '100%'
            }}
          >
            {/* Global Header */}
            <GlobalHeader 
              title="Profile Settings"
              showBackButton={true}
              showHelp={true}
              onBackPress={handleBack}
            />

            {/* Success/Error Messages */}
            {successMessage && (
              <View style={[
                { backgroundColor: colors.success[50] },
                { borderColor: colors.success[200] },
                { borderWidth: 1 },
                { borderRadius: spacing[2] },
                { padding: spacing[4] },
                { marginHorizontal: spacing[6] },
                { marginBottom: spacing[4] }
              ]}>
                <Text style={[
                  componentStyles.fontMedium,
                  { color: colors.success[700] },
                  componentStyles.textCenter
                ]}>
                  {successMessage}
                </Text>
              </View>
            )}

            {error && (
              <View style={[
                { backgroundColor: colors.error[50] },
                { borderColor: colors.error[200] },
                { borderWidth: 1 },
                { borderRadius: spacing[2] },
                { padding: spacing[4] },
                { marginHorizontal: spacing[6] },
                { marginBottom: spacing[4] }
              ]}>
                <Text style={[
                  componentStyles.fontMedium,
                  { color: colors.error[700] },
                  componentStyles.textCenter
                ]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={{ 
              paddingHorizontal: spacing[6],
              paddingBottom: spacing[8] // Add extra padding at bottom of form
            }}>
              {fetchingProfile ? (
                <View style={[
                  componentStyles.itemsCenter,
                  componentStyles.justifyCenter,
                  { paddingVertical: spacing[12] }
                ]}>
                  <Text style={[
                    componentStyles.textLg,
                    componentStyles.textSecondary,
                    componentStyles.textCenter
                  ]}>
                    Loading profile...
                  </Text>
                </View>
              ) : (
                <FamilyMemberForm
                  initialData={initialData}
                  onSubmit={handleUpdateProfile}
                  submitButtonText="Update Profile"
                  loading={loading}
                  showRole={false} // Don't show role for profile settings
                  showEmail={true}
                  showPhone={true}
                  onImageUpdate={handleImageUpdate}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </View>
    </AuthGuard>
  );
}
