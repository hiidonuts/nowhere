import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Location, GameResult } from '../../types';

const initialState: GameState = {
  currentRound: 1,
  totalRounds: 0, // Infinite rounds
  currentLocation: null,
  userGuess: null,
  score: 0,
  roundScore: 0,
  gameStatus: 'waiting',
  streetViewLoaded: false,
  locationTrigger: 0, // Counter to trigger new location loads
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.streetViewLoaded = true;
    },
    setUserGuess: (state, action: PayloadAction<Location>) => {
      state.userGuess = action.payload;
    },
    setGameStatus: (state, action: PayloadAction<GameState['gameStatus']>) => {
      state.gameStatus = action.payload;
    },
    addScore: (state, action: PayloadAction<number>) => {
      state.roundScore = action.payload;
      state.score += action.payload;
    },
    nextRound: (state) => {
      console.log('nextRound action called, moving from round', state.currentRound, 'to', state.currentRound + 1);
      state.currentRound += 1;
      state.userGuess = null;
      state.currentLocation = null; // Reset current location for new round
      state.roundScore = 0;
      state.streetViewLoaded = false;
      state.gameStatus = 'waiting'; // Reset to waiting to trigger fresh initialization
      state.locationTrigger += 1; // Increment trigger to force new location load
      console.log('nextRound action completed, new round:', state.currentRound, 'streetViewLoaded:', state.streetViewLoaded, 'locationTrigger:', state.locationTrigger);
    },
    unlockLocation: (state) => {
      // Action to signal that location can be unlocked (when guess is submitted)
      console.log('Location unlock signal sent');
    },
    resetGame: (state) => {
      return { ...initialState };
    },
  },
});

export const {
  setCurrentLocation,
  setUserGuess,
  setGameStatus,
  addScore,
  nextRound,
  unlockLocation,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;