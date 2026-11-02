import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { triggerHaptic } from '../utils/haptics';

export interface InfoModalProps {
  visible: boolean;
  title: string;
  description: string;
  buttonText?: string;
  onClose: () => void;
}

/**
 * Modal informativo universal para Aleprod Móvil.
 * Reemplaza Alert.alert y window.alert para avisos, manuales y soporte técnico,
 * preservando la inmersión visual Dark Navy del sistema de diseño.
 */
export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  description,
  buttonText = 'Entendido',
  onClose,
}) => {
  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#121620',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  closeButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default InfoModal;

