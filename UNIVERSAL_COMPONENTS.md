# Universal Components - Expo Best Practices

This document shows how to use the universal components that work seamlessly across Android, iOS, and web platforms.

## UniversalInput

A cross-platform input component that handles platform differences automatically.

```typescript
import { UniversalInput } from '../components/ui';

// Basic usage
<UniversalInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// With icon
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

// With error handling
<UniversalInput
  label="Username"
  value={username}
  onChangeText={setUsername}
  error={usernameError}
/>
```

## UniversalButton

A cross-platform button component with multiple variants and sizes.

```typescript
import { UniversalButton } from '../components/ui';

// Primary button (default)
<UniversalButton
  title="Sign In"
  onPress={handleSignIn}
/>

// Secondary button
<UniversalButton
  title="Cancel"
  variant="secondary"
  onPress={handleCancel}
/>

// Outline button
<UniversalButton
  title="Learn More"
  variant="outline"
  onPress={handleLearnMore}
/>

// Ghost button
<UniversalButton
  title="Skip"
  variant="ghost"
  onPress={handleSkip}
/>

// Different sizes
<UniversalButton
  title="Small"
  size="sm"
  onPress={handleAction}
/>

<UniversalButton
  title="Large"
  size="lg"
  onPress={handleAction}
/>

// Loading state
<UniversalButton
  title="Processing..."
  loading={true}
  disabled={true}
  onPress={handleAction}
/>
```

## Platform-Specific Features

### Web
- Removes default focus outlines
- Adds smooth transitions
- Proper cursor states
- Prevents text selection on buttons

### Mobile (iOS/Android)
- Native touch feedback
- Platform-appropriate styling
- Optimized for touch interaction

## Consistent Heights

All components use consistent heights:
- **Small**: 36px
- **Medium**: 44px (default)
- **Large**: 52px

## Styling

Components automatically handle:
- Focus states
- Error states
- Disabled states
- Loading states
- Platform-specific behaviors

## Best Practices

1. **Use Universal Components**: Always use `UniversalInput` and `UniversalButton` for consistency
2. **Platform.select()**: The components handle platform differences internally
3. **Consistent Spacing**: Use the spacing system from `styles/global.ts`
4. **Accessibility**: Components include proper accessibility features
5. **Performance**: Components are optimized for each platform

## Migration from Old Components

Replace:
- `AuthInput` → `UniversalInput`
- `AuthButton` → `UniversalButton`
- `StandardInput` → `UniversalInput`
- `StandardButton` → `UniversalButton`

The new components provide the same functionality with better cross-platform support.
