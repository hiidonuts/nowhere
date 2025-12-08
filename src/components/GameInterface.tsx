import { useEffect, useState, FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Maximize2, Minimize2, Target, Send } from 'lucide-react';
import type { AppDispatch } from '../store';
import StreetView from './StreetView';
import GameMapSimple from './GameMapSimple';
import ResultsMap from './ResultsMap';
import LevelUpNotification from './LevelUpNotification';


import { RootState } from '../store';
import { addScore, nextRound } from '../store/slices/gameSlice';
import { addXP, syncUserProgressToDatabase } from '../store/slices/userSlice';
import { setMapExpanded, showLevelUpNotification } from '../store/slices/uiSlice';
import { calculateDistance, calculateScore, calculateXP, getLevelFromXP } from '../utils/gameUtils';

const GameInterface: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentRound, userGuess, currentLocation, streetViewLoaded } = useSelector((state: RootState) => state.game);
  const { isMapExpanded } = useSelector((state: RootState) => state.ui);
  const user = useSelector((state: RootState) => state.user);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [isMinimapEnlarged, setIsMinimapEnlarged] = useState(false);
  const [showResultsMap, setShowResultsMap] = useState(false);
  const [submittedLocation, setSubmittedLocation] = useState<any>(null);

  const toggleMapSize = () => {
    dispatch(setMapExpanded(!isMapExpanded));
  };

  const handleMinimapEnlarge = () => {
    setIsMinimapEnlarged(true);
  };

  const handleMinimapShrink = () => {
    setIsMinimapEnlarged(false);
  };



  const handleSubmitGuess = () => {
    if (!userGuess || !currentLocation) return;

    setSubmittedLocation({
      ...currentLocation,
      timestamp: new Date().toISOString()
    });

    const distance = calculateDistance(currentLocation, userGuess);
    const roundScore = calculateScore(distance);
    const xpGained = calculateXP(roundScore, distance);

    // Only add score and XP for logged-in users
    if (!user.isGuest) {
      const currentLevel = user.level;
      const newXP = user.xp + xpGained;
      const newLevel = getLevelFromXP(newXP);

      dispatch(addScore(roundScore));

      // Sync progress to database first
      dispatch(syncUserProgressToDatabase({
        userId: user.id,
        xp: newXP,
        level: newLevel
      })).then((result: any) => {
        if (result.payload && result.payload.success && result.payload.data) {
          // Only update Redux state if DB update succeeded
          dispatch(addXP(xpGained));
          if (newLevel > currentLevel) {
            setTimeout(() => {
              dispatch(showLevelUpNotification(newLevel));
            }, 500);
          }
        } else {
          // Optionally show error to user
          console.error('Failed to sync XP/level to DB:', result.payload?.error);
        }
      });
    }

    setShowResultsMap(true);
  };

  const handleCloseResults = () => {
    console.log('Closing results map...');
    setShowResultsMap(false);

    // Move to next round after closing results (infinite gameplay)
    setTimeout(() => {
      console.log('Dispatching nextRound action...');
      dispatch(nextRound());
    }, 100); // Reduced delay for faster transitions
  };

  // Show submit button when user places a guess
  useEffect(() => {
    setShowSubmitButton(!!userGuess);
  }, [userGuess]);

  // Reset results map when round changes
  useEffect(() => {
    setShowResultsMap(false);
    setSubmittedLocation(null); // Reset submitted location for new round
  }, [currentRound]);

  // Debug panel removed

  return (
    <div className="h-screen relative" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Full Screen Street View - Account for navbar height */}
      <div className="absolute inset-0 top-12" style={{ height: 'calc(100vh - 48px)' }}>
        <StreetView />
      </div>

      {!isMapExpanded && streetViewLoaded && (
        <div className="absolute bottom-4 right-4 z-20">
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: isMinimapEnlarged ? '600px' : '400px',
              height: isMinimapEnlarged ? '500px' : '300px'
            }}
            onMouseLeave={handleMinimapShrink}
          >
            {/* Map Container */}
            <div className="h-full relative">
              <GameMapSimple />

              {/* Expand Button */}
              <button
                onClick={handleMinimapEnlarge}
                className="absolute top-2 right-2 bg-gray-800/90 hover:bg-gray-700 text-white p-1 rounded shadow-md transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Submit Button - Only show when guess is made */}
              {showSubmitButton && (
                <button
                  onClick={handleSubmitGuess}
                  className="absolute bottom-2 left-2 right-2 bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  GUESS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Map - Full Screen */}
      {showResultsMap && (
        <ResultsMap onClose={handleCloseResults} />
      )}

      {/* Level Up Notification */}
      <LevelUpNotification />

    </div>
  );
};

export default GameInterface;
