import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';

export default function TabLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const bg = dark ? '#111827' : '#ffffff';
  const active = '#16a34a';
  const inactive = dark ? '#6b7280' : '#9ca3af';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: bg, borderTopColor: dark ? '#1f2937' : '#e5e7eb' },
      tabBarActiveTintColor: active,
      tabBarInactiveTintColor: inactive,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <TabIcon emoji="📈" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <TabIcon emoji="☰" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
