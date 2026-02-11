import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface KidFriendlyCardProps {
  title: string;
  onPress: () => void;
  color?: string;
  index?: number; // For staggered animation
  icon?: string; // Emoji or simple text icon
  image?: ImageSourcePropType; // Optional image background
  style?: ViewStyle;
  enableTTS?: boolean; // Text-to-speech for the title
}

export default function KidFriendlyCard({
  title,
  onPress,
  color = '#FFFFFF',
  index = 0,
  icon,
  image,
  style,
  enableTTS = false,
}: KidFriendlyCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Helper to safely unload sound
  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch (e) {}
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  // Stop sound on blur (navigation away)
  useFocusEffect(
    useCallback(() => {
      return () => {
        unloadSound();
      };
    }, [])
  );

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Cleanup on unmount
    return () => {
      unloadSound();
    };
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    // 1. Play sound effect
    try {
      await unloadSound(); // Cleanup previous

      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/music/drop.mp3')
      );
      soundRef.current = sound;
      await sound.playAsync();
      
      // Unload after playing
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
             if (soundRef.current === sound) {
                 soundRef.current = null;
             }
             await sound.unloadAsync();
          } catch (e) {}
        }
      });
    } catch (e) {
      // Ignore sound error
    }

    // 2. TTS (Optional) - Audio Element
    if (enableTTS) {
      Speech.stop();
      Speech.speak(title, { rate: 1.0, pitch: 1.1 });
    }

    // 3. Navigate
    onPress();
  };

  const CardContent = () => (
    <>
      {icon && !image && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.title, image ? styles.titleWithImage : undefined]}>{title}</Text>
    </>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: color },
          image ? styles.cardWithImage : undefined,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {image ? (
          <ImageBackground
            source={image}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 25 }}
          >
            <View style={styles.overlay}>
              <CardContent />
            </View>
          </ImageBackground>
        ) : (
          <CardContent />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    minHeight: 100, // Ensure touch target size
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    flexDirection: 'row',
  },
  cardWithImage: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 120, // Taller for images
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Ensure text contrast
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    fontSize: 24, // Large readable text (Element 1)
    fontWeight: '700',
    color: '#2d3436',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-rounded' }),
  },
  titleWithImage: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  icon: {
    fontSize: 32,
    marginRight: 15,
  },
});
