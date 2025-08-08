import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';
import { ImageCropper } from '../../components/ui/ImageCropper';
import { GlobalHeader } from '../../components/ui';
import BottomNavigation from '../../components/ui/BottomNavigation';
import AuthGuard from '../../components/auth/AuthGuard';

export default function HouseholdSettings() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userHousehold, setUserHousehold] = useState<any>(null);
  
  // Household form state
  const [householdName, setHouseholdName] = useState('');
  const [householdType, setHouseholdType] = useState<'family' | 'flat' | 'other'>('family');
  const [householdImage, setHouseholdImage] = useState<string | null>(null);
  const [showHouseholdCropModal, setShowHouseholdCropModal] = useState(false);
  const [householdCropImageUri, setHouseholdCropImageUri] = useState<string | null>(null);
  
  // Delete household state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch current household data
  useEffect(() => {
    const fetchHousehold = async () => {
      if (!user) return;

      try {
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
          console.error('Error fetching household:', error);
        } else if (memberships && memberships.length > 0) {
          const household = memberships[0].household as any;
          setUserHousehold(household);
          setHouseholdName(household.name || '');
          setHouseholdType(household.household_type || 'family');
          setHouseholdImage(household.image_url || null);
        }
      } catch (error) {
        console.error('Error fetching household:', error);
      }
    };

    fetchHousehold();
  }, [user]);

  const pickHouseholdImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setHouseholdCropImageUri(result.assets[0].uri);
      setShowHouseholdCropModal(true);
    }
  };

  const handleHouseholdCropComplete = async (croppedImageUri: string) => {
    setHouseholdImage(croppedImageUri);
    setShowHouseholdCropModal(false);
    setHouseholdCropImageUri(null);
  };

  const handleHouseholdCropCancel = () => {
    setShowHouseholdCropModal(false);
    setHouseholdCropImageUri(null);
  };

  const handleUpdateHousehold = async () => {
    if (!user || !userHousehold) {
      Alert.alert('Error', 'No household found to update');
      return;
    }

    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('households')
        .update({
          name: householdName.trim(),
          household_type: householdType,
          image_url: householdImage,
        })
        .eq('id', userHousehold.id);

      if (error) {
        throw error;
      }

      setSuccessMessage('Household updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating household:', error);
      setError(error.message || 'Failed to update household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteHousehold = async () => {
    if (!user || !userHousehold) {
      Alert.alert('Error', 'No household found to delete');
      return;
    }

    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    try {
      // First verify the user's password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: deletePassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        return;
      }

      // Delete all household members first
      const { error: membersError } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', userHousehold.id);

      if (membersError) {
        console.error('Error deleting household members:', membersError);
        Alert.alert('Error', 'Failed to delete household members. Please try again.');
        return;
      }

      // Then delete the household (request returning rows to confirm success)
      const { data: deletedRows, error: householdError } = await supabase
        .from('households')
        .delete()
        .eq('id', userHousehold.id)
        .select('id');

      if (householdError || !deletedRows || deletedRows.length === 0) {
        console.error('Error deleting household or no rows affected:', householdError);
        Alert.alert('Error', 'Failed to delete household. Please ensure you are the household admin and try again.');
        return;
      }

      // Cleanup modals/state then redirect immediately
      setShowDeleteModal(false);
      setShowPasswordModal(false);
      setDeletePassword('');
      router.replace('/(auth)/onboarding/household-choice');
    } catch (error: any) {
      console.error('Error deleting household:', error);
      Alert.alert('Error', 'Failed to delete household. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  const confirmDeleteHousehold = () => {
    console.log('Delete button clicked!');
    // Show the confirmation modal
    setShowDeleteModal(true);
  };

  const proceedToPasswordModal = () => {
    setShowDeleteModal(false);
    setShowPasswordModal(true);
  };

  const cancelDeleteHousehold = () => {
    setShowDeleteModal(false);
    setShowPasswordModal(false);
    setDeletePassword('');
  };

  return (
    <AuthGuard>
      <View style={componentStyles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Global Header */}
          <GlobalHeader 
            title="Household Settings"
            showBackButton={true}
            showHelp={true}
            onBackPress={handleBack}
          />

        {/* Success/Error Messages */}
        {successMessage ? (
          <View style={{
            backgroundColor: colors.success[50],
            borderWidth: 1,
            borderColor: colors.success[200],
            padding: spacing[4],
            margin: spacing[6],
            borderRadius: borderRadius.md,
          }}>
            <Text style={[
              componentStyles.text,
              componentStyles.fontMedium,
              { color: colors.success[700] }
            ]}>
              {successMessage}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={{
            backgroundColor: colors.error[50],
            borderWidth: 1,
            borderColor: colors.error[200],
            padding: spacing[4],
            margin: spacing[6],
            borderRadius: borderRadius.md,
          }}>
            <Text style={[
              componentStyles.text,
              componentStyles.fontMedium,
              { color: colors.error[700] }
            ]}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={{ paddingHorizontal: spacing[6], paddingVertical: spacing[6] }}>
          {/* Household Name */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[
              componentStyles.textSm,
              componentStyles.fontMedium,
              componentStyles.textSecondary,
              { marginBottom: spacing[2] }
            ]}>
              Household Name
            </Text>
            <View style={[componentStyles.inputContainer, componentStyles.flexRow, componentStyles.itemsCenter]}>
              <Ionicons name="home-outline" size={spacing[5]} color={colors.neutral[500]} />
              <TextInput
                style={[componentStyles.flex1, { marginLeft: spacing[3] }]}
                placeholder="Enter household name"
                placeholderTextColor={colors.neutral[400]}
                value={householdName}
                onChangeText={setHouseholdName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Household Type */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={[
              componentStyles.textSm,
              componentStyles.fontMedium,
              componentStyles.textSecondary,
              { marginBottom: spacing[2] }
            ]}>
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

          {/* Household Image */}
          <View style={{ marginBottom: spacing[6] }}>
            <Text style={[
              componentStyles.textSm,
              componentStyles.fontMedium,
              componentStyles.textSecondary,
              { marginBottom: spacing[2] }
            ]}>
              Household Image
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
              onPress={pickHouseholdImage}
            >
              {householdImage ? (
                <Image
                  source={{ uri: householdImage }}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="camera" size={spacing[6]} color={colors.neutral[400]} />
                  <Text style={[
                    componentStyles.textSm,
                    componentStyles.textSecondary,
                    { marginTop: spacing[2] }
                  ]}>
                    Tap to add photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            onPress={handleUpdateHousehold}
            disabled={loading}
            style={[
              componentStyles.button,
              componentStyles.buttonPrimary,
              { marginTop: spacing[4] },
              loading && { opacity: 0.6 }
            ]}
          >
            <Text style={[
              componentStyles.buttonText,
              componentStyles.buttonTextPrimary
            ]}>
              {loading ? 'Updating...' : 'Update Household'}
            </Text>
          </TouchableOpacity>



          {/* Delete Household Button */}
          <TouchableOpacity
            onPress={() => {
              console.log('Delete button pressed!');
              confirmDeleteHousehold();
            }}
            style={[
              componentStyles.button,
              {
                marginTop: spacing[6],
                marginBottom: spacing[6],
                backgroundColor: colors.error[500],
                borderColor: colors.error[500],
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[6],
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
              }
            ]}
          >
            <View style={[componentStyles.flexRow, componentStyles.itemsCenter, { justifyContent: 'center' }]}>
              <Ionicons name="trash-outline" size={20} color={colors.text.inverse} style={{ marginRight: spacing[2] }} />
              <Text style={[
                componentStyles.buttonText,
                { color: colors.text.inverse, fontSize: 16, fontWeight: '600' }
              ]}>
                Delete Household
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Household Image Crop Modal */}
      <ImageCropper
        visible={showHouseholdCropModal}
        imageUri={householdCropImageUri}
        onCropComplete={handleHouseholdCropComplete}
        onCancel={handleHouseholdCropCancel}
        cropShape="square"
        cropSize={400}
        title="Crop Household Image"
      />

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Delete Household Modal */}
      {showDeleteModal && (
        <View style={{
          position: 'absolute',
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
            borderRadius: borderRadius.lg,
            padding: spacing[6],
            margin: spacing[6],
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={[
              componentStyles.textXl,
              componentStyles.fontBold,
              componentStyles.textPrimary,
              { marginBottom: spacing[4], textAlign: 'center' }
            ]}>
              Delete Household
            </Text>
            
            <Text style={[
              componentStyles.text,
              componentStyles.textSecondary,
              { marginBottom: spacing[6], textAlign: 'center' }
            ]}>
              Please enter your password to confirm the deletion of this household. This action cannot be undone.
            </Text>

            <View style={{ marginBottom: spacing[6] }}>
              <Text style={[
                componentStyles.textSm,
                componentStyles.fontMedium,
                componentStyles.textSecondary,
                { marginBottom: spacing[2] }
              ]}>
                Password
              </Text>
              <TextInput
                style={[componentStyles.inputSimple]}
                placeholder="Enter your password"
                placeholderTextColor={colors.neutral[400]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[componentStyles.flexRow, { justifyContent: 'space-between' }]}>
              <TouchableOpacity
                onPress={cancelDeleteHousehold}
                style={[
                  componentStyles.button,
                  {
                    flex: 1,
                    backgroundColor: colors.neutral[200],
                    borderColor: colors.neutral[300],
                    marginRight: spacing[2],
                  }
                ]}
              >
                <Text style={[
                  componentStyles.buttonText,
                  { color: colors.text.primary }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteHousehold}
                disabled={deleteLoading}
                style={[
                  componentStyles.button,
                  {
                    flex: 1,
                    backgroundColor: colors.error[500],
                    borderColor: colors.error[500],
                    marginLeft: spacing[2],
                  },
                  deleteLoading && { opacity: 0.6 }
                ]}
              >
                <Text style={[
                  componentStyles.buttonText,
                  { color: colors.text.inverse }
                ]}>
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
    </AuthGuard>
  );
}
