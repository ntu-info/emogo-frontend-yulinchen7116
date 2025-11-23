// screens/MoodScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';

// 使用新版 expo-sqlite API：同步打開資料庫
const db = SQLite.openDatabaseSync('mood.db');

const MOODS = [
  { score: 5, label: '超開心', emoji: '😁', color: '#4caf50' },
  { score: 4, label: '開心', emoji: '😊', color: '#8bc34a' },
  { score: 3, label: '普通', emoji: '😐', color: '#ffc107' },
  { score: 2, label: '有點鬱悶', emoji: '😕', color: '#ff9800' },
  { score: 1, label: '很難過', emoji: '😢', color: '#f44336' },
];

export default function MoodScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [selectedMood, setSelectedMood] = useState(3);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraRef = useRef(null);

  // 1️⃣ 建立資料表（關鍵修正：用 SQL 字串，而不是陣列）
  useEffect(() => {
    async function setupDb() {
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS moods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            mood INTEGER,
            photoUri TEXT,
            latitude REAL,
            longitude REAL
          );
        `;

        if (db.execAsync) {
          // 新 API：execAsync(sqlString)
          await db.execAsync(createTableSQL);
        } else if (db.runAsync) {
          // 有些版本只有 runAsync
          await db.runAsync(createTableSQL);
        } else if (db.transaction) {
          // 最保險的舊版 fallback
          await new Promise((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                createTableSQL,
                [],
                () => resolve(),
                (_, error) => {
                  reject(error);
                  return false;
                }
              );
            });
          });
        }

        console.log('moods table is ready');
      } catch (error) {
        console.log('Create table error:', error);
      }
    }

    setupDb();
  }, []);

  // 2️⃣ 開啟相機
  async function openCamera() {
    if (!permission || !permission.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('需要相機權限', '請在設定中開啟相機權限');
        return;
      }
    }
    setIsCameraOpen(true);
  }

  // 3️⃣ 拍照
  async function handleTakePhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
    }
  }

  // 4️⃣ 儲存心情紀錄
  async function saveMood() {
    if (!photoUri) {
      Alert.alert('提醒', '請先拍一張照片再紀錄心情');
      return;
    }

    let latitude = null;
    let longitude = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        console.log('Location:', loc);
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
    } catch (e) {
      console.log('Location error:', e);
    }

    const timestamp = new Date().toISOString();

    try {
      if (db.runAsync) {
        await db.runAsync(
          `INSERT INTO moods (timestamp, mood, photoUri, latitude, longitude)
           VALUES (?, ?, ?, ?, ?);`,
          [timestamp, selectedMood, photoUri, latitude, longitude]
        );
      } else if (db.transaction) {
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              `INSERT INTO moods (timestamp, mood, photoUri, latitude, longitude)
               VALUES (?, ?, ?, ?, ?);`,
              [timestamp, selectedMood, photoUri, latitude, longitude],
              () => resolve(),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          });
        });
      }

      Alert.alert('已儲存', '已紀錄這一刻的心情 😊');
    } catch (error) {
      console.log('Insert error:', error);
      Alert.alert('錯誤', '儲存失敗');
    }
  }

  // 5️⃣ 匯出資料
  async function exportData() {
    try {
      let rows = [];

      if (db.getAllAsync) {
        rows = await db.getAllAsync(
          'SELECT * FROM moods ORDER BY id DESC;'
        );
      } else if (db.transaction) {
        rows = await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM moods ORDER BY id DESC;',
              [],
              (_, result) => resolve(result.rows._array),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          });
        });
      }

      console.log('Export data:', rows);
      Alert.alert('匯出資料', JSON.stringify(rows, null, 2));
    } catch (error) {
      console.log('Select error:', error);
      Alert.alert('錯誤', '讀取資料失敗');
    }
  }

  // 相機全畫面
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />
        <View style={styles.cameraButtons}>
          <Button title="拍照" onPress={handleTakePhoto} />
          <Button
            title="取消"
            color="#b00020"
            onPress={() => setIsCameraOpen(false)}
          />
        </View>
      </View>
    );
  }

  // 主畫面：照片 + 心情條 + 儲存 + Export
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 上方照片區塊 */}
      <View style={styles.photoWrapper}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={{ color: '#777' }}>還沒有照片，先拍一張吧！</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.takePhotoButton} onPress={openCamera}>
        <Text style={styles.takePhotoText}>拍照</Text>
      </TouchableOpacity>

      {/* 心情表情列 */}
      <View style={styles.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity
            key={m.score}
            style={[
              styles.moodIcon,
              selectedMood === m.score && styles.moodIconSelected,
            ]}
            onPress={() => setSelectedMood(m.score)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 色條（依照分數上色） */}
      <View style={styles.barBackground}>
        {MOODS.map(m => {
          const active = selectedMood >= m.score;
          return (
            <View
              key={m.score}
              style={[
                styles.barSegment,
                { backgroundColor: active ? m.color : '#ddd' },
              ]}
            />
          );
        })}
      </View>

      {/* 儲存按鈕 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={saveMood}>
          <Text style={styles.saveButtonText}>儲存這一刻</Text>
        </TouchableOpacity>
      </View>

      {/* Export 按鈕 */}
      <View className="exportWrapper" style={styles.exportWrapper}>
        <TouchableOpacity style={styles.exportButton} onPress={exportData}>
          <Text style={styles.exportText}>Export →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  photoWrapper: {
    borderWidth: 4,
    borderColor: '#123456',
    padding: 4,
  },
  photo: {
    width: 220,
    height: 280,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  takePhotoButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1976d2',
  },
  takePhotoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 8,
  },
  moodIcon: {
    padding: 8,
    borderRadius: 999,
  },
  moodIconSelected: {
    backgroundColor: '#e3f2fd',
  },
  moodEmoji: {
    fontSize: 28,
  },
  barBackground: {
    flexDirection: 'row',
    width: '80%',
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  barSegment: {
    flex: 1,
  },
  bottomButtons: {
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exportWrapper: {
    marginTop: 16,
  },
  exportButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exportText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  cameraButtons: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
