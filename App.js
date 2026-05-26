import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { NotificationProvider } from './app/providers';
import { useCognitiveStore } from './store/cognitive';
import TabNavigator from './components/TabNavigator';
import { useEffect } from 'react';

export default function App() {
  const { initialize } = useCognitiveStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <NotificationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Chat' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
        <Stack.Screen name="cognitive-flow" options={{ title: 'Thought Flow' }} />
        <Stack.Screen name="studio" options={{ title: 'AI Studio' }} />
        <Stack.Screen name="vault" options={{ title: 'Memory Vault' }} />
        <Stack.Screen name="insights" options={{ title: 'Insights' }} />
        <Stack.Screen name="vision" options={{ title: 'Vision' }} />
        <Stack.Screen name="premium" options={{ title: 'Premium' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="export" options={{ title: 'Export' }} />
        <Stack.Screen name="focus" options={{ title: 'Focus Mode' }} />
      </Stack>
      <StatusBar style="light" />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
});