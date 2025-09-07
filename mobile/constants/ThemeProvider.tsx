import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BRAND_COLORS, 
  LIGHT_THEME, 
  DARK_THEME,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS
} from './theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: {
    colors: {
      wizard: typeof BRAND_COLORS.wizard;
      status: typeof BRAND_COLORS.status;
      theme: typeof LIGHT_THEME | typeof DARK_THEME;
    };
    typography: typeof TYPOGRAPHY;
    spacing: typeof SPACING;
    borderRadius: typeof BORDER_RADIUS;
    shadows: typeof SHADOWS;
  };
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@RecipeWizard:theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine the effective theme based on mode and system preference
  const getEffectiveTheme = (mode: ThemeMode, systemScheme: 'light' | 'dark' | null): 'light' | 'dark' => {
    if (mode === 'system') {
      return systemScheme || 'dark'; // Default to dark if system scheme is null
    }
    return mode;
  };
  
  const effectiveTheme = getEffectiveTheme(themeMode, systemColorScheme);
  const isDark = effectiveTheme === 'dark';
  
  // Build the theme object with the correct colors
  const theme = {
    colors: {
      wizard: BRAND_COLORS.wizard,
      status: BRAND_COLORS.status,
      theme: isDark ? DARK_THEME : LIGHT_THEME,
    },
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
  };
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Save theme preference when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };
  
  // Don't render children until theme is loaded
  if (isLoading) {
    return null; // or a loading screen if desired
  }
  
  const contextValue: ThemeContextType = {
    themeMode,
    setThemeMode,
    theme,
    isDark,
    isLight: !isDark,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useAppTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Utility hook for components that just need colors and basic theme info
export function useThemeColors() {
  const { theme, isDark, isLight } = useAppTheme();
  
  return {
    ...theme.colors,
    isDark,
    isLight,
  };
}

// Helper hook for creating theme-aware styles
export function useThemedStyles<T extends Record<string, any>>(
  styleFactory: (theme: ThemeContextType['theme'], isDark: boolean) => T
): T {
  const { theme, isDark } = useAppTheme();
  return styleFactory(theme, isDark);
}