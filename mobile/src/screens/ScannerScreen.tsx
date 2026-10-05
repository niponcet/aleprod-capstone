import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { insertIncidencia } from '../db/database';

export const ScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara para escanear los QR de las pantallas.
        </Text>
        <Button onPress={requestPermission} title="Otorgar Permiso" />
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    // Si ya procesamos un código recientemente, evitamos procesar ráfagas
    if (scanned) return;
    
    setScanned(true);

    try {
      insertIncidencia(data);
      
      Alert.alert(
        "Escaneo Exitoso",
        `Pantalla registrada localmente.\nUUID: ${data}`,
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el registro en la base de datos.");
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black'
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20
  }
});
