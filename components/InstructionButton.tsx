import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface InstructionButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export default function InstructionButton({ onPress, style }: InstructionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.7}>
      <Ionicons name="volume-high" size={24} color="#FFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFB74D', // Orange accent for instructions
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
