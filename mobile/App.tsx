import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { initDB } from './src/db/database';

export default function App() {
  useEffect(() => {
    // Inicializar SQLite
    initDB();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScannerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
