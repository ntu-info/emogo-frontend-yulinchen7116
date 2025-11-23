// screens/CameraScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>正在檢查相機權限…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>
          需要相機權限才能使用此功能。
        </Text>
        <Button onPress={requestPermission} title="給予權限" />
      </View>
    );
  }

  async function takePhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log(photo);
      setPhotoUri(photo.uri);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Demo</Text>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="back"
      />
      <Button title="拍照" onPress={takePhoto} />
      {photoUri && (
        <View style={styles.previewContainer}>
          <Text>預覽：</Text>
          <Image source={{ uri: photoUri }} style={styles.preview} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  camera: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  previewContainer: { marginTop: 16, alignItems: 'center' },
  preview: { width: 200, height: 200, borderRadius: 8 },
});
