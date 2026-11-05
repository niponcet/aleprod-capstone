import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenSafeContainer } from '../../../core/components/ScreenSafeContainer';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../core/api/supabase';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@aleprod_saved_email')
      .then((savedEmail) => {
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      })
      .catch((e) => console.warn('Error al leer correo recordado:', e));
  }, []);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert(
        'Campos requeridos',
        'Por favor ingresa tu correo electrónico y contraseña corporativa.'
      );
      return;
    }

    Keyboard.dismiss();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo(0, 0);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          errorMessage = 'Credenciales inválidas. Por favor verifica tu correo y contraseña.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Tu cuenta de correo aún no ha sido confirmada.';
        }

        Alert.alert('Error de inicio de sesión', errorMessage);
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Sesión no iniciada',
          'No se pudo establecer una sesión activa con el servidor.'
        );
      } else {
        // Persistir o limpiar el correo según la preferencia de Recordarme
        if (rememberMe) {
          await AsyncStorage.setItem('@aleprod_saved_email', trimmedEmail);
        } else {
          await AsyncStorage.removeItem('@aleprod_saved_email');
        }

        // En Web/PWA: asegurar repliegue total del teclado virtual y reflow antes de montar vistas principales
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          window.scrollTo(0, 0);
          const root = document.getElementById('root');
          if (root) {
            root.style.display = 'none';
            root.offsetHeight; // Forzar reflow en WebKit
            root.style.display = 'flex';
          }
          await new Promise((r) => setTimeout(r, 120));
        }

        // Redirección cliente estricta con Expo Router (cero escape a Safari)
        router.replace('/');
      }
    } catch (err: any) {
      Alert.alert(
        'Error de conexión',
        err?.message || 'No fue posible conectar con el servidor. Revisa tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />

      {/* Glow ambiental superior con fusión pura a la status bar negra (sin halos azules invasivos) */}
      <LinearGradient
        colors={[
          '#000000',
          '#000000',
          'rgba(25, 40, 80, 0.16)',
          'rgba(15, 25, 50, 0.06)',
          'transparent',
        ]}
        locations={[0, 0.25, 0.55, 0.8, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      <ScreenSafeContainer style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Superior Corporativo con Logo Oficial de Marca */}
            <View style={styles.headerRow}>
              <View style={styles.logoBadgeContainer}>
                <Image
                  source={require('../../../../assets/icon.png')}
                  style={styles.logoBadge}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.headerTexts}>
                <Text style={styles.brandSubtitle}>ALEJANDRA PRODUCCIONES</Text>
                <Text style={styles.greetingTitle}>Hola, qué bueno verte de nuevo</Text>
              </View>
            </View>

            {/* Tarjeta de Inicio de Sesión */}
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Iniciar sesión</Text>
                <Text style={styles.cardSubtitle}>
                  Ingresa tus credenciales para acceder a la operación en terreno.
                </Text>
              </View>

              {/* Formulario */}
              <View style={styles.formSection}>
                {/* Campo Correo Electrónico */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
                  <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={isEmailFocused ? '#8FA8FF' : '#8A93A8'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="tecnico@aleprod.cl"
                      placeholderTextColor="#8A93A8"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Campo Contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                  <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={isPasswordFocused ? '#8FA8FF' : '#8A93A8'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••••••"
                      placeholderTextColor="#8A93A8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={showPassword ? '#8FA8FF' : '#8A93A8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Fila Opciones: Recordarme & Olvidé contraseña */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Recordarme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón Principal Ingresar */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.submitButtonTouchable}
                >
                  <LinearGradient
                    colors={['#4A74FF', '#2F55E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Ingresar</Text>
                        <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Aviso de Acceso Restringido */}
            <View style={styles.restrictedNotice}>
              <View style={styles.shieldIconBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#8FA8FF" />
              </View>
              <Text style={styles.restrictedText}>
                Acceso restringido a personal técnico autorizado de Aleprod.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenSafeContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 0,
    ...Platform.select({
      web: {
        transform: [{ translateZ: 0 } as any],
      },
    }),
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },

  /* Header Superior */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: Platform.OS === 'web' ? 20 : 12,
    marginBottom: 26,
  },
  logoBadgeContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    // Cero glow azul: sombra oscura sobria
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  brandSubtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2.6,
    color: '#8FA8FF',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },

  /* Tarjeta de Inicio de Sesión */
  cardContainer: {
    backgroundColor: 'rgba(17, 22, 34, 0.94)',
    borderWidth: 1,
    borderColor: '#1F2638',
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 10,
    marginBottom: 20,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9AA3B8',
  },

  /* Formulario */
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#9AA3B8',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C101A',
    borderWidth: 1,
    borderColor: '#232B3F',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: '#4C6FFF',
    backgroundColor: '#0E1322',
    shadowColor: '#4C6FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F2F4FA',
    fontSize: 16,
    height: '100%',
    backgroundColor: 'transparent',
    outlineStyle: 'none',
  } as any,
  eyeButton: {
    padding: 6,
  },

  /* Fila Opciones */
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 22,
    minHeight: 38,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#232B3F',
    backgroundColor: '#0C101A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  checkboxChecked: {
    borderColor: '#3B63F0',
    backgroundColor: '#3B63F0',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#E6EAF5',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#8FA8FF',
  },

  /* Botón Principal (sin glow azul) */
  submitButtonTouchable: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Aviso Restringido */
  restrictedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: '#0E1320',
    borderWidth: 1,
    borderColor: '#1A2132',
    marginTop: 10,
  },
  shieldIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#141B2D',
    borderWidth: 1,
    borderColor: '#232B3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#9AA3B8',
  },
});
