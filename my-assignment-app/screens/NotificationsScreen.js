// screens/NotificationsScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_TIMES = [
  { hour: 9, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 21, minute: 0 },
];

export default function NotificationsScreen() {
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      Alert.alert('提醒', '通知功能需要在真機上測試');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      Alert.alert('提醒', '未取得通知權限，無法設定鬧鐘');
      return;
    }
  }

  async function setupDailyReminders() {
    await registerForPushNotificationsAsync();
    if (permissionStatus !== 'granted') return;

    // 先清掉舊的
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 設定每天三次
    for (const t of REMINDER_TIMES) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '記錄一下現在的心情吧 😊',
          body: '打開 App、拍一張照，選一個顏色紀錄心情。',
        },
        trigger: {
          hour: t.hour,
          minute: t.minute,
          repeats: true,
        },
      });
    }

    Alert.alert('已設定', '已設定每天三次心情提醒 🔔');
  }

  async function cancelReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('已取消', '已取消所有提醒');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>提醒設定</Text>
      <Text>目前通知權限：{permissionStatus || '未知'}</Text>
      <View style={styles.buttons}>
        <Button title="設定每天三次提醒" onPress={setupDailyReminders} />
      </View>
      <View style={styles.buttons}>
        <Button title="取消所有提醒" color="#b00020" onPress={cancelReminders} />
      </View>
      <Text style={styles.tip}>
        預設時間：09:00、14:00、21:00，會跳出「記錄心情」的通知。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  buttons: { marginVertical: 8 },
  tip: { marginTop: 16, fontSize: 12, color: 'gray', textAlign: 'center' },
});
