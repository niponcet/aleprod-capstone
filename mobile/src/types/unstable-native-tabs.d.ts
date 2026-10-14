import type React from 'react';
import type { NativeTabsTriggerLabelProps, NativeTabsTriggerIconProps } from 'expo-router/build/native-tabs';

declare module 'expo-router/unstable-native-tabs' {
  export * from 'expo-router/build/native-tabs';
  export const Label: React.FC<NativeTabsTriggerLabelProps>;
  export const Icon: React.FC<NativeTabsTriggerIconProps>;
}
