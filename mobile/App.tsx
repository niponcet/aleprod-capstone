import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from './src/core/db/database';
import { AppNavigator } from './src/core/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Inicializar base de datos local SQLite
    initDB();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D10" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
