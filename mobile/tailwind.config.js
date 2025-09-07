/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Recipe Wizard Brand Colors
        wizard: {
          primary: '#3b82f6',      // Blue
          'primary-dark': '#2563eb',
          'primary-light': '#60a5fa',
          accent: '#8b5cf6',        // Purple
          'accent-dark': '#7c3aed',
          'accent-light': '#a78bfa',
        },
        // Light Mode
        light: {
          background: '#ffffff',
          'background-secondary': '#f8fafc',
          'background-tertiary': '#f1f5f9',
          surface: '#ffffff',
          'surface-secondary': '#f8fafc',
          border: '#e2e8f0',
          'border-light': '#f1f5f9',
          text: '#0f172a',
          'text-secondary': '#475569',
          'text-tertiary': '#64748b',
          'text-disabled': '#94a3b8',
        },
        // Dark Mode
        dark: {
          background: '#0f172a',     // Dark slate
          'background-secondary': '#1e293b',
          'background-tertiary': '#334155',
          surface: '#1e293b',
          'surface-secondary': '#334155',
          border: '#475569',
          'border-light': '#64748b',
          text: '#f8fafc',
          'text-secondary': '#cbd5e1',
          'text-tertiary': '#94a3b8',
          'text-disabled': '#64748b',
        },
        // Status Colors
        success: '#10b981',
        'success-light': '#34d399',
        warning: '#f59e0b',
        'warning-light': '#fbbf24',
        error: '#ef4444',
        'error-light': '#f87171',
        info: '#3b82f6',
        'info-light': '#60a5fa',
      },
      fontFamily: {
        'wizard': ['IM Fell English', 'serif'],
        'brand': ['Uncial Antiqua', 'serif'], 
        'display': ['Space Grotesk', 'sans-serif'],
        'body': ['Plus Jakarta Sans', 'Noto Sans', 'sans-serif'],
        'heading': ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'display-large': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-medium': ['2.75rem', { lineHeight: '1.2', fontWeight: '600' }], 
        'display-small': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-large': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'headline-medium': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-small': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
        'title-large': ['1.375rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-medium': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'title-small': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-large': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-small': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label-large': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label-medium': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label-small': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px  
        'md': '0.75rem',   // 12px
        'lg': '1rem',      // 16px
        'xl': '1.5rem',    // 24px
        '2xl': '2rem',     // 32px
        '3xl': '2.5rem',   // 40px
        '4xl': '3rem',     // 48px
      },
      borderRadius: {
        'xs': '0.25rem',   // 4px
        'sm': '0.375rem',  // 6px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.5rem',   // 24px
      },
      boxShadow: {
        'wizard-glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'wizard-glow-lg': '0 0 30px rgba(96, 165, 250, 0.6)',
        'surface': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'surface-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}

