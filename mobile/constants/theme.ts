import { useColorScheme } from 'react-native';

// Brand Colors (static)
export const BRAND_COLORS = {
  wizard: {
    primary: '#3b82f6',      // Blue
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    accent: '#8b5cf6',       // Purple  
    accentDark: '#7c3aed',
    accentLight: '#a78bfa',
  },
  status: {
    success: '#10b981',
    successLight: '#34d399',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    error: '#ef4444',
    errorLight: '#f87171',
    info: '#3b82f6',
    infoLight: '#60a5fa',
  }
} as const;

// Light Theme Colors
export const LIGHT_THEME = {
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  surface: '#ffffff',
  surfaceSecondary: '#f8fafc',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textDisabled: '#94a3b8',
  textInverse: '#ffffff',
} as const;

// Dark Theme Colors
export const DARK_THEME = {
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  backgroundTertiary: '#334155',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  border: '#475569',
  borderLight: '#64748b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textDisabled: '#64748b',
  textInverse: '#0f172a',
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  fontFamily: {
    wizard: 'IM Fell English',
    brand: 'Uncial Antiqua',
    display: 'Space Grotesk',
    body: 'Plus Jakarta Sans',
    heading: 'Poppins',
  },
  fontSize: {
    displayLarge: 56,    // 3.5rem
    displayMedium: 44,   // 2.75rem
    displaySmall: 36,    // 2.25rem
    headlineLarge: 32,   // 2rem
    headlineMedium: 28,  // 1.75rem
    headlineSmall: 24,   // 1.5rem
    titleLarge: 22,      // 1.375rem
    titleMedium: 18,     // 1.125rem
    titleSmall: 14,      // 0.875rem
    bodyLarge: 16,       // 1rem
    bodyMedium: 14,      // 0.875rem
    bodySmall: 12,       // 0.75rem
    labelLarge: 14,      // 0.875rem
    labelMedium: 12,     // 0.75rem
    labelSmall: 11,      // 0.6875rem
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.5,
  }
} as const;

// Spacing Scale
export const SPACING = {
  xs: 4,     // 0.25rem
  sm: 8,     // 0.5rem
  md: 12,    // 0.75rem
  lg: 16,    // 1rem
  xl: 24,    // 1.5rem
  '2xl': 32, // 2rem
  '3xl': 40, // 2.5rem
  '4xl': 48, // 3rem
} as const;

// Border Radius
export const BORDER_RADIUS = {
  xs: 4,     // 0.25rem
  sm: 6,     // 0.375rem
  md: 8,     // 0.5rem
  lg: 12,    // 0.75rem
  xl: 16,    // 1rem
  '2xl': 24, // 1.5rem
  full: 9999,
} as const;

// Shadow Styles
export const SHADOWS = {
  wizard: {
    glow: {
      shadowColor: BRAND_COLORS.wizard.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    glowLarge: {
      shadowColor: BRAND_COLORS.wizard.primaryLight,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 30,
      elevation: 12,
    },
  },
  surface: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  surfaceLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
} as const;

// Theme Hook
export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const colors = {
    ...BRAND_COLORS,
    theme: isDark ? DARK_THEME : LIGHT_THEME,
  };
  
  return {
    colors,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    isDark,
    isLight: !isDark,
  };
}

// Theme-aware color helper
export function getThemeColor(colorPath: string, isDark: boolean = false) {
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  
  // Handle nested color paths like 'theme.background' or 'wizard.primary'
  if (colorPath.includes('.')) {
    const [category, color] = colorPath.split('.');
    
    if (category === 'theme') {
      return theme[color as keyof typeof theme];
    }
    
    if (category === 'wizard') {
      return BRAND_COLORS.wizard[color as keyof typeof BRAND_COLORS.wizard];
    }
    
    if (category === 'status') {
      return BRAND_COLORS.status[color as keyof typeof BRAND_COLORS.status];
    }
  }
  
  return colorPath; // Return as-is if not a theme color
}

// Common theme-aware styles
export const createThemeStyles = (isDark: boolean) => ({
  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: isDark ? DARK_THEME.background : LIGHT_THEME.background,
  },
  
  surfaceContainer: {
    backgroundColor: isDark ? DARK_THEME.surface : LIGHT_THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.surface,
  },
  
  // Text styles
  textPrimary: {
    color: isDark ? DARK_THEME.text : LIGHT_THEME.text,
    fontFamily: TYPOGRAPHY.fontFamily.body,
  },
  
  textSecondary: {
    color: isDark ? DARK_THEME.textSecondary : LIGHT_THEME.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.body,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: BRAND_COLORS.wizard.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.wizard.glow,
  },
  
  secondaryButton: {
    backgroundColor: isDark ? DARK_THEME.surface : LIGHT_THEME.surface,
    borderWidth: 1,
    borderColor: isDark ? DARK_THEME.border : LIGHT_THEME.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
  },
  
  // Input styles
  textInput: {
    backgroundColor: isDark ? DARK_THEME.surface : LIGHT_THEME.surface,
    borderWidth: 1,
    borderColor: isDark ? DARK_THEME.border : LIGHT_THEME.border,
    color: isDark ? DARK_THEME.text : LIGHT_THEME.text,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.fontSize.bodyLarge,
  },
});

export type Theme = ReturnType<typeof useTheme>;
export type ThemeColors = Theme['colors'];
export type ThemeTypography = Theme['typography'];