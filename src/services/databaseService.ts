import { config } from '../config';
import { User } from '../types';

export interface UserProfileUpdate {
  level?: number;
  xp?: number;
  achievements?: string[];
}

export interface DatabaseResponse {
  success: boolean;
  error?: string;
  data?: any;
}

class DatabaseService {
  private baseUrl = config.supabase.url;
  private apiKey = config.supabase.anonKey;

  /**
   * Update user profile in the database
   */
  async updateUserProfile(userId: string, updates: UserProfileUpdate, accessToken?: string): Promise<DatabaseResponse> {
    try {
      console.log('Database Service: Updating user profile', { userId, updates, hasToken: !!accessToken });
      console.log('Database Service: Full URL:', `${this.baseUrl}/rest/v1/users?id=eq.${userId}`);
      console.log('Database Service: Updates payload:', JSON.stringify(updates));

      const response = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${accessToken || this.apiKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(10000)
      });

      console.log('Database Service: Response status', response.status);
      console.log('Database Service: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Database Service: Update failed - Raw response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        return {
          success: false,
          error: errorData.message || errorData.error_description || `HTTP ${response.status}: Failed to update profile`
        };
      }

      const data = await response.json();
      console.log('Database Service: Update successful', data);
      console.log('Database Service: Updated rows count:', Array.isArray(data) ? data.length : 'Unknown');

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Database Service: Exception occurred', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string, accessToken?: string): Promise<DatabaseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${accessToken || this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error_description || 'Failed to get profile'
        };
      }

      const profiles = await response.json();
      return {
        success: true,
        data: profiles[0] || null
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Sync user XP and level to database
   * This is the main method we'll use for game progress updates
   */
  async syncUserProgress(userId: string, xp: number, level: number, accessToken?: string): Promise<DatabaseResponse> {
    console.log(`DatabaseService: Syncing user progress - User: ${userId}, XP: ${xp}, Level: ${level}`);
    const result = await this.updateUserProfile(userId, { xp, level }, accessToken);

    if (result.success) {
      console.log(`DatabaseService: Successfully synced XP: ${xp}, Level: ${level}`);
    } else {
      console.error(`DatabaseService: Failed to sync progress:`, result.error);
    }

    return result;
  }

  /**
   * Batch update multiple user fields
   */
  async batchUpdateUser(userId: string, updates: Partial<User>, accessToken?: string): Promise<DatabaseResponse> {
    const dbUpdates: UserProfileUpdate = {};
    
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.badges !== undefined) {
      // Convert badges to achievements array (simplified)
      dbUpdates.achievements = updates.badges.map(badge => badge.id);
    }

    return this.updateUserProfile(userId, dbUpdates, accessToken);
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<DatabaseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/users?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : 'Database connection failed'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

export const databaseService = new DatabaseService();
