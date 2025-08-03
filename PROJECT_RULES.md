# 🏠 HomeBuddy Project Rules & Standards

## 📋 **Project Overview**
This document establishes the rules, standards, and best practices for the HomeBuddy application development. All developers must follow these guidelines to maintain consistency, quality, and maintainability.

---

## 🎨 **Global Style System Rules**

### **MANDATORY: Use Global Styles for All Components**

**✅ REQUIRED:**
- All new components MUST import and use the global style system
- No hardcoded colors, spacing, or typography values
- All styling must use the unified design tokens

**❌ FORBIDDEN:**
- Hardcoded color values (e.g., `'#6366f1'`, `'#ffffff'`)
- Hardcoded spacing values (e.g., `margin: 20`, `padding: 16`)
- Hardcoded font sizes (e.g., `fontSize: 16`, `fontSize: 24`)
- Inline styles with color/spacing values
- Custom StyleSheet.create with hardcoded design tokens

### **Import Pattern (REQUIRED)**
```typescript
// ✅ CORRECT - Always import global styles
import { colors, componentStyles, spacing, typography } from '../../styles/global';

// ❌ WRONG - Never use hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff', // ❌ Hardcoded color
    padding: 20, // ❌ Hardcoded spacing
    fontSize: 16, // ❌ Hardcoded typography
  }
});
```

### **Usage Examples**

**✅ CORRECT - Using Global Styles:**
```typescript
// Colors
backgroundColor: colors.background
color: colors.text.primary
borderColor: colors.primary[500]

// Typography
fontSize: typography.size.base
fontWeight: typography.weight.semibold
lineHeight: typography.size.base * typography.lineHeight.normal

// Spacing
padding: spacing[6]
marginTop: spacing[4]
gap: spacing[3]

// Component Styles
style={componentStyles.button}
style={componentStyles.input}
style={componentStyles.text}

// Utility Classes
style={[componentStyles.flex1, componentStyles.p4, componentStyles.itemsCenter]}
```

**❌ WRONG - Hardcoded Values:**
```typescript
// ❌ Never do this
backgroundColor: '#ffffff'
color: '#111827'
padding: 24
fontSize: 16
fontWeight: '600'
```

---

## 🧩 **Component Development Rules**

### **1. Component Structure (REQUIRED)**
```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, componentStyles } from '../../styles/global';

interface ComponentProps {
  // Define props with TypeScript
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  return (
    <View style={[componentStyles.container, componentStyles.p4]}>
      <Text style={[componentStyles.text, componentStyles.fontSemibold]}>
        Content
      </Text>
    </View>
  );
}
```

### **2. Style Composition (REQUIRED)**
```typescript
// ✅ CORRECT - Compose styles using arrays
style={[
  componentStyles.button,
  componentStyles.buttonPrimary,
  componentStyles.mb4
]}

// ✅ CORRECT - Conditional styling
style={[
  componentStyles.input,
  error ? componentStyles.inputError : null
]}

// ❌ WRONG - Don't create new StyleSheet objects
const styles = StyleSheet.create({
  customStyle: { /* avoid this */ }
});
```

### **3. Color Usage (REQUIRED)**
```typescript
// ✅ CORRECT - Use semantic color tokens
colors.primary[500]    // Main brand color
colors.neutral[500]    // Secondary text
colors.success[500]    // Success states
colors.error[500]      // Error states
colors.text.primary    // Primary text
colors.text.secondary  // Secondary text
colors.background      // Background color
colors.surface         // Surface color

// ❌ WRONG - Don't use hardcoded colors
'#6366f1'  // Use colors.primary[500] instead
'#6b7280'  // Use colors.neutral[500] instead
'#ffffff'  // Use colors.background instead
```

---

## 📁 **File Organization Rules**

### **1. File Structure (REQUIRED)**
```
homebuddy/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── auth/              # Authentication components
│   ├── ui/                # UI components
│   └── [feature]/         # Feature-specific components
├── lib/                   # Utilities and configurations
│   ├── supabase.ts        # Supabase client
│   └── supabase-utils.ts  # Supabase utilities
├── styles/                # Global styles
│   └── global.ts          # Global style system
├── constants/             # App constants
│   └── Colors.ts          # Color constants (uses global styles)
└── hooks/                 # Custom React hooks
```

