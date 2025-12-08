import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, User, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { RootState } from '../store';
import { setShowLoginModal } from '../store/slices/uiSlice';
import { setUser } from '../store/slices/userSlice';
import { directAuthService } from '../services/directAuthService';

const LoginModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showLoginModal, loginModalMode } = useSelector((state: RootState) => state.ui);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Set isSignUp based on modal mode when modal opens
  useEffect(() => {
    if (showLoginModal) {
      setIsSignUp(loginModalMode === 'signup');
      setError('');
      setShowPassword(false);
      setFormData({ username: '', email: '', password: '' });
    }
  }, [showLoginModal, loginModalMode]);

  if (!showLoginModal) return null;

  const handleClose = () => {
    dispatch(setShowLoginModal(false));
    setError('');
    setShowPassword(false);
    setFormData({ username: '', email: '', password: '' });
  };

  const validateForm = () => {
    if (isSignUp) {
      // Sign up validation
      if (!formData.username.trim()) {
        setError('Username is required');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    } else {
      // Login validation
      if (!formData.email.trim()) {
        setError('Email or username is required');
        return false;
      }
      if (!formData.password.trim()) {
        setError('Password is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('Request timed out. Please try again.');
      setIsLoading(false);
    }, 30000);

    try {

      const authPromise = isSignUp ?
        directAuthService.signUp({
          email: formData.email.trim(),
          password: formData.password,
          username: formData.username.trim()
        }) :
        directAuthService.signIn({
          email: formData.email.trim(),
          password: formData.password
        });

      const result = await authPromise;
      clearTimeout(timeoutId);

      if (result.success && result.user) {
        dispatch(setUser(result.user));
        dispatch(setShowLoginModal(false));
        setFormData({ username: '', email: '', password: '' });
      } else {
        // Handle specific errors
        if (isSignUp) {
          if (result.error?.includes('already registered')) {
            setError('This email is already registered. Please try logging in instead.');
          } else if (result.error?.includes('Username is already taken')) {
            setError('This username is already taken. Please choose a different one.');
          } else if (result.error?.includes('Account created but profile setup failed') ||
                     result.error?.includes('Account created successfully')) {
            setError('Account created successfully! Please try signing in with your credentials.');
          } else {
            setError(result.error || 'Failed to create account');
          }
        } else {
          if (result.error?.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');

          } else {
            setError(result.error || 'Invalid email or password');
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {isSignUp ? 'Email' : 'Email or Username'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={isSignUp ? "email" : "text"}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder={isSignUp ? "Enter your email" : "Enter email or username"}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password {isSignUp && <span className="text-gray-500">(minimum 6 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-12 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
                minLength={isSignUp ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {isSignUp && formData.password && formData.password.length < 6 && (
              <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters long</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setShowPassword(false);
                setFormData({ username: '', email: '', password: '' });
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              {isSignUp ? 'Sign in here' : 'Create one here'}
            </button>
          </p>
          {!isSignUp && (
            <p className="text-gray-500 text-xs mt-2">
              You can sign in with either your email address or username
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;