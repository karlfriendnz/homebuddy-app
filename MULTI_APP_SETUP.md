# 🏗️ HomeBuddy Multi-App Setup with Separate Databases

This document explains how to set up and manage multiple apps with completely separate databases in the HomeBuddy ecosystem.

## 📋 **Overview**

The HomeBuddy ecosystem is designed to support multiple apps, each with its own:
- ✅ **Separate Supabase database**
- ✅ **Independent authentication**
- ✅ **App-specific features**
- ✅ **Shared UI components**
- ✅ **Scalable architecture**

## 🗄️ **Database Architecture**

### **Current Apps**
- **HomeBuddy** - Household management (`homebuddy-db`)
- **TaskMaster** - Task/project management (`taskmaster-db`)
- **FinanceBuddy** - Financial tracking (`financebuddy-db`)
- **HealthBuddy** - Health/fitness tracking (`healthbuddy-db`)

### **Database Configuration**
Each app has its own environment variables:
```bash
# HomeBuddy
EXPO_PUBLIC_SUPABASE_URL=https://homebuddy-db.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=homebuddy-anon-key

# TaskMaster
EXPO_PUBLIC_TASKMASTER_SUPABASE_URL=https://taskmaster-db.supabase.co
EXPO_PUBLIC_TASKMASTER_SUPABASE_ANON_KEY=taskmaster-anon-key

# FinanceBuddy
EXPO_PUBLIC_FINANCEBUDDY_SUPABASE_URL=https://financebuddy-db.supabase.co
EXPO_PUBLIC_FINANCEBUDDY_SUPABASE_ANON_KEY=financebuddy-anon-key
```

## 🚀 **Creating New Apps**

### **1. Generate App Structure**
```bash
# From the homebuddy directory
node scripts/create-app.js taskmaster
node scripts/create-app.js financebuddy
node scripts/create-app.js healthbuddy
```

### **2. Set Up Database**
```bash
# Create new Supabase project
supabase projects create taskmaster-db

# Get project reference
supabase projects list

# Apply migration
supabase db push --project-ref your-project-ref
```

### **3. Configure Environment**
```bash
# Copy environment template
cp apps/taskmaster/.env.example apps/taskmaster/.env

# Edit with your database credentials
nano apps/taskmaster/.env
```

### **4. Install Dependencies**
```bash
cd apps/taskmaster
npm install
```

### **5. Start Development**
```bash
npm start
```

## 🏗️ **App Structure**

### **Generated App Structure**
```
apps/
├── taskmaster/
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/
│   ├── lib/
│   ├── styles/
│   ├── assets/
│   ├── migrations/
│   ├── app.json
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── financebuddy/
└── healthbuddy/
```

### **Database Schema Per App**
Each app gets its own prefixed tables:
- `taskmaster_users`
- `taskmaster_projects`
- `taskmaster_tasks`
- `financebuddy_users`
- `financebuddy_accounts`
- `financebuddy_transactions`

## 🔧 **Using the Database Service**

### **App-Specific Database Operations**
```typescript
import { databaseService } from '../lib/app-database-service';

// Create HomeBuddy service
const homebuddyService = createHomeBuddyDatabaseService();

// Create TaskMaster service
const taskmasterService = createTaskMasterDatabaseService();

// Use app-specific operations
const households = await homebuddyService.getHouseholds(userId);
const projects = await taskmasterService.getProjects(userId);
```

### **Generic CRUD Operations**
```typescript
// Create record
const task = await databaseService.createRecord('tasks', {
  title: 'New Task',
  household_id: householdId,
  created_by: userId
});

// Get records with filters
const tasks = await databaseService.getRecords('tasks', {
  household_id: householdId,
  status: 'pending'
});

// Update record
await databaseService.updateRecord('tasks', taskId, {
  status: 'completed'
});
```

## 🎨 **Theming System**

### **App-Specific Themes**
```typescript
// packages/ui/themes/apps.ts
export const appThemes = {
  homebuddy: {
    primary: '#6366f1',
    secondary: '#8b5cf6'
  },
  taskmaster: {
    primary: '#10b981',
    secondary: '#059669'
  },
  financebuddy: {
    primary: '#f59e0b',
    secondary: '#d97706'
  }
};
```

