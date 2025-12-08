import { useEffect, useRef } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import Navbar from './components/Navbar';
import GameInterface from './components/GameInterface';
import LoginModal from './components/LoginModal';
import ResultsModal from './components/ResultsModal';

import { socketService } from './services/socketService';
import { SessionManager } from './utils/sessionManager';
import { directAuthService } from './services/directAuthService';

import { setUser, logout } from './store/slices/userSlice';

// Inner component that has access to Redux dispatch
const AppContent = () => {
  const dispatch = useDispatch();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Check for existing session on app startup
    const existingUser = SessionManager.getSession();
    if (existingUser) {
      // User has a valid session, restore their login state
      dispatch(setUser(existingUser));

      // Also restore the access token for database operations
      const accessToken = SessionManager.getAccessToken();
      if (accessToken) {
        directAuthService.setAccessToken(accessToken);
        console.log('Restored user session with access token:', existingUser.username);
      } else {
        console.log('Restored user session without access token:', existingUser.username);
      }
    } else {
      // No valid session, initialize as guest
      dispatch(setUser({
        id: '',
        username: 'Guest',
        email: '',
        level: 1,
        xp: 0,
        totalGames: 0,
        badges: [],
        isGuest: true,
      }));
    }

    // Set up periodic session validation (check every 5 minutes)
    sessionCheckInterval.current = setInterval(() => {
      const currentUser = SessionManager.getSession();
      if (!currentUser) {
        // Session has expired, log out the user
        console.log('Session expired, logging out user');
        dispatch(logout());
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      socketService.disconnect();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      <Navbar />
      <GameInterface />
      <LoginModal />
      <ResultsModal />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;