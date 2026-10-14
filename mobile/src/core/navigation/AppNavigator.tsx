import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { colors } from '../theme/colors';
import { LoginScreen } from '../../modules/auth/screens/LoginScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { AssetDetailScreen } from '../../modules/scanner-incidents/screens/AssetDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AssetDetail: {
    uuid?: string;
    title?: string;
    status?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Escuchar cambios de autenticación en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      if (session) {
        await supabase.auth.signOut();
      }
    } catch {}
    setDevBypass(false);
    setSession(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAuthenticated = Boolean(session || devBypass);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {() => <LoginScreen onDevBypass={() => setDevBypass(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
            >
              {() => <MainTabNavigator onSignOut={handleSignOut} />}
            </Stack.Screen>

            <Stack.Screen
              name="AssetDetail"
              component={AssetDetailScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