### **Using Themes in Components**
```typescript
import { appThemes } from '../themes/apps';

const TaskMasterButton = ({ children }) => (
  <TouchableOpacity style={{
    backgroundColor: appThemes.taskmaster.primary
  }}>
    {children}
  </TouchableOpacity>
);
```

## 🔐 **Authentication Strategy**

### **Option 1: Separate Auth Per App**
Each app manages its own users independently.

### **Option 2: Shared Auth Service**
Users can access multiple apps with the same credentials.

## 📊 **Data Migration & Cross-App Features**

### **User Account Linking**
```typescript
interface UserAppAccess {
  user_id: UUID;
  app_name: string;
  access_level: 'basic' | 'premium';
  created_at: TIMESTAMP;
}
```

### **Data Export/Import**
```typescript
class DataMigrationService {
  async exportFromApp(sourceApp: string, userId: string) {
    // Export user data from source app
  }
  
  async importToApp(targetApp: string, userId: string, data: any) {
    // Import data to target app
  }
}
```

## 🛡️ **Security Benefits**

✅ **Complete data isolation** between apps
✅ **Independent scaling** per app
✅ **Separate backup strategies**
✅ **App-specific security policies**
✅ **Easier compliance** (GDPR, etc.)
✅ **Reduced blast radius** for security issues

## 💰 **Cost Considerations**

- **Separate Supabase projects** = separate billing
- **Independent scaling** = pay only for what you use
- **Resource isolation** = no cross-app resource conflicts

## 🚀 **Deployment Strategy**

### **1. Separate Supabase Projects**
```bash
# Create separate projects
supabase projects create homebuddy-db
supabase projects create taskmaster-db
supabase projects create financebuddy-db

# Deploy schemas
supabase db push --project-ref homebuddy-ref
supabase db push --project-ref taskmaster-ref
supabase db push --project-ref financebuddy-ref
```

### **2. Environment Management**
```bash
# .env files per app
app-homebuddy/.env
app-taskmaster/.env
app-financebuddy/.env
```

### **3. CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy Apps
on:
  push:
    branches: [main]

jobs:
  deploy-homebuddy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy HomeBuddy
        run: |
          cd apps/homebuddy
          npm run deploy

  deploy-taskmaster:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy TaskMaster
        run: |
          cd apps/taskmaster
          npm run deploy
```

## 📈 **Scaling Strategy**

### **Phase 1: Foundation (Current)**
- ✅ HomeBuddy with separate database
- ✅ Database configuration system
- ✅ App generation scripts

### **Phase 2: Expansion (Next)**
- 🔄 Create TaskMaster app
- 🔄 Create FinanceBuddy app
- 🔄 Shared component library

### **Phase 3: Advanced Features**
- 🔄 Cross-app user linking
- 🔄 Data migration tools
- 🔄 Unified analytics

## 🛠️ **Development Workflow**

### **1. Shared Development**
```bash
# Work on shared packages
cd packages/core
npm run dev

# Work on UI components
cd packages/ui
npm run storybook
```

### **2. App Development**
```bash
# Develop individual apps
cd apps/taskmaster
npm run start

# Test across all apps
npm run test:all
```

### **3. Database Management**
```bash
# Apply migrations to specific app
supabase db push --project-ref taskmaster-ref

# Reset specific app database
supabase db reset --project-ref taskmaster-ref
```

## 📚 **Best Practices**

### **1. Database Design**
- Use app prefixes for all tables
- Implement proper RLS policies
- Create indexes for performance
- Use UUIDs for primary keys

### **2. Code Organization**
- Keep app-specific logic separate
- Use shared utilities where possible
- Maintain consistent naming conventions
- Document app-specific features

### **3. Security**
- Implement proper authentication per app
- Use Row Level Security (RLS)
- Validate all inputs
- Monitor database access

### **4. Performance**
- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Monitor app performance

## 🎯 **Next Steps**

1. **Apply HomeBuddy migration** to your current database
2. **Test the new database service** with existing functionality
3. **Create your first new app** using the generator
4. **Set up separate Supabase projects** for each app
5. **Implement app-specific features** and theming

## 📞 **Support**

For questions or issues with the multi-app setup:
1. Check the migration logs
2. Verify environment configuration
3. Test database connectivity
4. Review RLS policies

---

**Happy building! 🚀**

