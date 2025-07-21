import React, { createContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginUser, registerUser, logoutUser, fetchUserProfile, clearError, clearAuth } from '../store/slices/authSlice';
import { User, AuthTokens } from '../store/slices/authSlice';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    user_type?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  isSuperuser: boolean;
  isStaff: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, tokens, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Check if user is authenticated on app load
    if (isAuthenticated && tokens?.access) {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }, [isAuthenticated, tokens]);

  useEffect(() => {
    // Check for existing tokens on app load
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken && refreshToken && !isAuthenticated && !isLoading) {
      // Verify token and fetch user profile
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, isLoading]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      localStorage.setItem('access_token', result.tokens.access);
      localStorage.setItem('refresh_token', result.tokens.refresh);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    user_type?: string;
  }) => {
    try {
      const result = await dispatch(registerUser(userData)).unwrap();
      localStorage.setItem('access_token', result.tokens.access);
      localStorage.setItem('refresh_token', result.tokens.refresh);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await dispatch(logoutUser(refreshToken)).unwrap();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }
    
    // Always clear localStorage and Redux state
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Force clear Redux state to ensure user is logged out
    dispatch(clearAuth());
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const refreshProfile = async () => {
    try {
      await dispatch(fetchUserProfile()).unwrap();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError: handleClearError,
    refreshProfile,
    isSuperuser: user?.is_superuser || false,
    isStaff: user?.is_staff || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 