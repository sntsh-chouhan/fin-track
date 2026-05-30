import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  // Dismiss keyboard when alert opens
  if (visible) {
    Keyboard.dismiss();
  }

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'confirm':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10b981'; // Green
      case 'error':
        return '#ef4444'; // Red
      case 'confirm':
        return '#f97316'; // Orange
      case 'info':
      default:
        return colors.accent;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableWithoutFeedback>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={getIconName()} size={54} color={getIconColor()} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

            {/* Button Layout */}
            <View style={styles.buttonContainer}>
              {type === 'confirm' ? (
                <>
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={[styles.btn, styles.btnCancel, { backgroundColor: colors.inputBg }]}
                  >
                    <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={[styles.btn, styles.btnConfirm, { backgroundColor: type === 'confirm' && title.toLowerCase().includes('delete') ? '#ef4444' : colors.primary }]}
                  >
                    <Text style={[styles.btnText, { color: type === 'confirm' && title.toLowerCase().includes('delete') ? '#ffffff' : colors.primaryInverse }]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[styles.btn, styles.btnSingle, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.btnText, { color: colors.primaryInverse }]}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '82%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  btn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSingle: {
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    marginRight: 8,
  },
  btnConfirm: {
    flex: 1,
    marginLeft: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
