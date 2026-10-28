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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { supabase } from '../../../core/api/supabase';

export const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSendResetEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert(
        'Correo requerido',
        'Por favor ingresa tu correo electrónico corporativo registrado.'
      );
      return;
    }

    // Validación básica de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Formato inválido', 'Ingresa una dirección de correo válida.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : 'aleprod://reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        Alert.alert(
          'Error al solicitar recuperación',
          error.message || 'No se pudo enviar el correo de recuperación. Inténtalo nuevamente.'
        );
        return;
      }

      setSentSuccess(true);
    } catch (err: any) {
      Alert.alert(
        'Error de conexión',
        err?.message || 'No fue posible conectar con el servidor. Revisa tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Botón Volver */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#CBD5E1" />
            <Text style={styles.backButtonText}>Volver al inicio</Text>
          </TouchableOpacity>

          {/* Logo Superior Corporativo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitials}>AP</Text>
            </View>
            <Text style={styles.logoBrandName}>ALEJANDRA PRODUCCIONES</Text>
          </View>

          {sentSuccess ? (
            /* Vista de Éxito */
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <Ionicons name="mail-open-outline" size={32} color="#D4AF37" />
              </View>
              <Text style={styles.successTitle}>Correo Enviado</Text>
              <Text style={styles.successMessage}>
                Hemos enviado un enlace de recuperación a:
              </Text>
              <Text style={styles.successEmailHighlight}>{email.trim()}</Text>
              <Text style={styles.successInstructions}>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña corporativa.
              </Text>

              <TouchableOpacity
                onPress={handleBackToLogin}
                activeOpacity={0.85}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#C87A08', '#F5C242']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Entendido, ir al Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Formulario de Recuperación */
            <View style={styles.formContainer}>
              <View style={styles.headerSection}>
                <Text style={styles.title}>Recuperar Contraseña</Text>
                <View style={styles.titleAccentBar} />
                <Text style={styles.subtitle}>
                  Ingresa tu correo corporativo y te enviaremos un enlace seguro para restablecer tus credenciales.
                </Text>
              </View>

              {/* Input Correo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="tecnico@aleprod.cl"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Botón Principal Gradiente */}
              <TouchableOpacity
                onPress={handleSendResetEmail}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={loading ? ['#6E4506', '#9B7B2B'] : ['#C87A08', '#F5C242']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#0B0D10" />
                      <Text style={[styles.primaryButtonText, styles.loadingText]}>
                        Enviando enlace...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonInnerRow}>
                      <Ionicons
                        name="paper-plane-outline"
                        size={18}
                        color="#0B0D10"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primaryButtonText}>Enviar Instrucciones</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Ayuda adicional */}
              <View style={styles.helpBox}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.helpText}>
                  Si no recuerdas tu correo o no recibes el enlace, contacta a Gerencia en{' '}
                  <Text style={styles.helpLink}>admin@aleprod.cl</Text>
                </Text>
              </View>
            </View>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E1B10',
    borderWidth: 2,
    borderColor: colors.primaryAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoInitials: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primaryAmber,
    letterSpacing: 2,
  },
  logoBrandName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: '#121620',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  titleAccentBar: {
    width: 36,
    height: 3,
    backgroundColor: colors.primaryAmber,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#0B0D10',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  helpText: {
    flex: 1,
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    marginLeft: 8,
  },
  helpLink: {
    color: colors.primaryAmber,
    fontWeight: '600',
  },
  // Tarjeta de Éxito
  successCard: {
    backgroundColor: '#121620',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
  },
  successEmailHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryAmber,
    marginBottom: 12,
  },
  successInstructions: {
    fontSize: 12.5,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});