### **2. Import Order (REQUIRED)**
```typescript
// 1. React and React Native imports
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party libraries
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. Global styles (ALWAYS import)
import { colors, componentStyles } from '../../styles/global';

// 4. Local utilities and configurations
import { authUtils } from '../../lib/supabase-utils';

// 5. Local components
import AuthButton from '../auth/AuthButton';
```

---

## 🔧 **Development Standards**

### **1. TypeScript (REQUIRED)**
- All files must use TypeScript
- Define proper interfaces for all props
- Use strict type checking
- No `any` types unless absolutely necessary

### **2. Naming Conventions (REQUIRED)**
```typescript
// Components: PascalCase
export default function UserProfile() { }

// Files: kebab-case or PascalCase
UserProfile.tsx
user-profile.tsx

// Variables: camelCase
const userData = { };
const isLoading = true;

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Interfaces: PascalCase with 'Props' suffix
interface ButtonProps { }
interface UserProfileProps { }
```

### **3. Error Handling (REQUIRED)**
```typescript
// ✅ CORRECT - Proper error handling
try {
  const result = await apiCall();
  // Handle success
} catch (error: any) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
  Alert.alert('Error', 'Something went wrong. Please try again.');
}
```

### **4. Performance (REQUIRED)**
- Use `React.memo()` for expensive components
- Implement proper loading states
- Use `useCallback` and `useMemo` when appropriate
- Avoid unnecessary re-renders

---

## 🧪 **Testing & Quality Rules**

### **1. Linting (REQUIRED)**
- All code must pass ESLint without errors
- Fix all warnings before committing
- Use Prettier for code formatting
- Run `npm run lint` before committing

### **2. Code Review Checklist (REQUIRED)**
Before submitting code for review, ensure:
- [ ] Uses global styles (no hardcoded design tokens)
- [ ] Follows TypeScript best practices
- [ ] Proper error handling implemented
- [ ] Loading states included
- [ ] Accessibility considerations
- [ ] Performance optimizations
- [ ] Linting passes without errors

### **3. Component Testing (RECOMMENDED)**
- Test component rendering
- Test user interactions
- Test error states
- Test loading states

---

## 🚀 **Deployment Rules**

### **1. Pre-deployment Checklist (REQUIRED)**
- [ ] All linting errors fixed
- [ ] Global styles used consistently
- [ ] TypeScript compilation successful
- [ ] No console.log statements in production
- [ ] Environment variables properly configured
- [ ] Error boundaries implemented

### **2. Environment Configuration (REQUIRED)**
- Use `.env` files for environment variables
- Never commit sensitive data
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Document all required environment variables

### **3. Build Configuration (REQUIRED)**
- **MUST** maintain consistent build configuration across all platforms
- **MUST** use EAS Build for all production builds
- **MUST** follow the build configuration template
- **MUST** update version numbers appropriately
- **MUST** test builds before deployment
- **MUST** document breaking changes
- **MUST** follow semantic versioning

#### **Build Configuration Template (REQUIRED)**
```json
{
  "expo": {
    "name": "HomeBuddy",
    "slug": "homebuddy",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "homebuddy",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.karlfriendnz.homebuddy",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.karlfriendnz.homebuddy"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "a629c147-e210-4a5e-ae1d-f49c0ab64c33"
      }
    }
  }
}
```

#### **EAS Build Configuration (REQUIRED)**
```json
{
  "cli": {
    "version": ">= 16.17.3",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### **Build Commands (REQUIRED)**
```bash
# Development build (for testing)
npx eas build --platform ios --profile development

# Preview build (for internal testing)
npx eas build --platform ios --profile preview

# Production build (for App Store)
npx eas build --platform ios --profile production

# Android builds
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

