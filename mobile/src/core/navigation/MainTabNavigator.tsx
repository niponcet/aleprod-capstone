import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { colors } from '../theme/colors';
import { LiquidGlassView } from '../components/LiquidGlassView';
import { triggerHaptic } from '../utils/haptics';
import { HomeScreen } from '../../modules/home-event/screens/HomeScreen';
import { ScannerScreen } from '../../modules/scanner-incidents/screens/ScannerScreen';
import { SettingsScreen } from '../../modules/settings-sync/screens/SettingsScreen';

export type MainTabParamList = {
  Home: undefined;
  Scanner: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabNavigatorProps {
  onSignOut?: () => void;
}

// Botón circular flotante azul sobresaliente en el centro con halo de cristal y label alineado
const FloatingScanButton: React.FC<BottomTabBarButtonProps> = ({ onPress, accessibilityState }) => {
  const isSelected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      style={styles.floatingButtonContainer}
      onPress={(e) => {
        triggerHaptic('medium');
        onPress?.(e);
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Escanear código QR"
    >
      <View style={styles.floatingButtonCircle}>
        {Platform.OS === 'ios' ? (
          <SymbolView
            name="qrcode.viewfinder"
            size={24}
            tintColor="#FFFFFF"
            fallback={<Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />}
          />
        ) : (
          <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
        )}
      </View>
      <Text style={[styles.floatingButtonLabel, isSelected && styles.floatingButtonLabelActive]}>
        Escanear
      </Text>
    </TouchableOpacity>
  );
};

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({ onSignOut }) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenListeners={({ route }) => ({
        tabPress: () => {
          if (route.name === 'Scanner') {
            triggerHaptic('medium');
          } else {
            triggerHaptic('selection');
          }
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 66,
          left: 36,
          right: 36,
          bottom: 26,
          paddingBottom: Platform.OS === 'ios' ? 6 : 6,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <LiquidGlassView
            borderRadius={33}
            style={[StyleSheet.absoluteFill, { borderRadius: 33 }]}
            intensity={85}
          />
        ),
        tabBarActiveTintColor: colors.primaryAmber,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      {/* Pestaña: Inicio */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) =>
            Platform.OS === 'ios' ? (
              <SymbolView
                name="house.fill"
                size={21}
                tintColor={color}
                fallback={<Ionicons name="home-outline" size={21} color={color} />}
              />
            ) : (
              <Ionicons name="home-outline" size={21} color={color} />
            ),
        }}
      />

      {/* Pestaña: Escanear (Botón flotante azul con label) */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Escanear',
          tabBarButton: (props) => <FloatingScanButton {...props} />,
        }}
      />

      {/* Pestaña: Ajustes */}
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) =>
            Platform.OS === 'ios' ? (
              <SymbolView
                name="gearshape.fill"
                size={21}
                tintColor={color}
                fallback={<Ionicons name="options-outline" size={21} color={color} />}
              />
            ) : (
              <Ionicons name="options-outline" size={21} color={color} />
            ),
        }}
      >
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  floatingButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    marginTop: -22,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingButtonLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '600',
    color: '#8E95A2',
  },
  floatingButtonLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

