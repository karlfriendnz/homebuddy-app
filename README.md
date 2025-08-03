# 🏠 HomeBuddy - Family Organization App

A modern mobile and web application to help families stay organized with chores, shopping lists, events, and gamification features.

## 🎯 Project Overview

HomeBuddy is built with React Native (Expo) and Supabase, featuring:
- **Family Management** - Multi-household support with role-based access
- **Task Management** - Chores, shopping lists, and event planning
- **Gamification** - Streaks, points, rewards, and achievements
- **Real-time Updates** - Live synchronization across devices
- **Analytics** - Comprehensive tracking with PostHog

## 🛠 Tech Stack

- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Analytics**: PostHog
- **Styling**: Global design system with unified tokens
- **State Management**: Supabase Realtime + React Query
- **Push Notifications**: Expo Notifications + Firebase

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone and install dependencies**
   git clone <repository-url>
   cd homebuddy
2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Supabase and PostHog credentials
   ```

3. **Start the development server**
   npm start
   # or
### Development Commands
# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Code quality
npm run lint
npm run check-rules

# Reset project (if needed)
## 📁 Project Structure

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
├── hooks/                 # Custom React hooks
└── scripts/               # Build and utility scripts
```

## 🎨 Design System

HomeBuddy uses a comprehensive global design system located in `styles/global.ts`. This ensures:

- **Consistency** - All components use the same design tokens
- **Maintainability** - Single source of truth for styling
- **Scalability** - Easy to add new components with consistent styling
- **Type Safety** - Full TypeScript support for all style properties

### Key Features:
- **Color System** - Primary, neutral, success, warning, and error colors
- **Typography** - Font sizes, weights, line heights, and letter spacing
- **Spacing Scale** - Consistent spacing values (0-128)
- **Component Styles** - Pre-built styles for buttons, inputs, text, etc.
- **Utility Classes** - Comprehensive utility system for rapid development

## 📋 Development Rules

**IMPORTANT**: All development must follow our project rules defined in `PROJECT_RULES.md`.

### Key Requirements:
- ✅ **Use Global Styles** - No hardcoded colors, spacing, or typography
- ✅ **TypeScript** - All files must use TypeScript with proper typing
- ✅ **Code Quality** - All code must pass linting and project rule checks
- ✅ **Error Handling** - Proper error handling and loading states
- ✅ **Documentation** - Clear comments and documentation

### Pre-commit Checks:
The project includes automated checks that run before each commit:
- Project rule violations (hardcoded values, missing imports)
- ESLint errors and warnings
- Code formatting with Prettier

## 🔧 Environment Setup

### Required Environment Variables:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PostHog Configuration
EXPO_PUBLIC_POSTHOG_KEY=your_posthog_key
EXPO_PUBLIC_POSTHOG_HOST=your_posthog_host

# App Configuration
EXPO_PUBLIC_APP_NAME=HomeBuddy
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=development
```

## 📚 Documentation

- **[PROJECT_RULES.md](./PROJECT_RULES.md)** - Development rules and standards
- **[requirements.md](./requirements.md)** - Product requirements and features
- **[plan.md](./plan.md)** - Implementation plan and progress tracking
- **[schema.md](./schema.md)** - Database schema documentation

## 🤝 Contributing

1. Read and follow the [PROJECT_RULES.md](./PROJECT_RULES.md)
2. Ensure all code passes linting and project rule checks
3. Write clear commit messages
4. Update documentation as needed

## 📄 License

This project is proprietary software. All rights reserved.