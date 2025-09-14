import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '../constants/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { PremiumProvider } from '../contexts/PremiumContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <ThemeProvider>
        <PremiumProvider>
          <AuthProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
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
            </Stack>
          </AuthProvider>
        </PremiumProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