#### **Build Checklist (REQUIRED)**
Before running any build:
- [ ] All environment variables are set in EAS
- [ ] App version is updated in app.json
- [ ] Build number is incremented for iOS
- [ ] All dependencies are properly installed
- [ ] No TypeScript compilation errors
- [ ] All linting errors are fixed
- [ ] Global styles are used consistently
- [ ] Push notification certificates are valid
- [ ] Apple Developer account is active
- [ ] Bundle identifier matches EAS project

---

## 📚 **Documentation Rules**

### **1. Code Comments (REQUIRED)**
```typescript
/**
 * UserProfile Component
 * Displays user information and allows profile editing
 * 
 * @param user - User data object
 * @param onEdit - Callback function when edit is pressed
 * @param isLoading - Loading state for the component
 */
export default function UserProfile({ user, onEdit, isLoading }: UserProfileProps) {
  // Component implementation
}
```

### **2. README Files (RESTRICTED)**
- **DO NOT create README files unless specifically requested by the user**
- Only create README files when explicitly asked to do so
- Focus on code implementation rather than documentation
- If documentation is needed, prefer inline code comments over separate README files

### **3. README Updates (REQUIRED)**
- Update README.md when adding new features
- Document new environment variables
- Update installation instructions
- Document breaking changes

---

## 🔄 **Migration Rules**

### **1. Legacy Code Migration (REQUIRED)**
When updating existing components:
1. Import global styles
2. Replace hardcoded values with design tokens
3. Remove local StyleSheet.create objects
4. Update to use utility classes
5. Test thoroughly
6. Update documentation

### **2. Breaking Changes (REQUIRED)**
- Document all breaking changes
- Provide migration guides
- Update version numbers appropriately
- Notify team members

---

## ⚠️ **Common Violations & Fixes**

### **❌ VIOLATION: Hardcoded Colors**
```typescript
// ❌ WRONG
backgroundColor: '#6366f1'
color: '#ffffff'

// ✅ FIX
backgroundColor: colors.primary[500]
color: colors.text.inverse
```

### **❌ VIOLATION: Hardcoded Spacing**
```typescript
// ❌ WRONG
padding: 20
marginTop: 16

// ✅ FIX
padding: spacing[5]
marginTop: spacing[4]
```

### **❌ VIOLATION: Hardcoded Typography**
```typescript
// ❌ WRONG
fontSize: 16
fontWeight: '600'

// ✅ FIX
fontSize: typography.size.base
fontWeight: typography.weight.semibold
```

### **❌ VIOLATION: Local StyleSheet**
```typescript
// ❌ WRONG
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
  }
});

// ✅ FIX
import { colors, componentStyles, spacing } from '../../styles/global';
// Use componentStyles.container and utility classes
```

---

## 🖼️ **Image Upload Rules**

### **MANDATORY: Use Simple Image Upload Pattern**

**✅ REQUIRED:**
- All image uploads MUST use the simple upload pattern from `lib/image-upload.ts`
- Let the database handle timestamps automatically
- Use descriptive filenames with timestamps for uniqueness
- Handle errors gracefully with user-friendly messages

**❌ FORBIDDEN:**
- Complex image manipulation before upload
- Manual timestamp handling that can cause timezone issues
- Retry logic that masks underlying problems
- Hardcoded file paths or bucket names
- Image resizing that can fail silently

### **Image Upload Pattern (REQUIRED)**

**✅ CORRECT - Simple Upload Pattern:**
```typescript
// 1. Import the upload function
import { uploadImageToSupabase, uploadHouseholdImage } from '../../lib/image-upload';

// 2. Use the simple upload pattern
const uploadResult = await uploadImageToSupabase(
  imageUri,           // The image URI from picker
  userId,             // Current user ID
  'bucket-name',      // Storage bucket name
  'descriptive_filename.jpg'  // Optional descriptive filename
);

// 3. Handle the result
if (!uploadResult.success) {
  setError(`Upload failed: ${uploadResult.error}`);
  return;
}

// 4. Use the uploaded URL
const imageUrl = uploadResult.url;
```

