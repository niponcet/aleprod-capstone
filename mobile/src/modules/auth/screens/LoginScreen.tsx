import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { supabase, isSupabaseConfigured } from '../../../core/api/supabase';

interface LoginScreenProps {
  onDevBypass?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onDevBypass }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert(
        'Modo Demostración / Supabase no configurado',
        'Las credenciales de Supabase aún no están configuradas en .env (EXPO_PUBLIC_SUPABASE_URL). ¿Deseas acceder en Modo Desarrollo a la app de terreno?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Entrar como Técnico (Dev)',
            onPress: () => onDevBypass?.(),
          },
        ]
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
        Alert.alert('Error de autenticación', error.message || 'Credenciales inválidas.');
      } else if (!data.session) {
        Alert.alert('Aviso', 'Iniciaste sesión pero no se obtuvo una sesión activa.');
      }
    } catch (err: any) {
      Alert.alert('Error de conexión', err?.message || 'No fue posible conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
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
            {/* 
              NOTA PARA DESARROLLO FUTURO:
              Para reemplazar por imagen de logo corporativo local cuando esté disponible:
              <Image 
                source={require('../../../../assets/logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            */}
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
              Ingresa tus credenciales para acceder al dashboard.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            {/* Campo Correo Electrónico */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="nombre@aleprod.cl"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
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
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Recuperación de Contraseña',
                    'Contacta al administrador del sistema en admin@aleprod.cl para reestablecer tus credenciales.'
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón Principal Gradiente */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={['#C87A08', '#F5C242']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.loginButtonText}>Ingresar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Acceso Rápido Dev (para pruebas sin backend) */}
            {onDevBypass && (
              <TouchableOpacity
                style={styles.devBypassButton}
                onPress={onDevBypass}
                activeOpacity={0.7}
              >
                <Text style={styles.devBypassText}>
                  ⚡ Acceso Rápido Terreno (Modo Dev)
                </Text>
              </TouchableOpacity>
            )}

            {/* Pie de Página */}
            <Text style={styles.footerText}>
              Acceso restringido a personal autorizado de Aleprod.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    height: '100%',
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
  loginButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devBypassButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  devBypassText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  footerText: {
    marginTop: 22,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
