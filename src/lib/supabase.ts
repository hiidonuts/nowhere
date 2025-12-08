import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Database types for TypeScript - Updated to match exact schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          created_at: string;
          level: number;
          xp: number;
          achievements: string[] | null;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          created_at?: string;
          level?: number;
          xp?: number;
          achievements?: string[] | null;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          created_at?: string;
          level?: number;
          xp?: number;
          achievements?: string[] | null;
        };
      };
    };
  };
}

// Type the supabase client
export type SupabaseClient = typeof supabase;
