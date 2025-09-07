import { Stack } from 'expo-router';
import { ThemeProvider } from '../constants/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="prompt" options={{ headerShown: false }} />
        <Stack.Screen name="recipe-result" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
