import { supabase } from './supabase';
import type { User, Household, HouseholdMember } from './supabase';

// Error handling utility
export class SupabaseError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Handle Supabase errors
export const handleSupabaseError = (error: any): never => {
  // eslint-disable-next-line no-console
  console.error('Supabase Error:', error);
  
  if (error?.message) {
    throw new SupabaseError(
      error.message,
      error.status,
      error.details
    );
  }
  
  throw new SupabaseError('An unexpected error occurred');
};

// User utilities
export const userUtils = {
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
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
      handleSupabaseError(error);
    }
    return null; // This line will never be reached due to handleSupabaseError throwing
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
    return {} as User; // This line will never be reached due to handleSupabaseError throwing
  },

  // Update last active timestamp
  async updateLastActive(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
};

// Household utilities
export const householdUtils = {
  // Check if user has any households
  async userHasHousehold(userId: string): Promise<boolean> {
    try {
      // Validate user ID
      if (!userId || typeof userId !== 'string') {
        return false;
      }
      
      const { data, error } = await supabase
        .from('household_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      // Don't throw here, just return false to allow the app to continue
      return false;
    }
  },

  // Get user's households
  async getUserHouseholds(userId: string): Promise<Household[]> {
    try {
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          household_members!inner(user_id)
        `)
        .eq('household_members.user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error);
    }
    return []; // This line will never be reached due to handleSupabaseError throwing
  },

  // Get household with members
  async getHouseholdWithMembers(householdId: string): Promise<{
    household: Household;
    members: HouseholdMember[];
  } | null> {
    try {
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          household_members(
            *,
            users(*)
          )
        `)
        .eq('id', householdId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        household: data,
        members: data.household_members || []
      };
    } catch (error) {
      handleSupabaseError(error);
    }
    return null; // This line will never be reached due to handleSupabaseError throwing
  },

  // Create new household
  async createHousehold(
    name: string,
    createdBy: string,
    description?: string,
    settings?: any
  ): Promise<Household> {
    try {
      // Validate inputs
      if (!name || !createdBy) {
        throw new Error('Household name and creator are required');
      }
      
      const { data, error } = await supabase
        .from('households')
        .insert({
          name,
          description,
          settings,
          created_by: createdBy
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
    return {} as Household; // This line will never be reached due to handleSupabaseError throwing
  }
};

// Authentication utilities
export const authUtils = {
  // Check if user exists by email
  async checkUserExists(email: string): Promise<boolean> {
    try {
      // Use the sign-in method to check if user exists in Supabase Auth
      // This is the most reliable way to check user existence on the client side
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: 'dummy-password-for-check'
      });
      
      // If we get "Invalid login credentials", the user exists but password is wrong
      // If we get "User not found" or other errors, the user doesn't exist
      if (error?.message?.includes('Invalid login credentials')) {
        return true; // User exists
      } else {
        return false; // User doesn't exist
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking user existence:', error);
      return false;
    }
  },



  // Sign up with email
  async signUp(email: string, password: string, fullName: string): Promise<{
    user: any;
    session: any;
  }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
    return { user: null, session: null }; // This line will never be reached due to handleSupabaseError throwing
  },

  // Sign in with email
  async signIn(email: string, password: string): Promise<{
    user: any;
    session: any;
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
    return { user: null, session: null }; // This line will never be reached due to handleSupabaseError throwing
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
};

// Real-time subscription utilities
export const realtimeUtils = {
  // Subscribe to household changes
  subscribeToHousehold(
    householdId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'households',
          filter: `id=eq.${householdId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to tasks changes
  subscribeToTasks(
    householdId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`tasks:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${householdId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to events changes
  subscribeToEvents(
    householdId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`events:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `household_id=eq.${householdId}`
        },
        callback
      )
      .subscribe();
  }
};

// Database utilities
export const dbUtils = {
  // Generic insert function
  async insert<T extends keyof any>(
    table: T,
    data: any
  ): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(table as string)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  // Generic update function
  async update<T extends keyof any>(
    table: T,
    id: string,
    data: any
  ): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(table as string)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  // Generic delete function
  async delete<T extends keyof any>(
    table: T,
    id: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(table as string)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  // Generic select function
  async select<T extends keyof any>(
    table: T,
    query?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      let queryBuilder = supabase.from(table as string).select(query?.select || '*');
      
      if (query?.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }
      
      if (query?.orderBy) {
        queryBuilder = queryBuilder.order(query.orderBy.column, {
          ascending: query.orderBy.ascending ?? true
        });
      }
      
      if (query?.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error);
    }
    return []; // This line will never be reached due to handleSupabaseError throwing
  }
}; 