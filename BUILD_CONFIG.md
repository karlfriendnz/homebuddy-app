# 🏗️ HomeBuddy Build Configuration Template

## 📱 **Build Configuration Reference**

This document serves as the single source of truth for all build configurations in the HomeBuddy project. All builds must follow this template to ensure consistency and reliability.

---

## 🎯 **App Configuration Template**

### **app.json (REQUIRED)**
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

---

## ⚙️ **EAS Build Configuration**

### **eas.json (REQUIRED)**
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

---

## 🚀 **Build Commands Reference**

### **iOS Builds**
```bash
# Development build (for testing with Expo Go)
npx eas build --platform ios --profile development

# Preview build (for internal testing)
npx eas build --platform ios --profile preview

# Production build (for App Store)
npx eas build --platform ios --profile production
```

### **Android Builds**
```bash
# Development build (for testing)
npx eas build --platform android --profile development

# Preview build (for internal testing)
npx eas build --platform android --profile preview

# Production build (for Play Store)
npx eas build --platform android --profile production
```

### **Cross-Platform Builds**
```bash
# Build for both platforms (preview)
npx eas build --platform all --profile preview

# Build for both platforms (production)
npx eas build --platform all --profile production
```

---

## 📋 **Pre-Build Checklist**

### **Environment Setup**
- [ ] EAS CLI is installed and up to date
- [ ] Logged into Expo account: `npx expo login`
- [ ] Apple Developer account is active
- [ ] Google Play Console account is set up (for Android)

### **Project Configuration**
- [ ] `app.json` follows the template above
- [ ] `eas.json` is properly configured
- [ ] Bundle identifier matches EAS project
- [ ] Version numbers are updated
- [ ] Build numbers are incremented

### **Code Quality**
- [ ] All TypeScript compilation errors are fixed
- [ ] All linting errors are resolved
- [ ] Global styles are used consistently
- [ ] No console.log statements in production code
- [ ] Error boundaries are implemented

### **Dependencies**
- [ ] All dependencies are properly installed
- [ ] No conflicting package versions
- [ ] Expo SDK is up to date
- [ ] All required plugins are configured

### **Environment Variables**
- [ ] All environment variables are set in EAS
- [ ] Supabase credentials are configured
- [ ] PostHog tracking is set up
- [ ] Push notification certificates are valid

---

## 🔧 **Build Profiles Explained**

### **Development Profile**
- **Purpose:** Testing with Expo Go or development client
- **Distribution:** Internal
- **Features:** Development client enabled
- **Use Case:** Local development and testing

### **Preview Profile**
- **Purpose:** Internal testing and QA
- **Distribution:** Internal
- **Features:** Full app functionality
- **Use Case:** Team testing, beta testing

### **Production Profile**
- **Purpose:** App Store/Play Store release
- **Distribution:** Store
- **Features:** Optimized for production
- **Use Case:** Public release

---

## 📱 **Platform-Specific Requirements**

### **iOS Requirements**
- **Bundle Identifier:** `com.karlfriendnz.homebuddy`
- **Minimum iOS Version:** 13.0
- **Device Support:** iPhone and iPad
- **Capabilities:** Push Notifications
- **Encryption:** Standard encryption (exempt)

### **Android Requirements**
- **Package Name:** `com.karlfriendnz.homebuddy`
- **Minimum SDK:** 21
- **Target SDK:** 33
- **Device Support:** Phone and tablet
- **Permissions:** Internet, notifications

---

## 🚨 **Common Build Issues & Solutions**

### **iOS Build Issues**
```bash
# Issue: Bundle identifier not registered
# Solution: Register in Apple Developer Portal or use EAS credentials

# Issue: Provisioning profile expired
# Solution: EAS will automatically handle this

# Issue: Push notification certificates invalid
# Solution: Update certificates in Apple Developer Portal
```

### **Android Build Issues**
```bash
# Issue: Package name conflicts
# Solution: Ensure unique package name

# Issue: Keystore not found
# Solution: EAS will generate keystore automatically

# Issue: Version code conflicts
# Solution: Increment version code in app.json
```

---

## 📊 **Build Monitoring**

### **Build Status Commands**
```bash
# Check build status
npx eas build:list

# View build logs
npx eas build:view [BUILD_ID]

# Download build artifacts
npx eas build:download [BUILD_ID]
```

### **Build History**
- All builds are logged in EAS dashboard
- Build artifacts are stored for 30 days
- Build logs are available for debugging
- Build metrics are tracked for optimization

---

## 🔄 **Version Management**

### **Version Update Process**
1. Update `version` in `app.json` (semantic versioning)
2. Update `buildNumber` for iOS
3. Update `versionCode` for Android
4. Commit changes with descriptive message
5. Tag release in Git
6. Run build with updated version

### **Semantic Versioning**
```bash
# Format: MAJOR.MINOR.PATCH
# Example: 1.0.0 -> 1.0.1 (patch)
# Example: 1.0.0 -> 1.1.0 (minor)
# Example: 1.0.0 -> 2.0.0 (major)
```

---

## 📞 **Support & Troubleshooting**

### **Getting Help**
- Check EAS documentation: https://docs.expo.dev/build/introduction/
- Review build logs for specific errors
- Contact Expo support for build issues
- Check Apple Developer Portal for iOS issues
- Check Google Play Console for Android issues

### **Emergency Procedures**
- If build fails, check logs first
- Verify all environment variables are set
- Ensure all dependencies are compatible
- Check for breaking changes in dependencies
- Rollback to previous working version if necessary

---

## 📝 **Document Version**
- **Version:** 1.0
- **Last Updated:** January 1, 2025
- **Next Review:** February 1, 2025

---

**Remember: Always follow this template for consistent and reliable builds! 🎯** 