import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/ThemeProvider';

export default function TabLayout() {
  const { theme, isDark } = useAppTheme();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.wizard.primary,
          tabBarInactiveTintColor: theme.colors.theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.theme.surface,
            borderTopColor: theme.colors.theme.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
        }}>
      <Tabs.Screen
        name="prompt"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chef-hat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Shopping List',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </SafeAreaProvider>
  );
}