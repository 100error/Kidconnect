import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';

interface InstructionModalProps {
  visible: boolean;
  onClose: () => void;
  instructionText: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title?: string;
}

const { width } = Dimensions.get('window');

const InstructionModal: React.FC<InstructionModalProps> = ({
  visible,
  onClose,
  instructionText,
  iconName = 'bulb',
  title = "How to Play"
}) => {

  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is ready
      const timer = setTimeout(() => {
        Speech.speak(instructionText, { rate: 0.9 });
      }, 500);
      return () => {
        clearTimeout(timer);
        Speech.stop();
      };
    } else {
        Speech.stop();
    }
  }, [visible, instructionText]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
            <LinearGradient
              colors={['#FFF9C4', '#FFF176']} // Soft yellow gradient
              style={styles.header}
            >
                <Ionicons name={iconName} size={40} color="#F57F17" />
                <Text style={styles.title}>{title}</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.text}>{instructionText}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onClose}>
                <LinearGradient
                    colors={['#4CAF50', '#66BB6A']}
                    style={styles.gradientButton}
                >
                    <Text style={styles.buttonText}>Got it!</Text>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F57F17',
    marginTop: 10,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 28,
  },
  button: {
    margin: 20,
    marginTop: 0,
    borderRadius: 50,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default InstructionModal;
