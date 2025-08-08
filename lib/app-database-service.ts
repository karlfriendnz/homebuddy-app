import { SupabaseClient } from '@supabase/supabase-js';
import { createAppSupabaseClient, AppName } from './database-config';

// Generic database service for any app
export class AppDatabaseService {
  private supabase: SupabaseClient;
  private appName: AppName;

  constructor(appName: AppName) {
    this.supabase = createAppSupabaseClient(appName);
    this.appName = appName;
  }

  // Get the Supabase client
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Get app name
  getAppName(): AppName {
    return this.appName;
  }

  // Generic CRUD operations with app-specific table naming
  async createRecord(table: string, data: any) {
    const tableName = this.getTableName(table);
    return this.supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
  }

  async getRecord(table: string, id: string) {
    const tableName = this.getTableName(table);
    return this.supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
  }

  async getRecords(table: string, filters?: any, options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  }) {
    const tableName = this.getTableName(table);
    let query = this.supabase.from(tableName).select('*');

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply options
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      });
    }

    return query;
  }

  async updateRecord(table: string, id: string, data: any) {
    const tableName = this.getTableName(table);
    return this.supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
  }

  async deleteRecord(table: string, id: string) {
    const tableName = this.getTableName(table);
    return this.supabase
      .from(tableName)
      .delete()
      .eq('id', id);
  }

  // Get table name with app prefix
  private getTableName(table: string): string {
    return `${this.appName}_${table}`;
  }

  // App-specific methods can be added here
  // For example, HomeBuddy specific methods:
  async getHouseholds(userId: string) {
    return this.getRecords('households', { user_id: userId });
  }

  async createHousehold(data: { name: string; user_id: string }) {
    return this.createRecord('households', data);
  }

  // TaskMaster specific methods (for future use)
  async getProjects(userId: string) {
    return this.getRecords('projects', { user_id: userId });
  }

  // FinanceBuddy specific methods (for future use)
  async getAccounts(userId: string) {
    return this.getRecords('accounts', { user_id: userId });
  }
}

// Create service instances for each app
export const createHomeBuddyDatabaseService = () => {
  return new AppDatabaseService('homebuddy');
};

export const createTaskMasterDatabaseService = () => {
  return new AppDatabaseService('taskmaster');
};

export const createFinanceBuddyDatabaseService = () => {
  return new AppDatabaseService('financebuddy');
};

export const createHealthBuddyDatabaseService = () => {
  return new AppDatabaseService('healthbuddy');
};

// Default service for current app (HomeBuddy)
export const databaseService = createHomeBuddyDatabaseService();

