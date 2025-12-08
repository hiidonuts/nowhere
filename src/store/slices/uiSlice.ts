import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  showLoginModal: boolean;
  loginModalMode: 'login' | 'signup';
  showProfileModal: boolean;
  showResultsModal: boolean;
  isMapExpanded: boolean;
  currentTime: string;
  levelUpNotification: { show: boolean; newLevel: number } | null;
}

const initialState: UIState = {
  showLoginModal: false,
  loginModalMode: 'login',
  showProfileModal: false,
  showResultsModal: false,
  isMapExpanded: false,
  currentTime: new Date().toLocaleTimeString(),
  levelUpNotification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowLoginModal: (state, action: PayloadAction<boolean>) => {
      state.showLoginModal = action.payload;
    },
    setLoginModalMode: (state, action: PayloadAction<'login' | 'signup'>) => {
      state.loginModalMode = action.payload;
    },
    setShowProfileModal: (state, action: PayloadAction<boolean>) => {
      state.showProfileModal = action.payload;
    },
    setShowResultsModal: (state, action: PayloadAction<boolean>) => {
      state.showResultsModal = action.payload;
    },
    setMapExpanded: (state, action: PayloadAction<boolean>) => {
      state.isMapExpanded = action.payload;
    },
    updateTime: (state, action: PayloadAction<string>) => {
      state.currentTime = action.payload;
    },
    showLevelUpNotification: (state, action: PayloadAction<number>) => {
      state.levelUpNotification = { show: true, newLevel: action.payload };
    },
    hideLevelUpNotification: (state) => {
      state.levelUpNotification = null;
    },
  },
});

export const {
  setShowLoginModal,
  setLoginModalMode,
  setShowProfileModal,
  setShowResultsModal,
  setMapExpanded,
  updateTime,
  showLevelUpNotification,
  hideLevelUpNotification,
} = uiSlice.actions;

export default uiSlice.reducer;