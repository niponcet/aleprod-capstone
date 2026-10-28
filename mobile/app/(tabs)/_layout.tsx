import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { LiquidGlassTabBar } from '../../src/core/components/LiquidGlassTabBar';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#070B14' }}>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          sceneStyle: { backgroundColor: 'transparent' },
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
    </View>
  );
}
