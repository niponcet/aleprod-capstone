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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenSafeContainer } from '../../../core/components/ScreenSafeContainer';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
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
        // Redirección cliente estricta con Expo Router (cero escape a Safari)
        router.replace('/');
      }
      // Al ser exitoso, supabase.auth.onAuthStateChange en AuthContext
      // actualizará la sesión y la navegación redirigirá a la aplicación.
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
      {/* Glow ambiental superior dorado corporativo */}
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.14)', 'rgba(7, 11, 20, 0.4)', 'transparent']}
        locations={[0, 0.45, 1]}
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
          {/* Logo Superior Corporativo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitials}>AP</Text>
            </View>
            <Text style={styles.logoBrandName}>ALEJANDRA PRODUCCIONES</Text>
          </View>

          {/* Encabezado */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Iniciar sesión</Text>
            <View style={styles.titleAccentBar} />
            <Text style={styles.subtitle}>
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
                  color={isEmailFocused ? colors.primaryAmber : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholder="tecnico@aleprod.cl"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  selectionColor={colors.primaryAmber}
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
                  color={isPasswordFocused ? colors.primaryAmber : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  editable={!loading}
                  selectionColor={colors.primaryAmber}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={isPasswordFocused ? colors.primaryAmber : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Fila de Opciones: Recordarme / Olvidaste Contraseña */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón Principal Gradiente */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
            >
              <LinearGradient
                colors={loading ? ['#6E4506', '#9B7B2B'] : ['#C87A08', '#F5C242']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.textInverse} />
                    <Text style={[styles.loginButtonText, styles.loadingText]}>
                      Iniciando sesión...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Ingresar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Pie de Página */}
            <Text style={styles.footerText}>
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
    backgroundColor: '#070B14',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: 0,
    transform: [{ translateZ: 0 } as any],
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 10,
  },
  logoInitials: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoBrandName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  headerSection: {
    marginBottom: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleAccentBar: {
    width: 42,
    height: 3.5,
    backgroundColor: colors.primaryAmber,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primaryAmber,
    backgroundColor: '#181C26',
    shadowColor: colors.primaryAmber,
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
    color: colors.textPrimary,
    fontSize: 16,
    height: '100%',
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '500',
  },
  buttonWrapper: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerText: {
    marginTop: 22,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