**✅ CORRECT - Household Image Upload:**
```typescript
// Use the specialized household upload function
const uploadResult = await uploadHouseholdImage(
  imageUri,
  userId,
  householdId,
  householdName
);

if (!uploadResult.success) {
  setError(`Failed to upload image: ${uploadResult.error}`);
  return;
}
```

**❌ WRONG - Complex Upload Pattern:**
```typescript
// ❌ Never do this - Complex manipulation
const resizedImage = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 800, height: 800 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);

// ❌ Never do this - Manual timestamp handling
const joinedAt = new Date().toISOString(); // Can cause timezone issues

// ❌ Never do this - Complex retry logic
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    // Complex upload logic
  } catch (error) {
    // Retry logic that masks problems
  }
}
```

### **Image Upload Best Practices**

**1. Filename Generation:**
```typescript
// ✅ GOOD - Descriptive with timestamp
`household_${householdId}_${Date.now()}.jpg`
`profile_${userId}_${Date.now()}.png`
`event_${eventId}_${Date.now()}.webp`

// ❌ BAD - Generic or no timestamp
`image.jpg`
`upload.png`
`file.jpg`
```

**2. Error Handling:**
```typescript
// ✅ GOOD - Clear error messages
if (!uploadResult.success) {
  setError(`Failed to upload image: ${uploadResult.error}`);
  return;
}

// ❌ BAD - Generic error messages
if (error) {
  setError('Something went wrong');
  return;
}
```

**3. Database Updates:**
```typescript
// ✅ GOOD - Let database handle timestamps
const { error: updateError } = await supabase
  .from('table_name')
  .update({ image_url: uploadResult.url })
  .eq('id', recordId);

// ❌ BAD - Manual timestamp handling
const { error: updateError } = await supabase
  .from('table_name')
  .update({ 
    image_url: uploadResult.url,
    updated_at: new Date().toISOString() // Can cause timezone issues
  })
  .eq('id', recordId);
```

### **Storage Bucket Naming Convention**

**✅ REQUIRED Bucket Names:**
- `household-images` - For household profile images
- `user-avatars` - For user profile pictures
- `event-images` - For event photos
- `task-images` - For task-related images
- `receipt-images` - For shopping receipts

**❌ FORBIDDEN:**
- Generic bucket names like `images`, `uploads`, `files`
- Bucket names without clear purpose
- Hardcoded bucket names in components

### **Image Upload Validation**

**✅ REQUIRED Validation:**
```typescript
// 1. Check if image was selected
if (!imageUri) {
  setError('Please select an image');
  return;
}

// 2. Use the upload function
const uploadResult = await uploadImageToSupabase(imageUri, userId, bucketName);

// 3. Handle the result
if (!uploadResult.success) {
  setError(`Upload failed: ${uploadResult.error}`);
  return;
}
```

**❌ FORBIDDEN Validation:**
```typescript
// ❌ Don't manually check file size
const response = await fetch(imageUri);
const blob = await response.blob();
if (blob.size > 5 * 1024 * 1024) {
  setError('File too large');
  return;
}

// ❌ Don't manually validate file type
const fileExtension = imageUri.split('.').pop();
if (!['jpg', 'png', 'gif'].includes(fileExtension)) {
  setError('Invalid file type');
  return;
}
```

### **Migration Rules for Existing Uploads**

When updating existing image upload code:
1. Replace complex upload logic with simple pattern
2. Remove manual timestamp handling
3. Use the standardized upload functions
4. Update error handling to be user-friendly
5. Test thoroughly with different image types
6. Update documentation

---

## 📞 **Support & Questions**

### **Getting Help**
- Check this document first
- Review existing components for examples
- Ask team members for guidance
- Create issues for unclear requirements

### **Suggesting Improvements**
- Create pull requests for rule improvements
- Discuss changes in team meetings
- Update this document when rules change

---

## 📝 **Document Version**
- **Version:** 1.0
- **Last Updated:** January 1, 2025
- **Next Review:** February 1, 2025

---

**Remember: Consistency is key to maintaining a high-quality, scalable codebase. Follow these rules diligently! 🎯** 