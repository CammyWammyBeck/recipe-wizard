import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, usePaperTheme } from '../constants/ThemeProvider';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PremiumProvider } from '../contexts/PremiumContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';

function ThemedPaperProvider({ children }: { children: React.ReactNode }) {
  const paperTheme = usePaperTheme();
  return (
    <PaperProvider theme={paperTheme}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedPaperProvider>
        <PremiumProvider>
          <AuthProvider>
            <PreferencesProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-result" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/manage" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/plans" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/benefits" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/payment" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/payment-success" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/payment-failure" options={{ headerShown: false }} />
                <Stack.Screen name="subscription/payment-history" options={{ headerShown: false }} />
                <Stack.Screen name="settings/account" options={{ headerShown: false }} />
                <Stack.Screen name="settings/dietary" options={{ headerShown: false }} />
                <Stack.Screen name="settings/allergens" options={{ headerShown: false }} />
                <Stack.Screen name="settings/categories" options={{ headerShown: false }} />
                <Stack.Screen name="settings/instructions" options={{ headerShown: false }} />
                <Stack.Screen name="settings/about" options={{ headerShown: false }} />
              </Stack>
            </PreferencesProvider>
          </AuthProvider>
        </PremiumProvider>
      </ThemedPaperProvider>
    </ThemeProvider>
  );
}
