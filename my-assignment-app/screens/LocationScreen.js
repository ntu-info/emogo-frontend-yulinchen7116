// screens/LocationScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';

export default function LocationScreen() {
  const [errorMsg, setErrorMsg] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // App 一進來就先試著拿一次
    getLocationOnce();
  }, []);

  async function getLocationOnce() {
    setErrorMsg(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('沒有取得定位權限');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log(location);
    setCoords(location.coords);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Demo</Text>
      <Button title="重新取得目前位置" onPress={getLocationOnce} />
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {coords ? (
        <View style={styles.coordsBox}>
          <Text>Latitude: {coords.latitude}</Text>
          <Text>Longitude: {coords.longitude}</Text>
          <Text>Accuracy: {coords.accuracy} m</Text>
        </View>
      ) : (
        <Text>尚未取得定位資料</Text>
      )}
      <Text style={styles.tip}>
        * Android 模擬器要開啟「模擬定位」；真機要開啟 GPS。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  error: { color: 'red' },
  coordsBox: { marginTop: 16 },
  tip: { marginTop: 16, fontSize: 12, color: 'gray' },
});
