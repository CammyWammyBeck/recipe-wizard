// Authentication context for managing global auth state
import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService, { User, LoginCredentials, RegisterData, AuthTokens } from '../services/auth';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = !!user;

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // console.log('🔄 Initializing authentication...');
      
      // Check if user has stored tokens
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        // Validate tokens with backend
        const validUser = await AuthService.validateToken();
        
        if (validUser) {
          setUser(validUser);
          // console.log('✅ Authentication restored for:', validUser.email);
        } else {
          // Tokens invalid, try refresh
          // console.log('⚠️ Stored tokens invalid, attempting refresh...');
          const refreshResult = await AuthService.refreshToken();
          
          if (refreshResult) {
            setUser(refreshResult.user);
            // console.log('✅ Authentication refreshed for:', refreshResult.user.email);
          } else {
            // console.log('❌ Token refresh failed, user needs to login');
          }
        }
      } else {
        // console.log('ℹ️ No stored authentication found');
      }
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const tokens = await AuthService.login(credentials);
      setUser(tokens.user);
      
      // console.log('✅ User logged in:', tokens.user.email);
      
    } catch (error) {
      console.error('❌ Login failed in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      const tokens = await AuthService.register(userData);
      setUser(tokens.user);
      
      // console.log('✅ User registered:', tokens.user.email);
      
    } catch (error) {
      console.error('❌ Registration failed in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await AuthService.logout();
      setUser(null);
      
      // console.log('✅ User logged out');
      
    } catch (error) {
      console.error('❌ Logout failed in context:', error);
      // Even if logout API fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      await AuthService.deleteAccount();
      setUser(null);
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshResult = await AuthService.refreshToken();
      
      if (refreshResult) {
        setUser(refreshResult.user);
        // console.log('✅ Auth refreshed in context');
      } else {
        setUser(null);
        // console.log('❌ Auth refresh failed, user logged out');
      }
      
    } catch (error) {
      console.error('❌ Auth refresh error:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    // State
    user,
    isLoading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    deleteAccount,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;