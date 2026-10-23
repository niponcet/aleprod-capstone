import React from 'react';
import { Tabs } from 'expo-router';
import { LiquidGlassTabBar } from '../../src/core/components/LiquidGlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="eventos"
        options={{
          title: 'Eventos',
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
        }}
      />
    </Tabs>
  );
}
