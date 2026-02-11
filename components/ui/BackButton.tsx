import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';

interface BackButtonProps {
  /**
   * The route to navigate to. 
   * - If provided (e.g., "/home"), it navigates there.
   * - If omitted, it calls router.back().
   */
  targetRoute?: string;
  
  /**
   * Optional callback to execute before navigation (e.g., play sound).
   */
  onPress?: () => void;
  
  style?: ViewStyle;
  color?: string;
  label?: string;
  showLabel?: boolean;
}

export default function BackButton({ 
  targetRoute, 
  onPress,
  style,
  color = "#6A1B9A", // Default purple to match existing theme
  label = "Back",
  showLabel = true
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = async () => {
    // 1. Stop any ongoing speech
    try {
      await Speech.stop();
    } catch (e) {
      console.log("Error stopping speech:", e);
    }

    // 2. Execute custom logic if provided
    if (onPress) {
      onPress();
    }

    // 3. Navigate
    if (targetRoute) {
      // Use navigate to ensure we go to the route (idempotent)
      router.navigate(targetRoute as any);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to home if can't go back
        router.navigate("/");
      }
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.button, style]}>
      <Ionicons name="arrow-back" size={24} color={color} />
      {showLabel && <Text style={[styles.text, { color }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
