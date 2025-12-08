import { config } from '../config';
import { User } from '../types';
import { SessionManager } from '../utils/sessionManager';

// Store access token for database operations
let currentAccessToken: string | null = null;

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string; // Can be email or username
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class DirectAuthService {
  private baseUrl = config.supabase.url;
  private apiKey = config.supabase.anonKey;

  /**
   * Sign up a new user using direct fetch
   */
  async signUp({ email, password, username }: SignUpData): Promise<AuthResponse> {
    try {

      // Step 1: Check if username is already taken
      const usernameCheckResponse = await fetch(`${this.baseUrl}/rest/v1/users?username=eq.${username}&select=username`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (usernameCheckResponse.ok) {
        const existingUsers = await usernameCheckResponse.json();
        if (existingUsers.length > 0) {
          return {
            success: false,
            error: 'Username is already taken'
          };
        }
      }

      // Step 2: Sign up with Supabase Auth
      const signupResponse = await fetch(`${this.baseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          email,
          password,
          data: { username }
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        return {
          success: false,
          error: errorData.error_description || errorData.msg || 'Signup failed'
        };
      }

      const signupData = await signupResponse.json();

      // Step 3: Create user profile in database
      const profileResponse = await fetch(`${this.baseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${signupData.access_token || this.apiKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: signupData.user.id,
          username,
          email,
          level: 1,
          xp: 0,
          achievements: []
        }),
        signal: AbortSignal.timeout(15000)
      });

      let profileData = null;
      if (profileResponse.ok) {
        const profiles = await profileResponse.json();
        profileData = profiles[0];
      }

      // Step 4: Return success
      const user: User = {
        id: signupData.user.id,
        username: username,
        email: email,
        level: profileData?.level || 1,
        xp: profileData?.xp || 0,
        totalGames: 0,
        badges: [],
        isGuest: false
      };

      // Store access token for database operations
      currentAccessToken = signupData.access_token;
      console.log('DirectAuth: Stored access token for signup:', !!currentAccessToken);

      // Save session for 24-hour persistence
      SessionManager.saveSession(user, currentAccessToken);

      return {
        success: true,
        user
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Sign in an existing user using direct fetch
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      let actualEmail = email;

      // If the input doesn't contain @, treat it as a username and look up the email
      if (!email.includes('@')) {
        const userLookupResponse = await fetch(`${this.baseUrl}/rest/v1/users?username=eq.${email}&select=email`, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (userLookupResponse.ok) {
          const users = await userLookupResponse.json();
          if (users.length === 0) {
            return {
              success: false,
              error: 'Invalid username or password'
            };
          }
          actualEmail = users[0].email;
        } else {
          return {
            success: false,
            error: 'Invalid username or password'
          };
        }
      }

      // Sign in with Supabase Auth
      const signinResponse = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          email: actualEmail,
          password
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!signinResponse.ok) {
        const errorData = await signinResponse.json();
        return {
          success: false,
          error: errorData.error_description || errorData.msg || 'Invalid email or password'
        };
      }

      const signinData = await signinResponse.json();

      // Get user profile from database
      const profileResponse = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${signinData.user.id}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${signinData.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      let profileData = null;
      if (profileResponse.ok) {
        const profiles = await profileResponse.json();
        profileData = profiles[0];
      }

      // Create user object
      const user: User = {
        id: signinData.user.id,
        username: profileData?.username || signinData.user.user_metadata?.username || 'User',
        email: signinData.user.email || '',
        level: profileData?.level || 1,
        xp: profileData?.xp || 0,
        totalGames: 0,
        badges: [],
        isGuest: false
      };

      // Store access token for database operations
      currentAccessToken = signinData.access_token;
      console.log('DirectAuth: Stored access token for signin:', !!currentAccessToken);

      // Save session for 24-hour persistence
      SessionManager.saveSession(user, currentAccessToken);

      return {
        success: true,
        user
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear the session from localStorage and access token
      SessionManager.clearSession();
      currentAccessToken = null;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Check if there's a valid existing session
   */
  getStoredSession(): User | null {
    return SessionManager.getSession();
  }

  /**
   * Update user data in the stored session
   */
  updateStoredUser(updatedUser: Partial<User>): boolean {
    return SessionManager.updateSessionUser(updatedUser);
  }

  /**
   * Get current access token for database operations
   */
  getCurrentAccessToken(): string | null {
    // If no current token, try to get from session
    if (!currentAccessToken) {
      const sessionToken = SessionManager.getAccessToken();
      if (sessionToken) {
        currentAccessToken = sessionToken;
        console.log('DirectAuth: Retrieved access token from session');
      }
    }

    console.log('DirectAuth: Getting access token:', !!currentAccessToken);
    return currentAccessToken;
  }

  /**
   * Set access token (for session restoration)
   */
  setAccessToken(token: string | null): void {
    currentAccessToken = token;
    console.log('DirectAuth: Set access token:', !!currentAccessToken);
  }
}

export const directAuthService = new DirectAuthService();
