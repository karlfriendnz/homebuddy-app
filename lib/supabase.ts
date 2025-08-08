import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create platform-specific storage adapter
const storage = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    } else {
      return AsyncStorage.getItem(key);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    } else {
      return AsyncStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    } else {
      return AsyncStorage.removeItem(key);
    }
  }
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': `homebuddy-${Platform.OS}`,
    },
  },
});

// Export types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          invite_code_used: string | null;
          email_verified: boolean;
          last_active_at: string;
          is_active: boolean;
          notification_preferences: any;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          invite_code_used?: string | null;
          email_verified?: boolean;
          last_active_at?: string;
          is_active?: boolean;
          notification_preferences?: any;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          invite_code_used?: string | null;
          email_verified?: boolean;
          last_active_at?: string;
          is_active?: boolean;
          notification_preferences?: any;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          settings: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          household_type: string | null;
          image_url: string | null;
          onboarding_completed: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          settings?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          household_type?: string | null;
          image_url?: string | null;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          settings?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          household_type?: string | null;
          image_url?: string | null;
          onboarding_completed?: boolean;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: 'admin' | 'adult' | 'teen' | 'child';
          invited_by: string | null;
          invite_accepted_at: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: 'admin' | 'adult' | 'teen' | 'child';
          invited_by?: string | null;
          invite_accepted_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: 'admin' | 'adult' | 'teen' | 'child';
          invited_by?: string | null;
          invite_accepted_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          room_type: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          room_type?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          description?: string | null;
          room_type?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          household_id: string;
          room_id: string | null;
          assigned_to: string | null;
          created_by: string;
          title: string;
          description: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          due_date: string | null;
          completed_at: string | null;
          points: number;
          recurrence_pattern: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          room_id?: string | null;
          assigned_to?: string | null;
          created_by: string;
          title: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          completed_at?: string | null;
          points?: number;
          recurrence_pattern?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          room_id?: string | null;
          assigned_to?: string | null;
          created_by?: string;
          title?: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          completed_at?: string | null;
          points?: number;
          recurrence_pattern?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          event_type: string;
          recurrence_pattern: any;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          event_type?: string;
          recurrence_pattern?: any;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          event_type?: string;
          recurrence_pattern?: any;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shop_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          country: string;
          template_data: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          country: string;
          template_data: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          country?: string;
          template_data?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_trips: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          shop_date: string;
          estimated_cost: number | null;
          actual_cost: number | null;
          payment_method: string | null;
          receipt_url: string | null;
          shop_location: string | null;
          status: string;
          template_id: string | null;
          created_by: string;
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          shop_date: string;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          payment_method?: string | null;
          receipt_url?: string | null;
          shop_location?: string | null;
          status?: string;
          template_id?: string | null;
          created_by: string;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          description?: string | null;
          shop_date?: string;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          payment_method?: string | null;
          receipt_url?: string | null;
          shop_location?: string | null;
          status?: string;
          template_id?: string | null;
          created_by?: string;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_items: {
        Row: {
          id: string;
          shopping_trip_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          price: number | null;
          category_id: string | null;
          notes: string | null;
          is_completed: boolean;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shopping_trip_id: string;
          name: string;
          quantity?: number;
          unit?: string | null;
          price?: number | null;
          category_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shopping_trip_id?: string;
          name?: string;
          quantity?: number;
          unit?: string | null;
          price?: number | null;
          category_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          total_points: number;
          level: number;
          experience_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          total_points?: number;
          level?: number;
          experience_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          total_points?: number;
          level?: number;
          experience_points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      points_transactions: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty' | 'adjustment';
          amount: number;
          description: string;
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty' | 'adjustment';
          amount: number;
          description: string;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          transaction_type?: 'earned' | 'spent' | 'bonus' | 'penalty' | 'adjustment';
          amount?: number;
          description?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          streak_type: string;
          current_streak: number;
          longest_streak: number;
          last_completion_date: string | null;
          start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          streak_type: string;
          current_streak?: number;
          longest_streak?: number;
          last_completion_date?: string | null;
          start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          streak_type?: string;
          current_streak?: number;
          longest_streak?: number;
          last_completion_date?: string | null;
          start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string | null;
          reward_type: 'physical' | 'digital' | 'experience' | 'privilege';
          points_cost: number;
          max_redemptions_per_user: number | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string | null;
          reward_type?: 'physical' | 'digital' | 'experience' | 'privilege';
          points_cost: number;
          max_redemptions_per_user?: number | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          description?: string | null;
          reward_type?: 'physical' | 'digital' | 'experience' | 'privilege';
          points_cost?: number;
          max_redemptions_per_user?: number | null;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reward_redemptions: {
        Row: {
          id: string;
          user_id: string;
          reward_id: string;
          household_id: string;
          points_spent: number;
          status: 'pending' | 'approved' | 'rejected' | 'completed';
          approved_by: string | null;
          approved_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_id: string;
          household_id: string;
          points_spent: number;
          status?: 'pending' | 'approved' | 'rejected' | 'completed';
          approved_by?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reward_id?: string;
          household_id?: string;
          points_spent?: number;
          status?: 'pending' | 'approved' | 'rejected' | 'completed';
          approved_by?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      push_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          data: any;
          status: 'pending' | 'sent' | 'delivered' | 'failed';
          device_token: string | null;
          platform: string | null;
          priority: string;
          expiration_time: string | null;
          delivery_attempts: number;
          last_attempt_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          data?: any;
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          device_token?: string | null;
          platform?: string | null;
          priority?: string;
          expiration_time?: string | null;
          delivery_attempts?: number;
          last_attempt_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          data?: any;
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          device_token?: string | null;
          platform?: string | null;
          priority?: string;
          expiration_time?: string | null;
          delivery_attempts?: number;
          last_attempt_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Export specific table types
export type User = Tables<'users'>;
export type Household = Tables<'households'>;
export type HouseholdMember = Tables<'household_members'>;
export type Room = Tables<'rooms'>;
export type Task = Tables<'tasks'>;
export type Event = Tables<'events'>;
export type ShopTemplate = Tables<'shop_templates'>;
export type ShoppingTrip = Tables<'shopping_trips'>;
export type ShoppingItem = Tables<'shopping_items'>;
export type UserPoints = Tables<'user_points'>;
export type PointsTransaction = Tables<'points_transactions'>;
export type Streak = Tables<'streaks'>;
export type Reward = Tables<'rewards'>;
export type RewardRedemption = Tables<'reward_redemptions'>;
export type PushNotification = Tables<'push_notifications'>; 