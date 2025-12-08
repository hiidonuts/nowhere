export interface Location {
  lat: number;
  lng: number;
  country?: string;
  region?: string;
}

export interface GameState {
  currentRound: number;
  totalRounds: number;
  currentLocation: Location | null;
  userGuess: Location | null;
  score: number;
  roundScore: number;
  gameStatus: 'waiting' | 'playing' | 'guessing' | 'results';
  streetViewLoaded: boolean;
  locationTrigger: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  totalGames: number;
  badges: Badge[];
  isGuest: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
}

export interface GameResult {
  round: number;
  actualLocation: Location;
  guessLocation: Location;
  distance: number;
  score: number;
}

export interface SocketData {
  type: 'location' | 'guess' | 'result' | 'join' | 'leave';
  payload: any;
}