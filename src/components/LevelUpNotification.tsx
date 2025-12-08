import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trophy, X } from 'lucide-react';
import { RootState } from '../store';
import { hideLevelUpNotification } from '../store/slices/uiSlice';

const LevelUpNotification: React.FC = () => {
  const dispatch = useDispatch();
  const { levelUpNotification } = useSelector((state: RootState) => state.ui);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (levelUpNotification?.show) {
      // Gentle slide-in animation
      setTimeout(() => setIsVisible(true), 100);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => dispatch(hideLevelUpNotification()), 300);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [levelUpNotification, dispatch]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => dispatch(hideLevelUpNotification()), 300);
  };

  if (!levelUpNotification?.show) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div
        className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg p-4 max-w-sm pointer-events-auto transform transition-all duration-300 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Trophy className="w-8 h-8 text-yellow-200" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-lg">Level Up!</h3>
            <p className="text-sm text-yellow-100">
              You reached level {levelUpNotification.newLevel}!
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-yellow-200 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpNotification;
