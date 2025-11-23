// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="camera"
        options={{ title: '紀錄心情' }}   // 這個會使用 MoodScreen
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: '提醒設定' }}
      />
      <Tabs.Screen
        name="location"
        options={{ title: 'Location Demo' }}
      />
    </Tabs>
  );
}
