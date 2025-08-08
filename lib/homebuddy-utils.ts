import { databaseService } from './app-database-service';
import { createCurrentAppSupabaseClient } from './database-config';

// Error handling utility
export class HomeBuddyError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'HomeBuddyError';
  }
}

// Handle HomeBuddy errors
export const handleHomeBuddyError = (error: any): never => {
  console.error('HomeBuddy Error:', error);
  
  if (error?.message) {
    throw new HomeBuddyError(
      error.message,
      error.status,
      error.details
    );
  }
  
  throw new HomeBuddyError('An unexpected error occurred');
};

// HomeBuddy User utilities
export const homebuddyUserUtils = {
  // Get current user
  async getCurrentUser() {
    try {
      const supabase = createCurrentAppSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;
      
      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      return profile;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return null;
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    try {
      const supabase = createCurrentAppSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  },

  // Update last active timestamp
  async updateLastActive(userId: string): Promise<void> {
    try {
      const supabase = createCurrentAppSupabaseClient();
      const { error } = await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      handleHomeBuddyError(error);
    }
  }
};

// HomeBuddy Household utilities
export const homebuddyHouseholdUtils = {
  // Check if user has any households
  async userHasHousehold(userId: string): Promise<boolean> {
    try {
      if (!userId || typeof userId !== 'string') {
        return false;
      }
      
      const { data, error } = await databaseService.getRecords('family_members', { user_id: userId });
      
      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking user household:', error);
      return false;
    }
  },

  // Get user's households
  async getUserHouseholds(userId: string) {
    try {
      const { data, error } = await databaseService.getRecords('family_members', { user_id: userId });
      
      if (error) throw error;
      
      // Get household details for each membership
      const households = [];
      for (const membership of data || []) {
        const household = await databaseService.getRecord('households', membership.household_id);
        if (household.data) {
          households.push({
            ...household.data,
            role: membership.role
          });
        }
      }
      
      return households;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return [];
  },

  // Get household with members
  async getHouseholdWithMembers(householdId: string) {
    try {
      const household = await databaseService.getRecord('households', householdId);
      if (!household.data) return null;

      const { data: members, error } = await databaseService.getRecords('family_members', { household_id: householdId });
      
      if (error) throw error;
      
      return {
        household: household.data,
        members: members || []
      };
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return null;
  },

  // Create new household
  async createHousehold(name: string, createdBy: string, description?: string) {
    try {
      const householdData = {
        name,
        description: description || '',
        created_by: createdBy
      };

      const household = await databaseService.createRecord('households', householdData);
      
      // Add creator as household owner
      const memberData = {
        household_id: household.data.id,
        user_id: createdBy,
        role: 'owner'
      };

      await databaseService.createRecord('family_members', memberData);
      
      return household.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  }
};

// HomeBuddy Task utilities
export const homebuddyTaskUtils = {
  // Get household tasks
  async getHouseholdTasks(householdId: string) {
    try {
      const { data, error } = await databaseService.getRecords('tasks', { household_id: householdId });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return [];
  },

  // Create new task
  async createTask(taskData: {
    household_id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    priority?: string;
    due_date?: string;
    created_by: string;
  }) {
    try {
      const task = await databaseService.createRecord('tasks', taskData);
      return task.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  },

  // Update task
  async updateTask(taskId: string, updates: any) {
    try {
      const task = await databaseService.updateRecord('tasks', taskId, updates);
      return task.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  },

  // Delete task
  async deleteTask(taskId: string) {
    try {
      await databaseService.deleteRecord('tasks', taskId);
    } catch (error) {
      handleHomeBuddyError(error);
    }
  }
};

// HomeBuddy Notification utilities
export const homebuddyNotificationUtils = {
  // Get user notifications
  async getUserNotifications(userId: string) {
    try {
      const { data, error } = await databaseService.getRecords('notifications', { user_id: userId });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return [];
  },

  // Create notification
  async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type?: string;
    household_id?: string;
  }) {
    try {
      const notification = await databaseService.createRecord('notifications', notificationData);
      return notification.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      const notification = await databaseService.updateRecord('notifications', notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      return notification.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  }
};

// HomeBuddy Settings utilities
export const homebuddySettingsUtils = {
  // Get user settings
  async getUserSettings(userId: string, householdId?: string) {
    try {
      const filters: any = { user_id: userId };
      if (householdId) {
        filters.household_id = householdId;
      }
      
      const { data, error } = await databaseService.getRecords('settings', filters);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return [];
  },

  // Update user setting
  async updateSetting(userId: string, settingKey: string, settingValue: any, householdId?: string) {
    try {
      const settingData = {
        user_id: userId,
        setting_key: settingKey,
        setting_value: settingValue
      };
      
      if (householdId) {
        settingData.household_id = householdId;
      }

      const setting = await databaseService.createRecord('settings', settingData);
      return setting.data;
    } catch (error) {
      handleHomeBuddyError(error);
    }
    return {};
  }
};

// Export all utilities
export const homebuddyUtils = {
  user: homebuddyUserUtils,
  household: homebuddyHouseholdUtils,
  task: homebuddyTaskUtils,
  notification: homebuddyNotificationUtils,
  settings: homebuddySettingsUtils
};

