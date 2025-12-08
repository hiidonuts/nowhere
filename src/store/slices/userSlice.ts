import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, Badge } from '../../types';
import { directAuthService } from '../../services/directAuthService';
import { getLevelFromXP } from '../../utils/gameUtils';
import { SessionManager } from '../../utils/sessionManager';
import { databaseService } from '../../services/databaseService';

// Async thunk for syncing user progress to database
export const syncUserProgressToDatabase = createAsyncThunk(
  'user/syncProgress',
  async ({ userId, xp, level }: { userId: string; xp: number; level: number }, { dispatch }) => {
    console.log('Redux Thunk: Starting database sync', { userId, xp, level });

    const accessToken = directAuthService.getCurrentAccessToken();
    console.log('Redux Thunk: Access token available:', !!accessToken);

    const result = await databaseService.syncUserProgress(userId, xp, level, accessToken || undefined);

    if (!result.success) {
      console.error('Redux Thunk: Failed to sync user progress to database:', result.error);
      console.error('Redux Thunk: Full error details:', result);
      // Detect JWT expired error and handle session clearing and login modal
      if (result.error && result.error.toLowerCase().includes('jwt expired')) {
        SessionManager.clearSession();
        dispatch(require('../store/slices/uiSlice').setShowLoginModal(true));
        dispatch(require('../store/slices/uiSlice').setLoginModalMode('login'));
      }
      // Don't throw error to avoid breaking the UI - just log the error
    } else {
      console.log('Redux Thunk: Successfully synced user progress to database');
      console.log('Redux Thunk: Synced data:', { userId, xp, level });
    }

    return result;
  }
);

const initialState: User = {
  id: '',
  username: 'Guest',
  email: '',
  level: 1,
  xp: 0,
  totalGames: 0,
  badges: [],
  isGuest: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<User>>) => {
      return { ...state, ...action.payload };
    },
    addXP: (state, action: PayloadAction<number>) => {
      state.xp += action.payload;
      const newLevel = getLevelFromXP(state.xp);
      if (newLevel > state.level) {
        state.level = newLevel;
      }
      // Update session storage if user is logged in
      if (!state.isGuest) {
        SessionManager.updateSessionUser({ xp: state.xp, level: state.level });
        // Note: Database sync will be handled by middleware or component
        // We can't dispatch async actions from reducers
      }
    },
    incrementGames: (state) => {
      state.totalGames += 1;
      // Update session storage if user is logged in
      if (!state.isGuest) {
        SessionManager.updateSessionUser({ totalGames: state.totalGames });
      }
    },
    addBadge: (state, action: PayloadAction<Badge>) => {
      const exists = state.badges.find(b => b.id === action.payload.id);
      if (!exists) {
        state.badges.push(action.payload);
      }
    },
    logout: () => {
      // Sign out from direct auth service and clear session
      directAuthService.signOut();
      SessionManager.clearSession();
      return { ...initialState };
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      Object.assign(state, action.payload);
      // Note: Profile updates would need to be implemented in directAuthService
      // For now, just update local state
    },
  },
});

export const { setUser, addXP, incrementGames, addBadge, logout, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;