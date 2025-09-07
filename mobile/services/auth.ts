// Authentication service for handling user login/registration
import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  user: User;
}

// Backend response format
interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  };
}

// Secure storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Helper function to transform backend response to frontend format
function transformTokenResponse(backendResponse: BackendTokenResponse): AuthTokens {
  return {
    accessToken: backendResponse.access_token,
    tokenType: backendResponse.token_type,
    user: {
      id: backendResponse.user.id,
      email: backendResponse.user.email,
      username: backendResponse.user.username,
      firstName: backendResponse.user.firstName,
      lastName: backendResponse.user.lastName,
      isActive: backendResponse.user.isActive,
    },
  };
}

export class AuthService {
  /**
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      
      const response = await fetch(`${apiService.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const backendTokens: BackendTokenResponse = await response.json();
      const tokens = transformTokenResponse(backendTokens);
      
      // Store tokens securely
      await this.storeTokens(tokens);
      
      console.log('✅ Login successful for:', tokens.user.email);
      return tokens;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Register new user account
   */
  static async register(userData: RegisterData): Promise<AuthTokens> {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await fetch(`${apiService.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const backendTokens: BackendTokenResponse = await response.json();
      const tokens = transformTokenResponse(backendTokens);
      
      // Store tokens securely
      await this.storeTokens(tokens);
      
      console.log('✅ Registration successful for:', tokens.user.email);
      return tokens;
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear stored tokens
   */
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if user is authenticated
      const token = await this.getStoredToken();
      if (token) {
        try {
          await fetch(`${apiService.baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.warn('⚠️ Logout API call failed, continuing with local cleanup:', error);
        }
      }

      // Clear stored data
      await this.clearTokens();
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  /**
   * Store authentication tokens securely
   */
  static async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(tokens.user));
  }

  /**
   * Clear stored authentication data
   */
  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  /**
   * Get stored authentication token
   */
  static async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  /**
   * Get stored user data
   */
  static async getStoredUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user is currently authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    const user = await this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<AuthTokens | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${apiService.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        await this.clearTokens();
        return null;
      }

      const backendTokens: BackendTokenResponse = await response.json();
      const newTokens = transformTokenResponse(backendTokens);
      await this.storeTokens(newTokens);
      
      console.log('✅ Token refreshed successfully');
      return newTokens;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Validate current token with backend
   */
  static async validateToken(): Promise<User | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${apiService.baseUrl}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await this.clearTokens();
        return null;
      }

      const result = await response.json();
      if (result.valid) {
        return result.user;
      } else {
        await this.clearTokens();
        return null;
      }
      
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      await this.clearTokens();
      return null;
    }
  }
}

export default AuthService;