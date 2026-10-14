import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '../../src/modules/settings-sync/screens/SettingsScreen';
import { useAuth } from '../../src/core/context/AuthContext';

export default function SettingsRoute() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <SettingsScreen
      onSignOut={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
