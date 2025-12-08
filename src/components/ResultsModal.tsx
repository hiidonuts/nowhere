import { FC, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, MapPin, Trophy, Target } from 'lucide-react';
import { RootState } from '../store';
import { setShowResultsModal } from '../store/slices/uiSlice';
import { calculateDistance, calculateScore, calculateXP } from '../utils/gameUtils';

const ResultsModal: FC = () => {
  const dispatch = useDispatch();
  const { showResultsModal } = useSelector((state: RootState) => state.ui);
  const { currentLocation, userGuess } = useSelector((state: RootState) => state.game);
  const user = useSelector((state: RootState) => state.user);

  if (!showResultsModal || !currentLocation || !userGuess) return null;

  const distance = calculateDistance(currentLocation, userGuess);
  const score = calculateScore(distance);
  const xp = calculateXP(score, distance);

  const handleClose = () => {
    dispatch(setShowResultsModal(false));
  };

  // Auto-close modal after 4 seconds to prevent stale state
  useEffect(() => {
    if (showResultsModal) {
      const timer = setTimeout(() => {
        dispatch(setShowResultsModal(false));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showResultsModal, dispatch]);

  const getScoreColor = (score: number) => {
    if (score >= 4000) return 'text-green-400';
    if (score >= 2000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Game Results</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score)} mb-2`}>
              {score.toLocaleString()}
            </div>
            <p className="text-gray-400">Points</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-white font-semibold">
                {distance.toFixed(0)} km
              </div>
              <p className="text-gray-400 text-sm">Distance</p>
            </div>

            {!user.isGuest ? (
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-white font-semibold">+{xp} XP</div>
                <p className="text-gray-400 text-sm">Experience</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-orange-400 font-semibold">Sign in to earn XP</div>
                <p className="text-gray-400 text-sm">Progress not saved</p>
              </div>
            )}
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-white font-medium">Your Guess</span>
              </div>
              <p className="text-gray-400 text-sm">
                {userGuess.lat.toFixed(4)}°, {userGuess.lng.toFixed(4)}°
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>

          {/* Accuracy rating */}
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              {distance < 50 ? 'Excellent!' : 
               distance < 500 ? 'Good!' : 
               distance < 2000 ? 'Not bad!' : 
               'Better luck next time!'}
            </div>
            <p className="text-gray-400 text-sm">
              {distance < 50 ? 'Amazing precision!' : 
               distance < 500 ? 'You were close!' : 
               distance < 2000 ? 'Keep practicing!' : 
               'Geography is challenging!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;