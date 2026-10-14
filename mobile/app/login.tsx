import React from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '../src/modules/auth/screens/LoginScreen';
import { useAuth } from '../src/core/context/AuthContext';

export default function LoginRoute() {
  const router = useRouter();
  const { setDevBypass } = useAuth();

  return (
    <LoginScreen
      onDevBypass={() => {
        setDevBypass(true);
        router.replace('/(tabs)');
      }}
    />
  );
}
