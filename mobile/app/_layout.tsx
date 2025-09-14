import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '../constants/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
            <Stack.Screen name="recipe-result" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
