// ══════════════════════════════════════════════════════════════
// INTENT — Tab Layout
// Bottom tab navigation for main screens
// ══════════════════════════════════════════════════════════════

import { Tabs } from 'expo-router'
import { Home, Target, MessageCircle, TrendingUp, Settings } from 'lucide-react-native'
import { colors, typography } from '../../src/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.brand[400],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.bodyMedium.fontFamily,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rescue',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color }) => <Target size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
