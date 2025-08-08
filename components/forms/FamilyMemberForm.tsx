import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';
import { DateOfBirthPicker } from '../ui/DatePicker';
import { ImageCropper } from '../ui/ImageCropper';

interface FamilyMember {
  id?: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role?: 'admin' | 'adult' | 'teen' | 'child' | 'relative' | 'pet';
  profile_picture?: string;
}

interface FamilyMemberFormProps {
  initialData?: Partial<FamilyMember>;
  onSubmit: (data: FamilyMember) => void;
  submitButtonText?: string;
  loading?: boolean;
  showRole?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  onImageUpdate?: (imageUri: string) => void; // Callback for immediate image updates
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full access to household management' },
  { value: 'adult', label: 'Adult', description: 'Can manage tasks and view household info' },
  { value: 'teen', label: 'Teen', description: 'Can view and complete assigned tasks' },
  { value: 'child', label: 'Child', description: 'Can view assigned tasks with parent guidance' },
  { value: 'relative', label: 'Relative', description: 'Extended family member with limited access' },
  { value: 'pet', label: 'Pet', description: 'Family pet (for fun!)' },
];

export default function FamilyMemberForm({
  initialData = {},
  onSubmit,
  submitButtonText = 'Save',
  loading = false,
  showRole = true,
  showEmail = true,
  showPhone = true,
  onImageUpdate,
}: FamilyMemberFormProps) {
  const [formData, setFormData] = useState<FamilyMember>({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    role: 'adult',
    profile_picture: '',
    ...initialData,
  });

  // Profile image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);

  // Ref for first name input focus
  const firstNameInputRef = useRef<TextInput>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCropImageUri(result.assets[0].uri);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = async (croppedImageUri: string) => {
    setFormData(prev => ({ ...prev, profile_picture: croppedImageUri }));
    
    // Immediately update the avatar if callback is provided
    if (onImageUpdate) {
      onImageUpdate(croppedImageUri);
    }
    
    setShowCropModal(false);
    setCropImageUri(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageUri(null);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };


  
  return (
    <View>
      {/* Profile Picture */}
      <View style={{ marginBottom: spacing[6], marginTop: spacing[4] }}>
        <Text style={componentStyles.globalLabel}>
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
          {formData.profile_picture && formData.profile_picture.trim() !== '' && !formData.profile_picture.startsWith('blob:') ? (
            <View style={{ 
              width: 96, 
              height: 96, 
              borderRadius: 48, 
              overflow: 'hidden',
              backgroundColor: colors.neutral[100]
            }}>
              <Image
                source={{ uri: formData.profile_picture }}
                style={{ 
                  width: 96, 
                  height: 96
                }}
                resizeMode="cover"
                onError={() => {}}
                onLoad={() => {}}
              />
            </View>
          ) : (
            <Text style={[componentStyles.textSecondary, componentStyles.textCenter]}>
              📷
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Name Fields */}
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
                { marginLeft: 0 }
              ]}
              value={formData.first_name || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
              placeholder="First name"
              placeholderTextColor={colors.neutral[400]}
              autoFocus={true}
            />
          </View>
          <View style={componentStyles.flex1}>
            <Text style={componentStyles.globalLabel}>
              Last Name *
            </Text>
            <TextInput
              style={[
                componentStyles.inputSimple,
                { marginLeft: 0 }
              ]}
              value={formData.last_name || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
              placeholder="Last name"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        <View>
          <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
            Nickname (optional)
          </Text>
          <TextInput
            style={[
              componentStyles.inputSimple,
              { marginLeft: 0 }
            ]}
            value={formData.nickname || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nickname: text }))}
            placeholder="Nickname"
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
      </View>

      {/* Contact Information */}
      {(showEmail || showPhone) && (
        <View style={{ marginBottom: spacing[4] }}>
          <Text style={[componentStyles.fontSemibold, componentStyles.textLg, { marginBottom: spacing[3] }]}>
            Contact Information
          </Text>
          
          {showEmail && (
            <View style={{ marginBottom: spacing[3] }}>
              <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
                Email (optional)
              </Text>
              <TextInput
                style={[
                  componentStyles.inputSimple,
                  { marginLeft: 0 }
                ]}
                value={formData.email || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="email@example.com"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {showPhone && (
            <View>
              <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[1] }]}>
                Phone Number (optional)
              </Text>
              <TextInput
                style={[
                  componentStyles.inputSimple,
                  { marginLeft: 0 }
                ]}
                value={formData.phone || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </View>
      )}

      {/* Personal Information */}
      <View style={{ marginBottom: spacing[4] }}>
        <Text style={[componentStyles.fontSemibold, componentStyles.textLg, { marginBottom: spacing[3] }]}>
          Personal Information
        </Text>
        
        <DateOfBirthPicker
          label="Date of Birth"
          value={formData.date_of_birth}
          onChange={(date) => setFormData(prev => ({ ...prev, date_of_birth: date }))}
          required={true}
        />

        <View>
          <Text style={[componentStyles.fontMedium, componentStyles.textSecondary, { marginBottom: spacing[2] }]}>
            Gender
          </Text>
          <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}>
            {genderOptions.map((gender) => (
              <TouchableOpacity
                key={gender.value}
                onPress={() => setFormData(prev => ({ ...prev, gender: gender.value as any }))}
                style={[
                  { paddingHorizontal: spacing[4] },
                  { paddingVertical: spacing[3] },
                  { borderRadius: borderRadius.md },
                  { borderWidth: 1 },
                  { justifyContent: 'center' },
                  formData.gender === gender.value
                    ? [{ backgroundColor: colors.primary[500] }, { borderColor: colors.primary[500] }]
                    : [{ backgroundColor: colors.neutral[100] }, { borderColor: colors.border }]
                ]}
              >
                <Text
                  style={[
                    componentStyles.fontMedium,
                    componentStyles.textSm,
                    formData.gender === gender.value
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

      {/* Role (optional) */}
      {showRole && (
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={componentStyles.globalLabel}>
            Role
          </Text>
          <View style={[componentStyles.flexRow, { flexWrap: 'wrap', gap: spacing[2] }]}>
            {roleOptions.map((role) => (
              <TouchableOpacity
                key={role.value}
                onPress={() => setFormData(prev => ({ ...prev, role: role.value as any }))}
                style={[
                  { paddingHorizontal: spacing[4] },
                  { paddingVertical: spacing[3] },
                  { borderRadius: borderRadius.md },
                  { borderWidth: 1 },
                  { justifyContent: 'center' },
                  formData.role === role.value
                    ? [{ backgroundColor: colors.primary[500] }, { borderColor: colors.primary[500] }]
                    : [{ backgroundColor: colors.neutral[100] }, { borderColor: colors.border }]
                ]}
              >
                <Text
                  style={[
                    componentStyles.fontMedium,
                    componentStyles.textSm,
                    formData.role === role.value
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
            {roleOptions.find(r => r.value === formData.role)?.description || ''}
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[
          { backgroundColor: colors.primary[500] },
          { padding: spacing[4] },
          { borderRadius: borderRadius.lg },
          componentStyles.itemsCenter,
          { marginBottom: spacing[4] }, // Add bottom margin to prevent cutoff
          loading && { opacity: 0.6 }
        ]}
      >
        <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
          {loading ? 'Saving...' : submitButtonText}
        </Text>
      </TouchableOpacity>

      {/* Image Cropper Modal */}
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
