import { User } from '../types';

interface SessionData {
  user: User;
  loginTime: number;
  expiresAt: number;
  accessToken?: string;
}

const SESSION_KEY = 'geoguessr_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class SessionManager {
  /**
   * Save user session to localStorage with 24-hour expiration
   */
  static saveSession(user: User, accessToken?: string): void {
    const now = Date.now();
    const sessionData: SessionData = {
      user,
      loginTime: now,
      expiresAt: now + SESSION_DURATION,
      accessToken
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  /**
   * Get current session if it exists and hasn't expired
   */
  static getSession(): User | null {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (!sessionJson) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const now = Date.now();

      // Check if session has expired
      if (now > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      return sessionData.user;
    } catch (error) {
      console.warn('Failed to retrieve session from localStorage:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if current session is valid (exists and not expired)
   */
  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Get time remaining in current session (in milliseconds)
   */
  static getTimeRemaining(): number {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (!sessionJson) {
        return 0;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const now = Date.now();
      
      return Math.max(0, sessionData.expiresAt - now);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear the current session
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }

  /**
   * Extend current session by another 24 hours (useful for activity-based renewal)
   */
  static extendSession(): boolean {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (!sessionJson) {
        return false;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const now = Date.now();

      // Only extend if current session is still valid
      if (now <= sessionData.expiresAt) {
        sessionData.expiresAt = now + SESSION_DURATION;
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Update user data in current session (for XP, level changes, etc.)
   */
  static updateSessionUser(updatedUser: Partial<User>): boolean {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (!sessionJson) {
        return false;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const now = Date.now();

      // Only update if session is still valid
      if (now <= sessionData.expiresAt) {
        sessionData.user = { ...sessionData.user, ...updatedUser };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to update session user:', error);
      return false;
    }
  }

  /**
   * Get access token from current session
   */
  static getAccessToken(): string | null {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (!sessionJson) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const now = Date.now();

      // Check if session has expired
      if (now > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      return sessionData.accessToken || null;
    } catch (error) {
      console.warn('Failed to retrieve access token from session:', error);
      return null;
    }
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): { isValid: boolean; timeRemaining: string; user?: User } {
    const user = this.getSession();
    const timeRemaining = this.getTimeRemaining();

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isValid: user !== null,
      timeRemaining: `${hours}h ${minutes}m`,
      user: user || undefined
    };
  }
}
