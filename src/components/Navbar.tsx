import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, LogIn, Trophy, Menu, X, Compass, Award, LogOut } from 'lucide-react';
import { RootState } from '../store';
import { setShowLoginModal, setLoginModalMode, setShowProfileModal, updateTime } from '../store/slices/uiSlice';
import { logout } from '../store/slices/userSlice';
import { getXPProgressInLevel } from '../utils/gameUtils';

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
  }, [user.id, user.isGuest, user.level, user.xp]);
  useSelector((state: RootState) => state.ui);
  const { score } = useSelector((state: RootState) => state.game);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCompassDropdown, setShowCompassDropdown] = useState(false);
  const [isCompassAnimating, setIsCompassAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(updateTime(new Date().toLocaleTimeString()));
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showCompassDropdown && !target.closest('.compass-dropdown-container')) {
        setShowCompassDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCompassDropdown]);

  const handleAuthClick = () => {
    dispatch(setLoginModalMode('login'));
    dispatch(setShowLoginModal(true));
  };

  const handleProfileClick = () => {
    dispatch(setShowProfileModal(true));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCompassClick = () => {
    setIsCompassAnimating(true);
    setShowCompassDropdown(!showCompassDropdown);

    // Reset animation after it completes
    setTimeout(() => {
      setIsCompassAnimating(false);
    }, 500);
  };

  const handleAchievementsClick = () => {
    setShowCompassDropdown(false);
    // TODO: Implement achievements functionality
    console.log('Achievements clicked');
  };

  const handleLeaderboardClick = () => {
    setShowCompassDropdown(false);
    // TODO: Implement leaderboard functionality
    console.log('Leaderboard clicked');
  };

  return isCollapsed ? (
    // Collapsed navbar - just hamburger menu
    <nav className="fixed top-4 left-4 z-50">
      <button
        onClick={() => setIsCollapsed(false)}
        className="backdrop-blur-sm text-white p-2 rounded shadow-lg transition-colors"
        style={{
          backgroundColor: '#0A0A0A'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0A0A0A'}
      >
        <Menu className="w-5 h-5" />
      </button>
    </nav>
  ) : (
    // Full navbar - WhereDis style
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left - Logo */}
          <div className="flex items-center relative compass-dropdown-container">
            <button
              onClick={handleCompassClick}
              className="mr-3 p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <Compass
                className={`w-6 h-6 transition-transform duration-500 ${
                  isCompassAnimating ? 'rotate-180' : ''
                }`}
                style={{ color: '#FF3366' }}
              />
            </button>
            <div className="text-lg font-bold text-white">
              NO<span style={{ color: '#FF3366' }}>WHERE</span>
            </div>

            {/* Compass Dropdown */}
            {showCompassDropdown && (
              <div
                className="absolute top-full left-0 mt-2 w-48 border border-gray-600 rounded-lg shadow-lg z-50"
                style={{ backgroundColor: '#0A0A0A' }}
              >
                <div className="py-2">
                  <button
                    onClick={handleAchievementsClick}
                    className="w-full px-4 py-2 text-left text-white transition-colors flex items-center space-x-2"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Achievements</span>
                  </button>
                  <button
                    onClick={handleLeaderboardClick}
                    className="w-full px-4 py-2 text-left text-white transition-colors flex items-center space-x-2"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Award className="w-4 h-4" />
                    <span>Leaderboard</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center - Game Info */}
          <div className="flex items-center space-x-6">
            {/* Level Bar */}
            <div className="flex items-center space-x-3">
              <div className="text-white text-sm">
                <span className="text-gray-300">LEVEL</span>
                <span className="ml-2 font-bold text-blue-400">
                  {user.isGuest ? 1 : user.level}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(() => {
                        if (user.isGuest) return 0;
                        const progress = getXPProgressInLevel(user.xp);
                        return (progress.current / progress.required) * 100;
                      })()}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(() => {
                    if (user.isGuest) {
                      return "Sign in to track XP";
                    }
                    const progress = getXPProgressInLevel(user.xp);
                    return `${progress.current}/${progress.required} XP`;
                  })()}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-white text-sm">
              <span className="text-gray-300">SCORE</span>
              <span className="ml-2 font-bold text-yellow-400">
                {user.isGuest ? "0" : score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center space-x-2">
            {user.isGuest ? (
              <button
                onClick={handleAuthClick}
                className="text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: '#FF3366'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E02E5A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF3366'}
              >
                SIGN IN / SIGN UP
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-300" />
                  <span className="text-sm font-medium text-white">{user.username}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;