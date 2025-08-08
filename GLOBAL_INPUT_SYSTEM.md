# 🌐 Global Input Styling System

## Overview

This document defines the global input styling system that applies to ALL input components across the HomeBuddy application. This system ensures consistent, clean, and professional input styling across all platforms (Web, iOS, Android).

## 🎯 **Core Principles**

### **1. No Focus Styling**
- **NO** focus borders, outlines, or color changes
- **NO** focus rings or box-shadows
- **NO** visual feedback when inputs are focused
- Inputs maintain the same appearance whether focused or not

### **2. Consistent Heights**
- **ALL** inputs must be exactly **44px** in height
- **NO** exceptions or variations
- **NO** custom heights allowed

### **3. Clean Design**
- Simple, minimalist appearance
- Consistent border radius (6px)
- Standard padding and spacing
- Professional, modern look

## 🛠 **Implementation**

### **Global CSS Rules**

The system is implemented through comprehensive CSS rules in `global.css`:

```css
/* Removes ALL focus styling from ALL input types */
input:focus,
textarea:focus,
select:focus,
input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
/* ... all other input types ... */
{
  outline: none !important;
  border-color: inherit !important;
  box-shadow: none !important;
}

/* Ensures consistent 44px height for all inputs */
input,
textarea,
select {
  height: 44px !important;
  min-height: 44px !important;
  max-height: 44px !important;
  border-radius: 6px !important;
  border: 1px solid #e5e7eb !important;
  background-color: #ffffff !important;
  font-size: 16px !important;
}
```

### **Component Usage**

**✅ REQUIRED: Use UniversalInput for all inputs**

```typescript
import { UniversalInput } from '../components/ui';

// Basic input
<UniversalInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// Input with icon
<UniversalInput
  label="Password"
  icon="lock-closed-outline"
  placeholder="Enter your password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  showPasswordToggle
  onPasswordToggle={() => setShowPassword(!showPassword)}
  showPassword={showPassword}
/>

// Input with error
<UniversalInput
  label="Username"
  value={username}
  onChangeText={setUsername}
  error={usernameError}
/>
```

## 📋 **Project Rules**

### **MANDATORY Requirements**

1. **ALL inputs MUST use `UniversalInput`**
   - No custom TextInput components
   - No direct TextInput usage
   - No custom input styling

2. **ALL inputs MUST be 44px height**
   - No exceptions
   - No custom heights
   - No variations

3. **ALL inputs MUST have no focus styling**
   - No focus borders
   - No focus outlines
   - No color changes on focus

4. **ALL inputs MUST use global color system**
   - Use colors from `styles/global.ts`
   - No hardcoded colors
   - No custom color schemes

### **FORBIDDEN Practices**

❌ **Never do this:**
```typescript
// ❌ Custom TextInput with hardcoded styling
<TextInput 
  style={{ 
    height: 50,           // ❌ Custom height
    borderColor: '#blue', // ❌ Hardcoded color
    outline: 'none'       // ❌ Custom focus styling
  }}
  placeholder="Enter email"
/>

// ❌ Custom input component
const CustomInput = () => (
  <View style={{ height: 60 }}> {/* ❌ Custom height */}
    <TextInput />
  </View>
);

// ❌ Inline styling
<TextInput style={{ padding: 20, fontSize: 18 }} /> // ❌ Hardcoded values
```

## 🔧 **Technical Details**

### **CSS Coverage**

The global CSS covers:
- All HTML input types (`text`, `email`, `password`, etc.)
- All React Native Web input components
- All focus states (`:focus`, `:focus-visible`, `:focus-within`)
- All browser-specific styles (WebKit, Mozilla, etc.)
- All platform-specific overrides (iOS, Android)

### **Platform Support**

- **Web**: Complete focus style removal
- **iOS**: Native styling with consistent height
- **Android**: Native styling with consistent height
- **Cross-platform**: Universal component behavior

### **Browser Compatibility**

- Chrome/Chromium: Full support
- Safari: Full support
- Firefox: Full support
- Edge: Full support
- Mobile browsers: Full support

## 📱 **Component Features**

### **UniversalInput Props**

```typescript
interface UniversalInputProps {
  label?: string;                    // Optional label
  icon?: keyof typeof Ionicons.glyphMap; // Optional icon
  error?: string;                    // Error message
  showPasswordToggle?: boolean;      // Password visibility toggle
  onPasswordToggle?: () => void;     // Password toggle handler
  showPassword?: boolean;            // Password visibility state
  // ... all TextInput props
}
```

### **Built-in Features**

- ✅ **Consistent 44px height**
- ✅ **No focus styling**
- ✅ **Error state handling**
- ✅ **Password toggle support**
- ✅ **Icon support**
- ✅ **Label support**
- ✅ **Cross-platform compatibility**
- ✅ **Accessibility support**

## 🚀 **Migration Guide**

### **From Old Components**

Replace old input usage:

```typescript
// OLD ❌
import AuthInput from '../auth/AuthInput';
<AuthInput label="Email" />

// NEW ✅
import { UniversalInput } from '../ui';
<UniversalInput label="Email" />
```

### **From Custom Inputs**

Replace custom input styling:

```typescript
// OLD ❌
<TextInput style={{ height: 50, borderColor: '#blue' }} />

// NEW ✅
<UniversalInput />
```

## ✅ **Verification Checklist**

Before committing any input-related code, verify:

- [ ] Uses `UniversalInput` component
- [ ] No custom TextInput styling
- [ ] No hardcoded colors or spacing
- [ ] No focus styling added
- [ ] Consistent 44px height
- [ ] Follows global color system
- [ ] Works on all platforms
- [ ] No console errors
- [ ] Accessibility maintained

## 🎨 **Design Tokens**

All inputs use these design tokens:

```typescript
// Height
height: 44px

// Border
borderRadius: 6px
borderColor: colors.neutral[200]

// Typography
fontSize: 16px
fontFamily: inherit

// Colors
backgroundColor: colors.background
textColor: colors.text.primary
placeholderColor: colors.neutral[400]
```

This system ensures a consistent, professional, and maintainable input experience across the entire HomeBuddy application.
