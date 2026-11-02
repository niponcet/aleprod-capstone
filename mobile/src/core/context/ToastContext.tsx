import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from '../components/LiquidGlassView';
import { colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';
import { useEdgeInsets } from '../hooks/useEdgeInsets';

export type ToastType = 'success' | 'offline' | 'warning' | 'error' | 'info';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  code?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { insets } = useEdgeInsets();

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [toastAnim]);

  const showToast = useCallback((options: ToastOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast(options);

    // Haptics acorde al tipo de notificación
    if (options.type === 'success') {
      triggerHaptic('success');
    } else if (options.type === 'offline' || options.type === 'warning') {
      triggerHaptic('warning');
    } else if (options.type === 'error') {
      triggerHaptic('error');
    } else {
      triggerHaptic('light');
    }

    Animated.spring(toastAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, options.durationMs || 3500);
  }, [hideToast, toastAnim]);

  const getIconAndColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          border: 'rgba(16, 185, 129, 0.45)',
          bg: 'rgba(16, 185, 129, 0.14)',
        };
      case 'offline':
        return {
          icon: 'cloud-offline' as const,
          color: colors.primaryAmber,
          border: 'rgba(245, 158, 11, 0.50)',
          bg: 'rgba(245, 158, 11, 0.14)',
        };
      case 'warning':
        return {
          icon: 'alert-circle' as const,
          color: '#F59E0B',
          border: 'rgba(245, 158, 11, 0.45)',
          bg: 'rgba(245, 158, 11, 0.14)',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#EF4444',
          border: 'rgba(239, 68, 68, 0.45)',
          bg: 'rgba(239, 68, 68, 0.14)',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: '#60A5FA',
          border: 'rgba(96, 165, 250, 0.45)',
          bg: 'rgba(96, 165, 250, 0.14)',
        };
    }
  };

  const topOffset =
    Platform.OS === 'web'
      ? ('max(calc(env(safe-area-inset-top, 0px) + 12px), 24px)' as any)
      : Math.max(insets.top + 8, 24);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[styles.toastWrapper, { top: topOffset }]}
        >
          <Animated.View
            style={[
              styles.toastAnimatedContainer,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={hideToast}
              style={styles.touchableArea}
            >
              <LiquidGlassView
                borderRadius={16}
                intensity={85}
                style={[
                  styles.toastCard,
                  { borderColor: getIconAndColors(toast.type).border },
                ]}
              >
                <View
                  style={[
                    styles.toastIconWrapper,
                    { backgroundColor: getIconAndColors(toast.type).bg },
                  ]}
                >
                  <Ionicons
                    name={getIconAndColors(toast.type).icon}
                    size={20}
                    color={getIconAndColors(toast.type).color}
                  />
                </View>

                <View style={styles.toastContent}>
                  <View style={styles.toastHeaderRow}>
                    <Text
                      style={[
                        styles.toastTitle,
                        { color: getIconAndColors(toast.type).color },
                      ]}
                    >
                      {toast.title}
                    </Text>
                    {toast.code ? (
                      <Text style={styles.toastCode} numberOfLines={1}>
                        #{toast.code.slice(-6).toUpperCase()}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.toastMessage}>{toast.message}</Text>
                </View>
              </LiquidGlassView>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastAnimatedContainer: {
    width: '100%',
    maxWidth: 440,
  },
  touchableArea: {
    width: '100%',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 15, 28, 0.88)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  toastIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastContent: {
    flex: 1,
  },
  toastHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  toastTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toastCode: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  toastMessage: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
  },
});
